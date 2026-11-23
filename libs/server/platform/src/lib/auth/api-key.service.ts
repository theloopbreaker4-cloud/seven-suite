/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { recordAudit } from '../audit/audit';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { emitEvent, PlatformEvents } from '../events/outbox';
import { hasPermission } from './permissions';
import { TokenService, type AuthContext } from './tokens';

/** Keys look like `sv_<43 chars>`; the first 12 characters are kept to recognise them in lists. */
export const API_KEY_PREFIX = 'sv_';
const PREFIX_LENGTH = 12;
/** lastUsedAt is refreshed at most this often (no write on every request). */
const TOUCH_EVERY_MS = 60_000;

export interface CreateApiKeyInput {
  name: string;
  permissions: string[];
  expiresInDays?: number;
}

/**
 * Organization API keys for integrations. Only the hash is stored. A key's effective rights are
 * its own permissions intersected with its creator's CURRENT role, and it stops working when the
 * creator leaves the organization — so a key can never do more than a person who still has access.
 */
@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async list(by: AuthContext) {
    const rows = await this.prisma.withOrg(by.orgId, (tx) =>
      tx.apiKey.findMany({
        where: { orgId: by.orgId },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return {
      items: rows.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        permissions: k.permissions,
        createdById: k.createdById,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        revokedAt: k.revokedAt,
        createdAt: k.createdAt,
        active: !k.revokedAt && (!k.expiresAt || k.expiresAt > new Date()),
      })),
    };
  }

  /** Returns the key ONCE; afterwards only its prefix is known. */
  async create(by: AuthContext, input: CreateApiKeyInput) {
    const denied = input.permissions.filter(
      (p) => !hasPermission(by.permissions, p),
    );
    if (denied.length)
      throw DomainError.forbidden(
        `You cannot grant: ${denied.join(', ')}`,
        'cannot_grant',
      );
    const key = API_KEY_PREFIX + randomBytes(32).toString('base64url');
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 86_400_000)
      : null;
    const row = await this.prisma.withOrg(by.orgId, async (tx) => {
      const created = await tx.apiKey.create({
        data: {
          orgId: by.orgId,
          name: input.name,
          prefix: key.slice(0, PREFIX_LENGTH),
          keyHash: TokenService.hash(key),
          permissions: [...new Set(input.permissions)],
          createdById: by.userId,
          expiresAt,
        },
      });
      await recordAudit(tx, {
        entityType: 'api_key',
        entityId: created.id,
        action: 'created',
        after: {
          name: created.name,
          permissions: created.permissions,
          expiresAt,
        },
      });
      await emitEvent(
        tx,
        PlatformEvents.ApiKeyCreated,
        { apiKeyId: created.id, name: created.name },
        by.orgId,
      );
      return created;
    });
    return {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      permissions: row.permissions,
      expiresAt,
      key,
    };
  }

  async revoke(by: AuthContext, id: string): Promise<void> {
    await this.prisma.withOrg(by.orgId, async (tx) => {
      const key = await tx.apiKey.findFirst({ where: { id, orgId: by.orgId } });
      if (!key) throw DomainError.notFound('API key not found');
      if (key.revokedAt) return;
      await tx.apiKey.update({
        where: { id },
        data: { revokedAt: new Date() },
      });
      await recordAudit(tx, {
        entityType: 'api_key',
        entityId: id,
        action: 'revoked',
        before: { name: key.name },
      });
      await emitEvent(
        tx,
        PlatformEvents.ApiKeyRevoked,
        { apiKeyId: id, name: key.name },
        by.orgId,
      );
    });
  }

  /** For AuthGuard: the caller behind a key, or null (unknown, revoked, expired, creator gone). */
  async authenticate(key: string): Promise<AuthContext | null> {
    if (!key.startsWith(API_KEY_PREFIX) || key.length > 100) return null;
    const db = this.prisma.system;
    const row = await db.apiKey.findUnique({
      where: { keyHash: TokenService.hash(key) },
    });
    if (!row || row.revokedAt || (row.expiresAt && row.expiresAt <= new Date()))
      return null;

    const membership = await db.membership.findUnique({
      where: { orgId_userId: { orgId: row.orgId, userId: row.createdById } },
      include: { role: true, user: { select: { isActive: true } } },
    });
    if (!membership?.isActive || !membership.user.isActive) return null;
    const permissions = row.permissions.filter((p) =>
      hasPermission(membership.role.permissions, p),
    );

    if (
      !row.lastUsedAt ||
      Date.now() - row.lastUsedAt.getTime() > TOUCH_EVERY_MS
    )
      await db.apiKey.update({
        where: { id: row.id },
        data: { lastUsedAt: new Date() },
      });

    return {
      userId: row.createdById,
      orgId: row.orgId,
      roleKey: 'api_key',
      permissions,
      apiKeyId: row.id,
    };
  }
}
