/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, type TenantTx } from './prisma.service';

interface Scope {
  orgId: string;
  tx: TenantTx;
  afterCommit: (() => unknown | Promise<unknown>)[];
}

/**
 * One business operation = one tenant transaction, shared by every repository it touches.
 *
 *   await uow.run(orgId, async () => {
 *     await orders.markPaid(id);        // repositories call uow.tx() — no tx parameter threading
 *     await invoices.issue(id);
 *     uow.afterCommit(() => mail.sendReceipt(id)); // only if everything above committed
 *   });
 *
 * Nested `run()` for the same organization joins the outer transaction (so services compose);
 * a different organization inside is refused. `afterCommit` callbacks run once, after the outer
 * transaction commits — never after a rollback; their errors are logged, not thrown (the data is
 * already committed). Events still go through the outbox (`emitEvent(uow.tx(), …)`).
 */
@Injectable()
export class UnitOfWork {
  private readonly logger = new Logger(UnitOfWork.name);
  private readonly storage = new AsyncLocalStorage<Scope>();

  constructor(private readonly prisma: PrismaService) {}

  async run<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
    const outer = this.storage.getStore();
    if (outer) {
      if (outer.orgId !== orgId) throw new Error('A unit of work cannot switch organization');
      return fn();
    }
    const scope: Omit<Scope, 'tx'> & { tx?: TenantTx } = { orgId, afterCommit: [] };
    const result = await this.prisma.withOrg(orgId, (tx) => {
      scope.tx = tx;
      return this.storage.run(scope as Scope, fn);
    });
    for (const cb of scope.afterCommit) {
      try {
        await cb();
      } catch (err) {
        this.logger.error(`afterCommit callback failed: ${(err as Error).message}`);
      }
    }
    return result;
  }

  /** The current transaction (throws outside `run()` — a repository must never run untransacted). */
  tx(): TenantTx {
    const scope = this.storage.getStore();
    if (!scope) throw new Error('No unit of work: wrap the call in uow.run(orgId, …)');
    return scope.tx;
  }

  get active(): boolean {
    return this.storage.getStore() !== undefined;
  }

  /** Run `cb` after the current unit of work commits (immediately if there is none). */
  afterCommit(cb: () => unknown | Promise<unknown>): void {
    const scope = this.storage.getStore();
    if (scope) scope.afterCommit.push(cb);
    else void Promise.resolve().then(cb).catch((e) => this.logger.error(`afterCommit callback failed: ${(e as Error).message}`));
  }
}
