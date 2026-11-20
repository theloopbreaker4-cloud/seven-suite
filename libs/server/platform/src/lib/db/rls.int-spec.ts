/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../generated/prisma/client';
import { createPrismaClient } from './prisma.service';

/**
 * Proves the tenant-isolation policies (docs/04-data-model.md, invariant 9) on a real database.
 * The owner connection plays both roles: as itself it bypasses RLS (like `system`);
 * after `SET LOCAL ROLE seven_app` it is exactly what the application connects as.
 */
describe('row-level security', () => {
  let db: PrismaClient;
  let orgA: string;
  let orgB: string;

  /** Run as the application role with `app.org_id` set (or unset). */
  const asApp = <T>(
    orgId: string | null,
    fn: (tx: PrismaClient) => Promise<T>,
  ) =>
    db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE seven_app');
      if (orgId)
        await tx.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`;
      return fn(tx as unknown as PrismaClient);
    });

  beforeAll(async () => {
    const url = process.env['DATABASE_TEST_URL'];
    if (!url) throw new Error('DATABASE_TEST_URL is not set');
    db = createPrismaClient(url);
    const suffix = randomUUID().slice(0, 8);
    const a = await db.organization.create({
      data: { slug: `a-${suffix}`, name: 'A' },
    });
    const b = await db.organization.create({
      data: { slug: `b-${suffix}`, name: 'B' },
    });
    orgA = a.id;
    orgB = b.id;
    await db.role.createMany({
      data: [
        { orgId: orgA, key: 'owner', name: 'Owner' },
        { orgId: orgA, key: 'sales', name: 'Sales' },
        { orgId: orgB, key: 'owner', name: 'Owner' },
      ],
    });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } });
    await db.$disconnect();
  });

  it('shows a tenant only its own rows', async () => {
    const roles = await asApp(orgA, (tx) => tx.role.findMany());
    expect(roles.map((r) => r.orgId)).toEqual([orgA, orgA]);
    const orgs = await asApp(orgB, (tx) => tx.organization.findMany());
    expect(orgs.map((o) => o.id)).toEqual([orgB]);
  });

  it('shows nothing when no organization is set', async () => {
    expect(await asApp(null, (tx) => tx.role.count())).toBe(0);
    expect(await asApp(null, (tx) => tx.organization.count())).toBe(0);
  });

  it('refuses to write into another tenant', async () => {
    await expect(
      asApp(orgA, (tx) =>
        tx.role.create({ data: { orgId: orgB, key: 'x', name: 'X' } }),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('cannot update or delete another tenant’s rows (they are invisible)', async () => {
    const updated = await asApp(orgA, (tx) =>
      tx.role.updateMany({ where: { orgId: orgB }, data: { name: 'hacked' } }),
    );
    expect(updated.count).toBe(0);
    const deleted = await asApp(orgA, (tx) =>
      tx.role.deleteMany({ where: { orgId: orgB } }),
    );
    expect(deleted.count).toBe(0);
    expect(await db.role.count({ where: { orgId: orgB } })).toBe(1);
  });

  it('keeps the audit log append-only for the application', async () => {
    await asApp(orgA, (tx) =>
      tx.auditLog.create({
        data: {
          orgId: orgA,
          entityType: 'role',
          entityId: 'x',
          action: 'test',
        },
      }),
    );
    await expect(
      asApp(orgA, (tx) => tx.auditLog.deleteMany({ where: { orgId: orgA } })),
    ).rejects.toThrow(/permission denied/i);
  });
});
