/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { Prisma } from '../../generated/prisma/client';
import { RequestContext } from '../context/request-context';
import type { TenantTx } from '../db/prisma.service';

export interface AuditEntry {
  entityType: string;
  entityId: string;
  /** e.g. `create`, `update`, `delete`, `login`, `login_failed`, `2fa_enabled`. */
  action: string;
  before?: unknown;
  after?: unknown;
  /** Defaults to the current request's organization; `null` for account-level entries. */
  orgId?: string | null;
  /** Defaults to the current user / API key. */
  actorId?: string | null;
}

/** Secrets never reach the audit log, whatever a caller passes in `before`/`after`. */
const SECRET_KEYS = /pass(word)?|secret|token|hash|totp|recovery|^key$|apiKey$/i;

function scrub(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  const json = JSON.parse(
    JSON.stringify(value, (k, v) => (k && SECRET_KEYS.test(k) ? '[redacted]' : v)),
  );
  return json as Prisma.InputJsonValue;
}

/**
 * Append one row to the audit log inside the caller's transaction, so the trail and the change
 * commit (or roll back) together. Who, from where and in which request come from RequestContext.
 */
export async function recordAudit(tx: Pick<TenantTx, 'auditLog'>, entry: AuditEntry): Promise<void> {
  const ctx = RequestContext.get();
  // createMany: no RETURNING (the RLS role may append account-level rows it cannot read).
  await tx.auditLog.createMany({
    data: {
      orgId: entry.orgId === undefined ? (ctx?.orgId ?? null) : entry.orgId,
      actorId: entry.actorId === undefined ? (ctx?.apiKeyId ?? ctx?.userId ?? null) : entry.actorId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      before: scrub(entry.before),
      after: scrub(entry.after),
      ip: ctx?.ip?.slice(0, 64) ?? null,
      requestId: ctx?.requestId ?? null,
    },
  });
}
