/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Injectable } from '@nestjs/common';
import { PrismaService, type TenantTx } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { recordAudit } from '../audit/audit';
import { emitEvent, PlatformEvents } from '../events/outbox';
import { hasPermission } from '../auth/permissions';
import type { AuthContext } from '../auth/tokens';

/**
 * People and roles of the current organization. Same safety rules as invitations: nobody grants
 * more than they have, and an organization always keeps at least one active owner.
 */
@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  async list(by: AuthContext) {
    const rows = await this.prisma.withOrg(by.orgId, (tx) =>
      tx.membership.findMany({
        where: { orgId: by.orgId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              emailVerified: true,
              lastLoginAt: true,
            },
          },
          role: { select: { key: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    );
    return {
      items: rows.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        name: m.user.name,
        emailVerified: !!m.user.emailVerified,
        lastLoginAt: m.user.lastLoginAt,
        role: m.role,
        joinedAt: m.createdAt,
        isYou: m.user.id === by.userId,
      })),
    };
  }

  async roles(by: AuthContext) {
    const rows = await this.prisma.withOrg(by.orgId, (tx) =>
      tx.role.findMany({
        where: { orgId: by.orgId },
        orderBy: { createdAt: 'asc' },
      }),
    );
    return {
      items: rows.map((r) => ({
        key: r.key,
        name: r.name,
        permissions: r.permissions,
        isSystem: r.isSystem,
        // Whether the caller may hand this role out (UI greys out the rest).
        assignable: r.permissions.every((p) =>
          hasPermission(by.permissions, p),
        ),
      })),
    };
  }

  async changeRole(
    by: AuthContext,
    membershipId: string,
    roleKey: string,
  ): Promise<void> {
    await this.prisma.withOrg(by.orgId, async (tx) => {
      const member = await this.findMember(tx, by, membershipId);
      if (member.userId === by.userId) {
        throw DomainError.forbidden(
          'You cannot change your own role',
          'own_role',
        );
      }
      const role = await tx.role.findFirst({
        where: { orgId: by.orgId, key: roleKey },
      });
      if (!role) throw DomainError.validation({ role: 'Unknown role' });
      this.assertCanManage(by, member.role.permissions);
      this.assertCanManage(by, role.permissions);
      if (member.role.key === 'owner' && role.key !== 'owner')
        await this.assertAnotherOwner(tx, by.orgId, member.id);

      await tx.membership.update({
        where: { id: member.id },
        data: { roleId: role.id },
      });
      await recordAudit(tx, {
        orgId: by.orgId,
        actorId: by.userId,
        entityType: 'membership',
        entityId: member.id,
        action: 'role_changed',
        before: { role: member.role.key },
        after: { role: role.key },
      });
      await emitEvent(
        tx,
        PlatformEvents.MemberRoleChanged,
        {
          membershipId: member.id,
          userId: member.userId,
          from: member.role.key,
          to: role.key,
        },
        by.orgId,
      );
    });
  }

  /** Remove someone from the organization; their sessions for it stop at the next refresh. */
  async remove(by: AuthContext, membershipId: string): Promise<void> {
    await this.prisma.withOrg(by.orgId, async (tx) => {
      const member = await this.findMember(tx, by, membershipId);
      if (member.userId === by.userId) {
        throw DomainError.forbidden(
          'You cannot remove yourself',
          'remove_self',
        );
      }
      this.assertCanManage(by, member.role.permissions);
      if (member.role.key === 'owner')
        await this.assertAnotherOwner(tx, by.orgId, member.id);

      await tx.membership.update({
        where: { id: member.id },
        data: { isActive: false },
      });
      await recordAudit(tx, {
        orgId: by.orgId,
        actorId: by.userId,
        entityType: 'membership',
        entityId: member.id,
        action: 'removed',
        before: { role: member.role.key },
      });
      await emitEvent(
        tx,
        PlatformEvents.MemberRemoved,
        { membershipId: member.id, userId: member.userId },
        by.orgId,
      );
    });
    // Close this member's sessions for this organization right away.
    const m = await this.prisma.system.membership.findUniqueOrThrow({
      where: { id: membershipId },
    });
    await this.prisma.system.refreshToken.updateMany({
      where: { userId: m.userId, orgId: m.orgId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async findMember(tx: TenantTx, by: AuthContext, id: string) {
    const member = await tx.membership.findFirst({
      where: { id, orgId: by.orgId, isActive: true },
      include: { role: true },
    });
    if (!member) throw DomainError.notFound('Member not found');
    return member;
  }

  /** You can only manage people whose access you fully have yourself. */
  private assertCanManage(by: AuthContext, permissions: string[]): void {
    if (!permissions.every((p) => hasPermission(by.permissions, p))) {
      throw DomainError.forbidden(
        'This needs more access than you have',
        'role_too_powerful',
      );
    }
  }

  private async assertAnotherOwner(
    tx: TenantTx,
    orgId: string,
    exceptMembershipId: string,
  ): Promise<void> {
    const owners = await tx.membership.count({
      where: {
        orgId,
        isActive: true,
        role: { key: 'owner' },
        id: { not: exceptMembershipId },
      },
    });
    if (owners === 0) {
      throw DomainError.conflict(
        'last_owner',
        'An organization needs at least one owner',
      );
    }
  }
}
