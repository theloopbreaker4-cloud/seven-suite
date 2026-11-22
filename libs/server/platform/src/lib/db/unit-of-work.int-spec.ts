/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { createTestApp } from '../../../test/test-app';
import { CacheService } from '../redis/cache.service';
import { PrismaService } from './prisma.service';
import { UnitOfWork } from './unit-of-work';

describe('unit of work and cache', () => {
  const run = randomUUID().slice(0, 8);
  let app: INestApplication;
  let uow: UnitOfWork;
  let prisma: PrismaService;
  let orgId: string;
  let otherOrg: string;

  beforeAll(async () => {
    app = await createTestApp();
    uow = app.get(UnitOfWork);
    prisma = app.get(PrismaService);
    orgId = (await prisma.system.organization.create({ data: { slug: `uow-${run}`, name: 'UoW' } })).id;
    otherOrg = (await prisma.system.organization.create({ data: { slug: `uow2-${run}`, name: 'UoW2' } })).id;
  });
  afterAll(async () => {
    await prisma.system.organization.deleteMany({ where: { id: { in: [orgId, otherOrg] } } });
    await app.get(CacheService).clearScope(`t-${run}`);
    await app.close();
  });

  const roleCount = () => prisma.system.role.count({ where: { orgId } });

  it('shares one transaction across nested calls and commits it', async () => {
    const committed: string[] = [];
    await uow.run(orgId, async () => {
      await uow.tx().role.create({ data: { orgId, key: 'a', name: 'A' } });
      await uow.run(orgId, async () => {
        await uow.tx().role.create({ data: { orgId, key: 'b', name: 'B' } });
        uow.afterCommit(() => void committed.push('inner'));
      });
      uow.afterCommit(() => void committed.push('outer'));
      expect(committed).toEqual([]); // nothing runs before the commit
    });
    expect(await roleCount()).toBe(2);
    expect(committed).toEqual(['inner', 'outer']);
  });

  it('rolls everything back on error and skips afterCommit', async () => {
    let ran = false;
    await expect(
      uow.run(orgId, async () => {
        await uow.tx().role.create({ data: { orgId, key: 'c', name: 'C' } });
        uow.afterCommit(() => void (ran = true));
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await roleCount()).toBe(2);
    expect(ran).toBe(false);
  });

  it('is tenant-scoped (RLS) and refuses to switch organization', async () => {
    const seen = await uow.run(otherOrg, () => uow.tx().role.count());
    expect(seen).toBe(0);
    await expect(uow.run(orgId, () => uow.run(otherOrg, async () => 1))).rejects.toThrow(/switch organization/);
    expect(() => uow.tx()).toThrow(/No unit of work/);
  });

  it('caches per scope, computes a miss once, and clears a scope', async () => {
    const cache = app.get(CacheService);
    let loads = 0;
    const load = async () => {
      loads++;
      await new Promise((r) => setTimeout(r, 50));
      return { n: 42 };
    };
    const [a, b] = await Promise.all([
      cache.wrap(`t-${run}`, 'x', 60, load),
      cache.wrap(`t-${run}`, 'x', 60, load),
    ]);
    expect(a).toEqual({ n: 42 });
    expect(b).toEqual({ n: 42 });
    expect(await cache.wrap(`t-${run}`, 'x', 60, load)).toEqual({ n: 42 });
    expect(loads).toBe(1);
    expect(await cache.get(`other-${run}`, 'x')).toBeUndefined();
    expect(await cache.clearScope(`t-${run}`)).toBe(1);
    expect(await cache.get(`t-${run}`, 'x')).toBeUndefined();
  });
});
