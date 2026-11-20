/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import type { LoginInput, SignupInput } from './auth.schemas';
import { LoginLimiter } from './login-limiter';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  needsRehash,
  verifyPassword,
} from './password';
import { SYSTEM_ROLES } from './permissions';
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_DAYS,
  TokenService,
  type AuthContext,
} from './tokens';

export interface Session {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
  auth: AuthContext;
}

export interface ClientInfo {
  ip: string;
  userAgent?: string;
}

/**
 * Sign-up, login, refresh and logout. Works across tenants (a login has to find the user's
 * organizations), so it uses the owner connection — it is part of the platform kernel.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly limiter: LoginLimiter,
  ) {}

  /** New user + new organization with the system roles; the user becomes its owner. */
  async signup(input: SignupInput, client: ClientInfo): Promise<Session> {
    const db = this.prisma.system;
    if (
      await db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      })
    ) {
      throw DomainError.conflict(
        'email_taken',
        'An account with this email already exists',
      );
    }
    const passwordHash = await hashPassword(input.password);
    const slug = await this.freeSlug(input.organizationName);

    const created = db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: input.email, passwordHash, name: input.name },
      });
      const org = await tx.organization.create({
        data: { slug, name: input.organizationName },
      });
      await tx.role.createMany({
        data: SYSTEM_ROLES.map((r) => ({
          orgId: org.id,
          ...r,
          isSystem: true,
        })),
      });
      const owner = await tx.role.findUniqueOrThrow({
        where: { orgId_key: { orgId: org.id, key: 'owner' } },
      });
      await tx.membership.create({
        data: { orgId: org.id, userId: user.id, roleId: owner.id },
      });
      await tx.auditLog.create({
        data: {
          orgId: org.id,
          actorId: user.id,
          entityType: 'organization',
          entityId: org.id,
          action: 'created',
          ip: client.ip,
        },
      });
      return { userId: user.id, orgId: org.id };
    });
    const { userId, orgId } = await created.catch((e: { code?: string }) => {
      // Two sign-ups with the same email at once: the unique index decides.
      if (e?.code === 'P2002')
        throw DomainError.conflict(
          'email_taken',
          'An account with this email already exists',
        );
      throw e;
    });
    return this.issueSession(userId, orgId, client, randomUUID());
  }

  async login(input: LoginInput, client: ClientInfo): Promise<Session> {
    await this.limiter.assertAllowed(client.ip, input.email);
    const db = this.prisma.system;
    const user = await db.user.findUnique({ where: { email: input.email } });
    // Hash even when the user doesn't exist so response time doesn't reveal registered emails.
    const valid = await verifyPassword(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !valid) {
      await this.limiter.recordFailure(client.ip, input.email);
      throw DomainError.unauthorized(
        'Wrong email or password',
        'invalid_credentials',
      );
    }
    if (!user.isActive)
      throw DomainError.forbidden(
        'This account is disabled',
        'account_disabled',
      );

    const memberships = await db.membership.findMany({
      where: { userId: user.id, isActive: true },
      include: { organization: { select: { slug: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const membership = input.organization
      ? memberships.find((m) => m.organization.slug === input.organization)
      : memberships[0];
    if (!membership)
      throw DomainError.forbidden(
        'You are not a member of this organization',
        'no_organization',
      );

    await this.limiter.recordSuccess(client.ip, input.email);
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(needsRehash(user.passwordHash)
          ? { passwordHash: await hashPassword(input.password) }
          : {}),
      },
    });
    return this.issueSession(user.id, membership.orgId, client, randomUUID());
  }

  /**
   * Rotate a refresh token. Each token works once; presenting an already-rotated or revoked
   * token means it was copied, so the whole family (every session descended from that login)
   * is revoked.
   */
  async refresh(token: string, client: ClientInfo): Promise<Session> {
    const db = this.prisma.system;
    const row = await db.refreshToken.findUnique({
      where: { tokenHash: TokenService.hash(token) },
    });
    if (!row)
      throw DomainError.unauthorized(
        'Session expired, sign in again',
        'session_expired',
      );

    // Claim the token atomically; losing the race counts as reuse too.
    const claimed = await db.refreshToken.updateMany({
      where: {
        id: row.id,
        rotatedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { rotatedAt: new Date() },
    });
    if (claimed.count !== 1) {
      if (row.rotatedAt || row.revokedAt) {
        await this.revokeFamily(row.familyId);
        throw DomainError.unauthorized(
          'Session was used elsewhere, sign in again',
          'session_reused',
        );
      }
      throw DomainError.unauthorized(
        'Session expired, sign in again',
        'session_expired',
      );
    }
    return this.issueSession(row.userId, row.orgId, client, row.familyId);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    const row = await this.prisma.system.refreshToken.findUnique({
      where: { tokenHash: TokenService.hash(token) },
      select: { familyId: true },
    });
    if (row) await this.revokeFamily(row.familyId);
  }

  /** The signed-in user, their organization and every organization they can switch to. */
  async me(auth: AuthContext) {
    const db = this.prisma.system;
    const user = await db.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    });
    const memberships = await db.membership.findMany({
      where: { userId: auth.userId, isActive: true },
      select: {
        organization: { select: { id: true, slug: true, name: true } },
        role: { select: { key: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return {
      user,
      organization:
        memberships.find((m) => m.organization.id === auth.orgId)
          ?.organization ?? null,
      role: auth.roleKey,
      permissions: auth.permissions,
      organizations: memberships.map((m) => ({
        ...m.organization,
        role: m.role,
      })),
    };
  }

  private async issueSession(
    userId: string,
    orgId: string,
    client: ClientInfo,
    familyId: string,
  ): Promise<Session> {
    const db = this.prisma.system;
    const membership = await db.membership.findUnique({
      where: { orgId_userId: { orgId, userId } },
      include: { role: true, user: { select: { isActive: true } } },
    });
    if (!membership?.isActive || !membership.user.isActive) {
      await this.revokeFamily(familyId);
      throw DomainError.unauthorized(
        'Your access has been removed',
        'access_revoked',
      );
    }
    const auth: AuthContext = {
      userId,
      orgId,
      roleKey: membership.role.key,
      permissions: membership.role.permissions,
    };
    const refresh = this.tokens.newRefreshToken();
    const refreshExpiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 86400_000,
    );
    await db.refreshToken.create({
      data: {
        userId,
        orgId,
        familyId,
        tokenHash: refresh.hash,
        userAgent: client.userAgent?.slice(0, 300),
        expiresAt: refreshExpiresAt,
      },
    });
    return {
      accessToken: await this.tokens.signAccess(auth),
      expiresIn: ACCESS_TTL_SECONDS,
      refreshToken: refresh.token,
      refreshExpiresAt,
      auth,
    };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.system.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async freeSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'org';
    let slug = base;
    while (
      await this.prisma.system.organization.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${base}-${randomBytes(3).toString('hex')}`;
    }
    return slug;
  }
}
