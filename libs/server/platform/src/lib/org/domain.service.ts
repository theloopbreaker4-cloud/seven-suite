/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable } from '@nestjs/common';
import { recordAudit } from '../audit/audit';
import type { AuthContext } from '../auth/tokens';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { CacheService } from '../redis/cache.service';

const HOSTNAME =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/** `Shop.Example.GE.` / `https://shop.example.ge/x` → `shop.example.ge` (or null). */
export function normalizeHost(input: string): string | null {
  let h = input.trim().toLowerCase();
  h = h
    .replace(/^[a-z]+:\/\//, '')
    .split('/')[0]
    .split('?')[0];
  h = h.replace(/:\d+$/, '').replace(/\.$/, '');
  return h.length <= 253 && HOSTNAME.test(h) ? h : null;
}

/** What the storefront may know about an organization. */
export interface PublicSite {
  organizationId: string;
  slug: string;
  name: string;
  locale: string;
  languages: string[];
  timezone: string;
  baseCurrency: string;
  country: string;
}

/**
 * Storefront domains. An organization answers on its custom domains and, when WEB_BASE_DOMAIN is
 * set, on `<slug>.<WEB_BASE_DOMAIN>`. Lookups are cached for a minute (cleared on change).
 */
@Injectable()
export class DomainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async list(by: AuthContext) {
    return this.prisma.withOrg(by.orgId, async (tx) => {
      const rows = await tx.organizationDomain.findMany({
        where: { orgId: by.orgId },
        orderBy: { createdAt: 'asc' },
      });
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: by.orgId },
        select: { slug: true },
      });
      return {
        items: rows.map((r) => ({ domain: r.domain, createdAt: r.createdAt })),
        // The free address every organization has (when the installation has a base domain).
        defaultDomain: this.env.WEB_BASE_DOMAIN
          ? `${org.slug}.${this.env.WEB_BASE_DOMAIN}`
          : null,
      };
    });
  }

  async add(by: AuthContext, raw: string) {
    const domain = normalizeHost(raw);
    if (!domain)
      throw DomainError.validation({
        domain: 'Enter a hostname like shop.example.ge',
      });
    const base = this.env.WEB_BASE_DOMAIN;
    if (base && (domain === base || domain.endsWith(`.${base}`)))
      throw DomainError.validation({
        domain:
          'Addresses under the platform domain are assigned automatically',
      });
    // Global uniqueness needs a cross-tenant look (owner role); the insert itself goes through RLS.
    const taken = await this.prisma.system.organizationDomain.findUnique({
      where: { domain },
    });
    if (taken)
      throw DomainError.conflict(
        'domain_taken',
        taken.orgId === by.orgId
          ? 'Already added'
          : 'This domain belongs to another organization',
      );
    await this.prisma.withOrg(by.orgId, async (tx) => {
      await tx.organizationDomain.createMany({
        data: [{ domain, orgId: by.orgId }],
      });
      await recordAudit(tx, {
        entityType: 'organization',
        entityId: by.orgId,
        action: 'domain_added',
        after: { domain },
      });
    });
    await this.cache.del('web', `host:${domain}`);
    return this.list(by);
  }

  async remove(by: AuthContext, raw: string) {
    const domain = normalizeHost(raw) ?? raw;
    const removed = await this.prisma.withOrg(by.orgId, async (tx) => {
      const res = await tx.organizationDomain.deleteMany({
        where: { domain, orgId: by.orgId },
      });
      if (res.count)
        await recordAudit(tx, {
          entityType: 'organization',
          entityId: by.orgId,
          action: 'domain_removed',
          before: { domain },
        });
      return res.count;
    });
    if (!removed) throw DomainError.notFound('Domain not found');
    await this.cache.del('web', `host:${domain}`);
    return this.list(by);
  }

  /** Storefront: which organization does this Host belong to? */
  async resolve(rawHost: string): Promise<PublicSite | null> {
    const host = normalizeHost(rawHost);
    if (!host) return null;
    const site = await this.cache.wrap(
      'web',
      `host:${host}`,
      60,
      async (): Promise<PublicSite | false> => {
        const db = this.prisma.system;
        let orgId = (
          await db.organizationDomain.findUnique({ where: { domain: host } })
        )?.orgId;
        const base = this.env.WEB_BASE_DOMAIN;
        if (!orgId && base && host.endsWith(`.${base}`)) {
          const slug = host.slice(0, -(base.length + 1));
          if (!slug.includes('.'))
            orgId = (
              await db.organization.findUnique({
                where: { slug },
                select: { id: true },
              })
            )?.id;
        }
        if (!orgId) return false; // cached negative answer (unknown hosts are common: scanners)
        const o = await db.organization.findUniqueOrThrow({
          where: { id: orgId },
        });
        return {
          organizationId: o.id,
          slug: o.slug,
          name: o.name,
          locale: o.locale,
          languages: o.languages,
          timezone: o.timezone,
          baseCurrency: o.baseCurrency,
          country: o.country,
        };
      },
    );
    return site || null;
  }
}
