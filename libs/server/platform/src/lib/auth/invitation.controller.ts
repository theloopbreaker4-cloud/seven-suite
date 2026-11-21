/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { ZodPipe } from '../validation/zod.pipe';
import {
  acceptInvitationSchema,
  inviteSchema,
  tokenSchema,
  type AcceptInvitationInput,
  type InviteInput,
  type TokenInput,
} from './auth.schemas';
import {
  CurrentAuth,
  DemoLocked,
  Public,
  RequirePermission,
} from './decorators';
import { InvitationService } from './invitation.service';
import { clientInfo, sessionResponse } from './session-cookie';
import type { AuthContext } from './tokens';

/** Managing invitations inside the current organization. */
@Controller('org/invitations')
export class InvitationController {
  constructor(private readonly invitations: InvitationService) {}

  @Get()
  @RequirePermission('platform:member:read')
  list(@CurrentAuth() auth: AuthContext) {
    return this.invitations.list(auth);
  }

  @DemoLocked()
  @Post()
  @RequirePermission('platform:member:invite')
  invite(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(inviteSchema)) body: InviteInput,
  ) {
    return this.invitations.invite(auth, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('platform:member:invite')
  async revoke(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.invitations.revoke(auth, id);
  }
}

/** The invitee's side: look at an invitation and accept it (no session yet). */
@Controller('auth/invitations')
export class InvitationAcceptController {
  constructor(
    private readonly invitations: InvitationService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Public()
  @Get('preview')
  preview(@Query(new ZodPipe(tokenSchema)) query: TokenInput) {
    return this.invitations.preview(query.token);
  }

  @DemoLocked()
  @Public()
  @Post('accept')
  @HttpCode(200)
  async accept(
    @Body(new ZodPipe(acceptInvitationSchema)) body: AcceptInvitationInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.invitations.accept(
      body.token,
      body,
      clientInfo(req),
    );
    return sessionResponse(res, session, this.env);
  }
}
