/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MailService } from '../mail/mail.service';
import { RateLimiter } from '../redis/rate-limiter';
import { AccountService } from './account.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import {
  InvitationAcceptController,
  InvitationController,
} from './invitation.controller';
import { InvitationService } from './invitation.service';
import { LoginLimiter } from './login-limiter';
import { TokenService } from './tokens';

/** Identity: sessions, account recovery, invitations, and the deny-by-default guard. */
@Module({
  controllers: [
    AuthController,
    InvitationController,
    InvitationAcceptController,
  ],
  providers: [
    AuthService,
    AccountService,
    InvitationService,
    TokenService,
    LoginLimiter,
    RateLimiter,
    MailService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthService, TokenService, MailService, RateLimiter],
})
export class AuthModule {}
