/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentAuth, RequirePermission } from '../auth/decorators';
import type { AuthContext } from '../auth/tokens';
import { ZodPipe } from '../validation/zod.pipe';
import {
  OrganizationService,
  organizationSettingsSchema,
  roleSchema,
  roleUpdateSchema,
  SUPPORTED_LANGUAGES,
  type OrganizationSettingsInput,
  type RoleInput,
  type RoleUpdateInput,
} from './organization.service';

/** Organization profile (Settings → Organization) and custom roles (Settings → Roles). */
@Controller('org')
export class OrganizationController {
  constructor(private readonly org: OrganizationService) {}

  @Get('settings')
  @RequirePermission('platform:settings:read')
  async settings(@CurrentAuth() auth: AuthContext) {
    return { ...(await this.org.settings(auth)), supportedLanguages: SUPPORTED_LANGUAGES };
  }

  @Patch('settings')
  @RequirePermission('platform:settings:update')
  update(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(organizationSettingsSchema)) body: OrganizationSettingsInput,
  ) {
    return this.org.updateSettings(auth, body);
  }

  @Post('roles')
  @RequirePermission('platform:role:create')
  createRole(@CurrentAuth() auth: AuthContext, @Body(new ZodPipe(roleSchema)) body: RoleInput) {
    return this.org.createRole(auth, body);
  }

  @Patch('roles/:key')
  @RequirePermission('platform:role:update')
  updateRole(
    @CurrentAuth() auth: AuthContext,
    @Param('key') key: string,
    @Body(new ZodPipe(roleUpdateSchema)) body: RoleUpdateInput,
  ) {
    return this.org.updateRole(auth, key, body);
  }

  @Delete('roles/:key')
  @HttpCode(204)
  @RequirePermission('platform:role:delete')
  async deleteRole(@CurrentAuth() auth: AuthContext, @Param('key') key: string): Promise<void> {
    await this.org.deleteRole(auth, key);
  }
}
