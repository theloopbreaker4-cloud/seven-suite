/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentAuth, RequirePermission } from '../auth/decorators';
import type { AuthContext } from '../auth/tokens';
import { ZodPipe } from '../validation/zod.pipe';
import { MemberService } from './member.service';

const changeRoleSchema = z.object({ role: z.string().trim().min(1).max(40) });

@Controller('org')
export class MemberController {
  constructor(private readonly members: MemberService) {}

  @Get('members')
  @RequirePermission('platform:member:read')
  list(@CurrentAuth() auth: AuthContext) {
    return this.members.list(auth);
  }

  @Get('roles')
  @RequirePermission('platform:member:read')
  roles(@CurrentAuth() auth: AuthContext) {
    return this.members.roles(auth);
  }

  @Patch('members/:id')
  @HttpCode(204)
  @RequirePermission('platform:member:update')
  async changeRole(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(changeRoleSchema)) body: z.infer<typeof changeRoleSchema>,
  ): Promise<void> {
    await this.members.changeRole(auth, id, body.role);
  }

  @Delete('members/:id')
  @HttpCode(204)
  @RequirePermission('platform:member:remove')
  async remove(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.members.remove(auth, id);
  }
}
