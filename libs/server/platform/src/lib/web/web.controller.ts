/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { CurrentAuth, RequirePermission, ServiceOnly } from '../auth/decorators';
import type { AuthContext } from '../auth/tokens';
import { DomainError } from '../errors/domain-error';
import { DomainService } from '../org/domain.service';
import { ZodPipe } from '../validation/zod.pipe';

const hostQuery = z.object({ host: z.string().min(3).max(300) });
const domainBody = z.object({ domain: z.string().min(3).max(300) });

/** Calls from the Next.js storefront server (service key only). */
@Controller('web')
export class WebController {
  constructor(private readonly domains: DomainService) {}

  /** The organization a storefront Host belongs to — 404 for unknown hosts. */
  @ServiceOnly()
  @Get('site')
  async site(@Query(new ZodPipe(hostQuery)) q: z.infer<typeof hostQuery>) {
    const site = await this.domains.resolve(q.host);
    if (!site) throw DomainError.notFound('No site for this host', 'site_not_found');
    return site;
  }
}

/** Settings → Organization → Domains. */
@Controller('org/domains')
export class DomainController {
  constructor(private readonly domains: DomainService) {}

  @Get()
  @RequirePermission('platform:settings:read')
  list(@CurrentAuth() auth: AuthContext) {
    return this.domains.list(auth);
  }

  @Post()
  @RequirePermission('platform:settings:update')
  add(@CurrentAuth() auth: AuthContext, @Body(new ZodPipe(domainBody)) body: z.infer<typeof domainBody>) {
    return this.domains.add(auth, body.domain);
  }

  @Delete(':domain')
  @RequirePermission('platform:settings:update')
  remove(@CurrentAuth() auth: AuthContext, @Param('domain') domain: string) {
    return this.domains.remove(auth, domain);
  }
}
