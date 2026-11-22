/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { RequestContext } from '../context/request-context';
import { PrismaService } from '../db/prisma.service';
import { bullOptions, QUEUES } from '../queue/queue.service';
import type { DomainEvent, OutboxPayload } from './outbox';

/** Owner-role transaction handed to consumers (they may write across tenants, carefully). */
export type SystemTx = Parameters<Parameters<PrismaService['system']['$transaction']>[0]>[0];

export type EventHandler = (event: DomainEvent, tx: SystemTx) => Promise<void>;

interface Subscription {
  consumer: string;
  pattern: string;
  handler: EventHandler;
}

/** `platform.member.*` matches `platform.member.invited`; `*` matches everything. */
export function matchesEvent(pattern: string, name: string): boolean {
  if (pattern === '*' || pattern === name) return true;
  return pattern.endsWith('.*') && name.startsWith(pattern.slice(0, -1));
}

/**
 * Consumers of domain events. Each subscription has a stable consumer id; a (consumer, event)
 * pair is processed at most once — the `processed_event` row is inserted in the same
 * transaction as the consumer's own writes, so a retry after a crash never applies twice.
 * Side effects outside the database (email, webhooks) are at-least-once: make them idempotent
 * with the event id.
 */
@Injectable()
export class EventBus implements OnApplicationShutdown {
  private readonly logger = new Logger(EventBus.name);
  private readonly subs: Subscription[] = [];
  private worker?: Worker;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  subscribe(consumer: string, pattern: string, handler: EventHandler): void {
    if (this.subs.some((s) => s.consumer === consumer && s.pattern === pattern))
      throw new Error(`Duplicate subscription ${consumer} → ${pattern}`);
    this.subs.push({ consumer, pattern, handler });
  }

  /** Run every matching consumer for one event (exported for tests and the worker). */
  async deliver(event: DomainEvent): Promise<{ ran: string[]; skipped: string[] }> {
    const ran: string[] = [];
    const skipped: string[] = [];
    const failures: string[] = [];
    for (const sub of this.subs.filter((s) => matchesEvent(s.pattern, event.name))) {
      try {
        const done = await RequestContext.run(
          {
            requestId: event.meta.requestId ?? `event:${event.id}`,
            orgId: event.orgId ?? undefined,
            actorType: 'system',
          },
          () =>
            this.prisma.system.$transaction(async (tx) => {
              const inserted = await tx.$executeRaw`
                INSERT INTO platform.processed_event (consumer, event_id)
                VALUES (${sub.consumer}, ${event.id}::uuid)
                ON CONFLICT DO NOTHING`;
              if (inserted === 0) return false; // already handled by an earlier attempt
              await sub.handler(event, tx);
              return true;
            }),
        );
        (done ? ran : skipped).push(sub.consumer);
      } catch (err) {
        failures.push(`${sub.consumer}: ${(err as Error).message}`);
      }
    }
    // One failing consumer must not block the others; the job is retried and the ones that
    // already succeeded are skipped thanks to processed_event.
    if (failures.length) throw new Error(failures.join('; '));
    return { ran, skipped };
  }

  /** Start consuming the events queue (worker process only). */
  start(concurrency = 5): void {
    if (this.worker) return;
    this.worker = new Worker(
      QUEUES.events,
      async (job: Job) => {
        const payload = job.data as OutboxPayload & { orgId: string | null; occurredAt: string };
        await this.deliver({
          id: String(job.id),
          name: job.name,
          orgId: payload.orgId,
          occurredAt: payload.occurredAt,
          data: payload.data,
          meta: payload.meta ?? {},
        });
      },
      { ...bullOptions(this.env), concurrency },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.warn(`event ${job?.name} ${job?.id} attempt ${job?.attemptsMade} failed: ${err.message}`),
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }
}
