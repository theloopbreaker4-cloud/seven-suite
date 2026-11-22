/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodPipe } from '../validation/zod.pipe';
import { ApiKeyService } from './api-key.service';
import { CurrentAuth, DemoLocked, RequirePermission, UserOnly } from './decorators';
import type { AuthContext } from './tokens';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(80),
  permissions: z
    .array(z.string().regex(/^[a-z_*]+(:[a-z_*]+){0,2}$/, 'Use module:entity:action'))
    .min(1, 'Pick at least one permission')
    .max(100),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
});
type CreateInput = z.infer<typeof createSchema>;

/** Managing keys is for people only: a key can't create, list or revoke keys. */
@UserOnly()
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly keys: ApiKeyService) {}

  @RequirePermission('platform:api_key:read')
  @Get()
  list(@CurrentAuth() auth: AuthContext) {
    return this.keys.list(auth);
  }

  @DemoLocked()
  @RequirePermission('platform:api_key:create')
  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body(new ZodPipe(createSchema)) body: CreateInput) {
    return this.keys.create(auth, body);
  }

  @RequirePermission('platform:api_key:delete')
  @Delete(':id')
  @HttpCode(204)
  async revoke(@CurrentAuth() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.keys.revoke(auth, id);
  }
}
