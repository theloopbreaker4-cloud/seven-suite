/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { recordAudit } from '../audit/audit';
import { hasPermission } from '../auth/permissions';
import type { AuthContext } from '../auth/tokens';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { emitEvent, PlatformEvents } from '../events/outbox';

/** Interface languages the product ships (admin + storefront). */
export const SUPPORTED_LANGUAGES = [
  'ka',
  'en',
  'ru',
  'uk',
  'az',
  'hy',
] as const;

export const organizationSettingsSchema = z
  .object({
    name: z.string().trim().min(1, 'Required').max(120),
    legalName: z.string().trim().max(200).nullable(),
    country: z.string().regex(/^[A-Z]{2}$/, 'Two-letter country code'),
    baseCurrency: z.string().regex(/^[A-Z]{3}$/, 'Three-letter currency code'),
    timezone: z.string().refine((tz) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'Unknown time zone'),
    locale: z.enum(SUPPORTED_LANGUAGES),
    languages: z
      .array(z.enum(SUPPORTED_LANGUAGES))
      .min(1, 'Pick at least one')
      .max(SUPPORTED_LANGUAGES.length),
  })
  .partial()
  .refine((v) => !v.locale || !v.languages || v.languages.includes(v.locale), {
    message: 'The default language must be one of the languages',
    path: ['locale'],
  });
export type OrganizationSettingsInput = z.infer<
  typeof organizationSettingsSchema
>;

/** `module:entity:action`, segments may be `*`; `*` alone means everything. */
const permissionString = z
  .string()
  .regex(/^(\*|[a-z_]+(:([a-z_]+|\*)){0,2})$/, 'Use module:entity:action');

export const roleSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{1,39}$/, 'Lowercase letters, digits, _ (2–40)'),
  name: z.string().trim().min(1, 'Required').max(80),
  permissions: z.array(permissionString).max(200),
});
export const roleUpdateSchema = roleSchema.omit({ key: true }).partial();
export type RoleInput = z.infer<typeof roleSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

const SETTINGS_FIELDS = {
  id: true,
  slug: true,
  name: true,
  legalName: true,
  country: true,
  baseCurrency: true,
  timezone: true,
  locale: true,
  languages: true,
} as const;

/** The current organization's profile and its custom roles. */
@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async settings(by: AuthContext) {
    return this.prisma.withOrg(by.orgId, (tx) =>
      tx.organization.findUniqueOrThrow({
        where: { id: by.orgId },
        select: SETTINGS_FIELDS,
      }),
    );
  }

  async updateSettings(by: AuthContext, input: OrganizationSettingsInput) {
    return this.prisma.withOrg(by.orgId, async (tx) => {
      const before = await tx.organization.findUniqueOrThrow({
        where: { id: by.orgId },
        select: SETTINGS_FIELDS,
      });
      if (
        input.locale &&
        !input.languages &&
        !before.languages.includes(input.locale)
      )
        throw DomainError.validation({
          locale: 'The default language must be one of the languages',
        });
      if (
        input.languages &&
        !input.locale &&
        !(input.languages as string[]).includes(before.locale)
      )
        throw DomainError.validation({
          languages: 'Keep the default language in the list',
        });
      const after = await tx.organization.update({
        where: { id: by.orgId },
        data: input,
        select: SETTINGS_FIELDS,
      });
      await recordAudit(tx, {
        entityType: 'organization',
        entityId: by.orgId,
        action: 'settings_updated',
        before,
        after,
      });
      await emitEvent(tx, PlatformEvents.OrganizationUpdated, {
        organizationId: by.orgId,
        changed: Object.keys(input),
      });
      return after;
    });
  }

  async createRole(by: AuthContext, input: RoleInput) {
    this.assertGrantable(by, input.permissions);
    return this.prisma.withOrg(by.orgId, async (tx) => {
      if (
        await tx.role.findFirst({ where: { orgId: by.orgId, key: input.key } })
      )
        throw DomainError.validation({
          key: 'A role with this key already exists',
        });
      const role = await tx.role.create({
        data: {
          orgId: by.orgId,
          key: input.key,
          name: input.name,
          permissions: [...new Set(input.permissions)],
        },
      });
      await recordAudit(tx, {
        entityType: 'role',
        entityId: role.id,
        action: 'created',
        after: input,
      });
      await emitEvent(tx, PlatformEvents.RoleCreated, { roleKey: role.key });
      return {
        key: role.key,
        name: role.name,
        permissions: role.permissions,
        isSystem: false,
      };
    });
  }

  async updateRole(by: AuthContext, key: string, input: RoleUpdateInput) {
    if (input.permissions) this.assertGrantable(by, input.permissions);
    return this.prisma.withOrg(by.orgId, async (tx) => {
      const role = await this.editableRole(tx, by, key);
      // Editing a role changes everyone who has it: you must already hold what it grants today.
      this.assertGrantable(by, role.permissions);
      const updated = await tx.role.update({
        where: { id: role.id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.permissions
            ? { permissions: [...new Set(input.permissions)] }
            : {}),
        },
      });
      await recordAudit(tx, {
        entityType: 'role',
        entityId: role.id,
        action: 'updated',
        before: { name: role.name, permissions: role.permissions },
        after: { name: updated.name, permissions: updated.permissions },
      });
      await emitEvent(tx, PlatformEvents.RoleUpdated, { roleKey: key });
      return {
        key: updated.key,
        name: updated.name,
        permissions: updated.permissions,
        isSystem: false,
      };
    });
  }

  async deleteRole(by: AuthContext, key: string): Promise<void> {
    await this.prisma.withOrg(by.orgId, async (tx) => {
      const role = await this.editableRole(tx, by, key);
      this.assertGrantable(by, role.permissions);
      const inUse =
        (await tx.membership.count({
          where: { roleId: role.id, isActive: true },
        })) +
        (await tx.invitation.count({
          where: { roleId: role.id, acceptedAt: null, revokedAt: null },
        }));
      if (inUse)
        throw DomainError.conflict(
          'role_in_use',
          'People still have this role — give them another one first',
        );
      await tx.membership.deleteMany({ where: { roleId: role.id } }); // inactive leftovers
      await tx.invitation.deleteMany({ where: { roleId: role.id } });
      await tx.role.delete({ where: { id: role.id } });
      await recordAudit(tx, {
        entityType: 'role',
        entityId: role.id,
        action: 'deleted',
        before: { key, permissions: role.permissions },
      });
      await emitEvent(tx, PlatformEvents.RoleDeleted, { roleKey: key });
    });
  }

  private async editableRole(
    tx: Parameters<Parameters<PrismaService['withOrg']>[1]>[0],
    by: AuthContext,
    key: string,
  ) {
    const role = await tx.role.findFirst({ where: { orgId: by.orgId, key } });
    if (!role) throw DomainError.notFound('Role not found');
    if (role.isSystem)
      throw DomainError.forbidden(
        'Built-in roles cannot be changed',
        'system_role',
      );
    return role;
  }

  /** Nobody can hand out access they don't have themselves. */
  private assertGrantable(by: AuthContext, permissions: string[]): void {
    const denied = permissions.filter((p) => !hasPermission(by.permissions, p));
    if (denied.length)
      throw DomainError.forbidden(
        `You cannot grant: ${denied.join(', ')}`,
        'cannot_grant',
      );
  }
}
