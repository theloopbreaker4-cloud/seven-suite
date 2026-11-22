/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { recordAudit } from '../audit/audit';
import { emitEvent, PlatformEvents } from '../events/outbox';
import { MailService } from '../mail/mail.service';
import { invitationMail } from '../mail/templates';
import { RateLimiter } from '../redis/rate-limiter';
import type { AcceptInvitationInput, InviteInput } from './auth.schemas';
import { AuthService, type ClientInfo, type Session } from './auth.service';
import { hashPassword, verifyPassword } from './password';
import { hasPermission } from './permissions';
import { TokenService, type AuthContext } from './tokens';

const INVITE_TTL_MS = 7 * 86400_000;

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly limiter: RateLimiter,
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Invite someone with a role. Nobody can hand out more than they have: every permission of
   * the target role must be covered by the inviter's own (an admin can't create owners).
   */
  async invite(by: AuthContext, input: InviteInput) {
    await this.limiter.consume(`invite:${by.orgId}`, 50, 3600);
    const { token, hash } = this.tokens.newRefreshToken();

    const invitation = await this.prisma.withOrg(by.orgId, async (tx) => {
      const role = await tx.role.findFirst({
        where: { orgId: by.orgId, key: input.role },
      });
      if (!role) throw DomainError.validation({ role: 'Unknown role' });
      if (!role.permissions.every((p) => hasPermission(by.permissions, p))) {
        throw DomainError.forbidden(
          'You cannot grant a role with more access than your own',
          'role_too_powerful',
        );
      }
      const member = await tx.membership.findFirst({
        where: {
          orgId: by.orgId,
          isActive: true,
          user: { email: input.email },
        },
        select: { id: true },
      });
      if (member)
        throw DomainError.conflict(
          'already_member',
          'This person is already a member',
        );

      // A new invitation replaces any pending one for the same address.
      await tx.invitation.updateMany({
        where: {
          orgId: by.orgId,
          email: input.email,
          acceptedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      const created = await tx.invitation.create({
        data: {
          orgId: by.orgId,
          email: input.email,
          roleId: role.id,
          invitedById: by.userId,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
        include: {
          organization: { select: { name: true } },
          role: { select: { key: true } },
        },
      });
      await recordAudit(tx, {
        orgId: by.orgId,
        actorId: by.userId,
        entityType: 'invitation',
        entityId: created.id,
        action: 'created',
        after: { email: input.email, role: role.key },
      });
      await emitEvent(
        tx,
        PlatformEvents.MemberInvited,
        { invitationId: created.id, email: input.email, role: role.key },
        by.orgId,
      );
      return created;
    });

    const inviter = await this.prisma.system.user.findUniqueOrThrow({
      where: { id: by.userId },
      select: { name: true },
    });
    const url = `${this.env.ADMIN_URL}/invitation?token=${encodeURIComponent(token)}`;
    await this.mail.send(
      invitationMail(
        input.email,
        inviter.name,
        invitation.organization.name,
        url,
      ),
    );
    return this.view(invitation);
  }

  async list(by: AuthContext) {
    const rows = await this.prisma.withOrg(by.orgId, (tx) =>
      tx.invitation.findMany({
        where: {
          orgId: by.orgId,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { role: { select: { key: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return { items: rows.map((r) => this.view(r)) };
  }

  async revoke(by: AuthContext, id: string): Promise<void> {
    const res = await this.prisma.withOrg(by.orgId, (tx) =>
      tx.invitation.updateMany({
        where: { id, orgId: by.orgId, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    );
    if (res.count !== 1) throw DomainError.notFound('Invitation not found');
  }

  /** Public preview for the accept page: which organization, which email, is there an account. */
  async preview(token: string) {
    const inv = await this.findValid(token);
    const account = await this.prisma.system.user.findUnique({
      where: { email: inv.email },
      select: { id: true },
    });
    return {
      organization: inv.organization.name,
      email: inv.email,
      role: inv.role.key,
      hasAccount: !!account,
    };
  }

  /**
   * Accept and sign in. Existing account: prove it with its password. New account: name and
   * password create it. Either way the email is the invited one, so it counts as verified.
   */
  async accept(
    token: string,
    input: AcceptInvitationInput,
    client: ClientInfo,
  ): Promise<Session> {
    await this.limiter.consume(`accept:ip:${client.ip}`, 20, 3600);
    const inv = await this.findValid(token);
    const db = this.prisma.system;
    let user = await db.user.findUnique({ where: { email: inv.email } });

    if (user) {
      if (
        !input.password ||
        !(await verifyPassword(input.password, user.passwordHash))
      ) {
        throw DomainError.unauthorized(
          'Wrong password for this account',
          'invalid_credentials',
        );
      }
    } else {
      if (!input.name || !input.password || input.password.length < 10) {
        throw DomainError.validation({
          ...(input.name ? {} : { name: 'Required' }),
          ...(input.password && input.password.length >= 10
            ? {}
            : { password: 'Use at least 10 characters' }),
        });
      }
      user = await db.user.create({
        data: {
          email: inv.email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
          emailVerified: new Date(),
        },
      });
    }
    const userId = user.id;

    await db.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: inv.id, acceptedAt: null, revokedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (claimed.count !== 1)
        throw new DomainError(
          'invalid_token',
          'This invitation is no longer valid',
          400,
        );
      await tx.membership.upsert({
        where: { orgId_userId: { orgId: inv.orgId, userId } },
        create: { orgId: inv.orgId, userId, roleId: inv.roleId },
        update: { roleId: inv.roleId, isActive: true },
      });
      await recordAudit(tx, {
        orgId: inv.orgId,
        actorId: userId,
        entityType: 'invitation',
        entityId: inv.id,
        action: 'accepted',
      });
      await emitEvent(
        tx,
        PlatformEvents.MemberJoined,
        { invitationId: inv.id, userId },
        inv.orgId,
      );
    });
    return this.auth.startSession(userId, inv.orgId, client, randomUUID());
  }

  private async findValid(token: string) {
    const inv = await this.prisma.system.invitation.findUnique({
      where: { tokenHash: TokenService.hash(token) },
      include: {
        organization: { select: { name: true } },
        role: { select: { key: true } },
      },
    });
    if (
      !inv ||
      inv.acceptedAt ||
      inv.revokedAt ||
      inv.expiresAt <= new Date()
    ) {
      throw new DomainError(
        'invalid_token',
        'This invitation is invalid or has expired',
        400,
      );
    }
    return inv;
  }

  private view(r: {
    id: string;
    email: string;
    expiresAt: Date;
    createdAt: Date;
    role: { key: string };
  }) {
    return {
      id: r.id,
      email: r.email,
      role: r.role.key,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    };
  }
}
