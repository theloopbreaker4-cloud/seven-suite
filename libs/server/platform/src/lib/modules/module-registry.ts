/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Injectable } from '@nestjs/common';
import type { ModuleManifest, OrgModule } from '@seven/shared';
import { recordAudit } from '../audit/audit';
import type { AuthContext } from '../auth/tokens';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { emitEvent, PlatformEvents } from '../events/outbox';
import { CacheService } from '../redis/cache.service';

/** The platform itself: identity, organizations, members, roles, API keys, events. */
export const CORE_MODULE: ModuleManifest = {
  id: 'core',
  name: 'Core',
  description: 'Organizations, people, roles, API keys, audit trail and events.',
  requires: [],
  permissions: [
    'platform:member:read',
    'platform:member:invite',
    'platform:member:update',
    'platform:member:remove',
    'platform:role:create',
    'platform:role:update',
    'platform:role:delete',
    'platform:settings:read',
    'platform:settings:update',
    'platform:api_key:read',
    'platform:api_key:create',
    'platform:api_key:delete',
  ],
  alwaysOn: true,
};

const CACHE_TTL = 60;

/**
 * Domain modules register their manifest at boot (`onModuleInit`). Each organization switches
 * modules on and off (`organization.modules_enabled`); the platform refuses to enable a module
 * whose dependencies are off, or to disable one another enabled module needs. Routes of a module
 * are guarded with `@RequireModule('<id>')`.
 */
@Injectable()
export class ModuleRegistry {
  private readonly manifests = new Map<string, ModuleManifest>([[CORE_MODULE.id, CORE_MODULE]]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  register(manifest: ModuleManifest): void {
    if (!/^[a-z][a-z0-9_]{1,30}$/.test(manifest.id)) throw new Error(`Bad module id "${manifest.id}"`);
    if (this.manifests.has(manifest.id)) throw new Error(`Module ${manifest.id} registered twice`);
    this.manifests.set(manifest.id, { ...manifest, requires: [...new Set(manifest.requires)] });
  }

  /** Drop a registration (tests only). */
  unregister(id: string): void {
    if (id !== CORE_MODULE.id) this.manifests.delete(id);
  }

  all(): ModuleManifest[] {
    return [...this.manifests.values()];
  }

  /** Ids enabled for an organization (always including core and other always-on modules). */
  async enabledFor(orgId: string): Promise<string[]> {
    const stored = await this.cache.wrap(`org:${orgId}`, 'modules', CACHE_TTL, async () => {
      const org = await this.prisma.system.organization.findUnique({ where: { id: orgId }, select: { modulesEnabled: true } });
      return org?.modulesEnabled ?? [];
    });
    const alwaysOn = this.all().filter((m) => m.alwaysOn).map((m) => m.id);
    return [...new Set([...alwaysOn, ...stored])];
  }

  async isEnabled(orgId: string, id: string): Promise<boolean> {
    return (await this.enabledFor(orgId)).includes(id);
  }

  async list(orgId: string): Promise<OrgModule[]> {
    const enabled = await this.enabledFor(orgId);
    return this.all().map((m) => ({
      ...m,
      enabled: enabled.includes(m.id),
      requiredBy: this.all()
        .filter((o) => enabled.includes(o.id) && o.requires.includes(m.id))
        .map((o) => o.id),
    }));
  }

  async setEnabled(by: AuthContext, id: string, enabled: boolean): Promise<OrgModule[]> {
    const manifest = this.manifests.get(id);
    if (!manifest) throw DomainError.notFound('Unknown module');
    if (manifest.alwaysOn && !enabled)
      throw DomainError.conflict('module_always_on', `${manifest.name} can't be switched off`);

    await this.prisma.withOrg(by.orgId, async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: by.orgId }, select: { modulesEnabled: true } });
      const current = new Set([...org.modulesEnabled, ...this.all().filter((m) => m.alwaysOn).map((m) => m.id)]);
      if (enabled === current.has(id)) return;
      if (enabled) {
        const missing = manifest.requires.filter((r) => !current.has(r));
        if (missing.length)
          throw DomainError.conflict('module_requires', `Enable ${missing.join(', ')} first`);
        current.add(id);
      } else {
        const dependants = this.all().filter((m) => current.has(m.id) && m.requires.includes(id)).map((m) => m.id);
        if (dependants.length)
          throw DomainError.conflict('module_required_by', `Switch off ${dependants.join(', ')} first`);
        current.delete(id);
      }
      // Keep only modules this installation knows about.
      const next = [...current].filter((m) => this.manifests.has(m)).sort();
      await tx.organization.update({ where: { id: by.orgId }, data: { modulesEnabled: next } });
      await recordAudit(tx, {
        entityType: 'organization',
        entityId: by.orgId,
        action: enabled ? 'module_enabled' : 'module_disabled',
        before: { modules: org.modulesEnabled },
        after: { modules: next },
      });
      await emitEvent(tx, enabled ? PlatformEvents.ModuleEnabled : PlatformEvents.ModuleDisabled, { module: id });
    });
    await this.cache.del(`org:${by.orgId}`, 'modules');
    return this.list(by.orgId);
  }
}
