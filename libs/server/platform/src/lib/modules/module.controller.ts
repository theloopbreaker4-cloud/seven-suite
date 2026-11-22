/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { z } from 'zod';
import { CurrentAuth, RequirePermission } from '../auth/decorators';
import type { AuthContext } from '../auth/tokens';
import { ZodPipe } from '../validation/zod.pipe';
import { ModuleRegistry } from './module-registry';

const toggleSchema = z.object({ enabled: z.boolean() });

/** Settings → Modules: which parts of the suite this organization uses. */
@Controller('org/modules')
export class ModuleController {
  constructor(private readonly registry: ModuleRegistry) {}

  /** Every signed-in member may see what is enabled (the admin builds its menu from it). */
  @Get()
  async list(@CurrentAuth() auth: AuthContext) {
    return { items: await this.registry.list(auth.orgId) };
  }

  @Put(':id')
  @RequirePermission('platform:settings:update')
  async toggle(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body(new ZodPipe(toggleSchema)) body: z.infer<typeof toggleSchema>,
  ) {
    return { items: await this.registry.setEnabled(auth, id, body.enabled) };
  }
}
