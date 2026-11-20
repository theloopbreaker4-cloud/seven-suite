/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

/** A Prisma transaction client scoped to one organization. */
export type TenantTx = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/**
 * Two connections, on purpose (ADR-006):
 *  - `withOrg()` uses the RLS-bound role and sets `app.org_id` for the transaction, so a
 *    query can only ever see the current organization's rows — even if a WHERE is forgotten;
 *  - `system` uses the owner role and bypasses RLS. Only platform code that must look across
 *    tenants (login, org switching, the outbox dispatcher) may use it.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly system: PrismaClient;
  private readonly app: PrismaClient;

  constructor(@Inject(ENV) env: Env) {
    this.system = createPrismaClient(env.DATABASE_URL);
    this.app = createPrismaClient(env.DATABASE_APP_URL);
  }

  /** Run `fn` in a transaction where only `orgId`'s rows are visible and writable. */
  async withOrg<T>(
    orgId: string,
    fn: (tx: TenantTx) => Promise<T>,
  ): Promise<T> {
    return this.app.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`;
      return fn(tx);
    });
  }

  /** Connectivity check for readiness probes. */
  async ping(): Promise<void> {
    await this.system.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.system.$disconnect(), this.app.$disconnect()]);
  }
}
