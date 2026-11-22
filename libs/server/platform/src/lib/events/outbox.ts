/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import { RequestContext } from '../context/request-context';
import type { TenantTx } from '../db/prisma.service';

/** Event names. `<module>.<entity>.<past-tense verb>`; consumers subscribe by name. */
export const PlatformEvents = {
  OrganizationCreated: 'platform.organization.created',
  OrganizationUpdated: 'platform.organization.updated',
  RoleCreated: 'platform.role.created',
  RoleUpdated: 'platform.role.updated',
  RoleDeleted: 'platform.role.deleted',
  ModuleEnabled: 'platform.module.enabled',
  ModuleDisabled: 'platform.module.disabled',
  UserSignedUp: 'platform.user.signed_up',
  MemberInvited: 'platform.member.invited',
  MemberJoined: 'platform.member.joined',
  MemberRoleChanged: 'platform.member.role_changed',
  MemberRemoved: 'platform.member.removed',
  ApiKeyCreated: 'platform.api_key.created',
  ApiKeyRevoked: 'platform.api_key.revoked',
} as const;

/** What an event carries besides its data: where it came from, for logs and audit. */
export interface EventMeta {
  requestId?: string;
  actorId?: string;
  actorType?: string;
}

export interface OutboxPayload<T = unknown> {
  data: T;
  meta: EventMeta;
}

/** A dispatched event as consumers receive it. */
export interface DomainEvent<T = unknown> {
  id: string;
  name: string;
  orgId: string | null;
  occurredAt: string;
  data: T;
  meta: EventMeta;
}

type OutboxWriter = Pick<TenantTx, 'outboxEvent'>;

/**
 * Record an event in the SAME transaction as the change it describes (transactional outbox):
 * if the change rolls back, so does the event; if it commits, the worker will deliver it — at
 * least once, to every subscribed consumer. Never publish to a queue directly from a request.
 *
 * `orgId` defaults to the current request's organization; pass `null` for global events.
 */
export async function emitEvent<T>(
  tx: OutboxWriter,
  name: string,
  data: T,
  orgId?: string | null,
): Promise<string> {
  const ctx = RequestContext.get();
  const payload: OutboxPayload<T> = {
    data,
    meta: {
      requestId: ctx?.requestId,
      actorId: ctx?.apiKeyId ?? ctx?.userId,
      actorType: ctx?.actorType,
    },
  };
  // createMany: no RETURNING, so a global event (org_id NULL) is allowed for the RLS role —
  // it may write such rows but not read them back.
  const id = randomUUID();
  await tx.outboxEvent.createMany({
    data: [
      {
        id,
        name,
        orgId: orgId === undefined ? (ctx?.orgId ?? null) : orgId,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    ],
  });
  return id;
}
