/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { createTestApp } from '../../../test/test-app';
import { recordAudit } from '../audit/audit';
import { RequestContext } from '../context/request-context';
import { PrismaService } from '../db/prisma.service';
import { QUEUES, QueueService } from '../queue/queue.service';
import { EventBus, type SystemTx } from './event-bus';
import { emitEvent, type DomainEvent } from './outbox';
import { OutboxDispatcher } from './outbox-dispatcher';

/**
 * The reliable-events pipeline on a real PostgreSQL (RLS role) and Redis:
 * request transaction → outbox row → dispatcher → BullMQ → consumers, exactly once per consumer.
 */
describe('outbox and event bus', () => {
  const run = randomUUID().slice(0, 8);
  let app: INestApplication;
  let prisma: PrismaService;
  let queues: QueueService;
  let dispatcher: OutboxDispatcher;
  let bus: EventBus;
  let orgId: string;

  const eventName = `test.${run}.happened`;
  const pending = () =>
    prisma.system.outboxEvent.findMany({ where: { name: { startsWith: `test.${run}.` } } });

  beforeAll(async () => {
    process.env['QUEUE_PREFIX'] = `seven-test-${run}`;
    app = await createTestApp();
    prisma = app.get(PrismaService);
    queues = app.get(QueueService);
    dispatcher = app.get(OutboxDispatcher);
    bus = app.get(EventBus);
    orgId = (await prisma.system.organization.create({ data: { slug: `ev-${run}`, name: 'Events' } })).id;
  });

  afterAll(async () => {
    await prisma.system.outboxEvent.deleteMany({ where: { name: { startsWith: `test.${run}.` } } });
    await prisma.system.auditLog.deleteMany({ where: { orgId } });
    await prisma.system.organization.delete({ where: { id: orgId } });
    await queues.queue(QUEUES.events).obliterate({ force: true });
    await app.close();
  });

  it('writes the event in the request transaction (as the RLS app role) with request meta', async () => {
    await RequestContext.run({ requestId: `req-${run}`, userId: randomUUID(), orgId }, () =>
      prisma.withOrg(orgId, (tx) => emitEvent(tx, eventName, { n: 1 })),
    );
    const rows = await pending();
    expect(rows).toHaveLength(1);
    expect(rows[0].orgId).toBe(orgId);
    expect(rows[0].payload).toMatchObject({ data: { n: 1 }, meta: { requestId: `req-${run}` } });
  });

  it('drops the event when the transaction rolls back', async () => {
    await expect(
      prisma.withOrg(orgId, async (tx) => {
        await emitEvent(tx, `test.${run}.rolled_back`, {}, orgId);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect((await pending()).filter((r) => r.name.endsWith('rolled_back'))).toHaveLength(0);
  });

  it('allows a global (organization-less) event from the RLS role', async () => {
    await prisma.withOrg(orgId, (tx) => emitEvent(tx, `test.${run}.global`, {}, null));
    expect((await pending()).find((r) => r.name.endsWith('global'))?.orgId).toBeNull();
  });

  it('cannot emit an event for another organization (RLS)', async () => {
    await expect(
      prisma.withOrg(orgId, (tx) => emitEvent(tx, `test.${run}.foreign`, {}, randomUUID())),
    ).rejects.toThrow(/row-level security/i);
  });

  it('dispatches each event once, with the event id as the job id', async () => {
    // Other suites may have left events behind: drain everything, then nothing is left.
    let total = 0;
    for (let n = await dispatcher.dispatchBatch(); n > 0; n = await dispatcher.dispatchBatch()) total += n;
    expect(total).toBeGreaterThanOrEqual(1);
    expect(await dispatcher.dispatchBatch()).toBe(0);
    const [row] = await pending();
    expect(row.dispatchedAt).not.toBeNull();
    const job = await queues.queue(QUEUES.events).getJob(row.id);
    expect(job?.name).toBe(eventName);
    expect(job?.data).toMatchObject({ orgId, data: { n: 1 } });
  });

  it('runs every consumer at most once, retrying only the ones that failed', async () => {
    const seen: string[] = [];
    let flaky = 0;
    bus.subscribe(`a-${run}`, `test.${run}.*`, async (e) => void seen.push(`a:${e.id}`));
    bus.subscribe(`b-${run}`, eventName, async (e, tx: SystemTx) => {
      if (flaky++ === 0) throw new Error('first try fails');
      // Consumers write in the same transaction as their processed_event mark.
      await recordAudit(tx, { orgId, actorId: null, entityType: 'test', entityId: e.id, action: 'consumed' });
    });

    const event: DomainEvent = {
      id: randomUUID(),
      name: eventName,
      orgId,
      occurredAt: new Date().toISOString(),
      data: {},
      meta: {},
    };
    await expect(bus.deliver(event)).rejects.toThrow('first try fails');
    expect(seen).toEqual([`a:${event.id}`]);

    const retry = await bus.deliver(event);
    expect(retry).toEqual({ ran: [`b-${run}`], skipped: [`a-${run}`] });
    expect(seen).toHaveLength(1);

    expect(await bus.deliver(event)).toEqual({ ran: [], skipped: [`a-${run}`, `b-${run}`] });
    expect(await prisma.system.auditLog.count({ where: { entityId: event.id, action: 'consumed' } })).toBe(1);
  });

  it('delivers end to end through the worker', async () => {
    const got = new Promise<DomainEvent>((resolve) =>
      bus.subscribe(`e2e-${run}`, `test.${run}.e2e`, async (e) => resolve(e)),
    );
    bus.start(2);
    await prisma.withOrg(orgId, (tx) => emitEvent(tx, `test.${run}.e2e`, { hello: 'world' }, orgId));
    await dispatcher.dispatchBatch();
    const e = await Promise.race([
      got,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('not delivered in 10s')), 10_000)),
    ]);
    expect(e).toMatchObject({ name: `test.${run}.e2e`, orgId, data: { hello: 'world' } });
  });
});
