/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MailService } from '../mail/mail.service';
import { RateLimiter } from '../redis/rate-limiter';
import { AccountService } from './account.service';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { DemoGuard } from './demo.guard';
import { AuthService } from './auth.service';
import {
  InvitationAcceptController,
  InvitationController,
} from './invitation.controller';
import { InvitationService } from './invitation.service';
import { LoginLimiter } from './login-limiter';
import { TokenService } from './tokens';
import { MemberController } from '../org/member.controller';
import { MemberService } from '../org/member.service';
import { OrganizationController } from '../org/organization.controller';
import { OrganizationService } from '../org/organization.service';

/** Identity: sessions, account recovery, invitations, and the deny-by-default guard. */
@Module({
  controllers: [
    AuthController,
    InvitationController,
    InvitationAcceptController,
    MemberController,
    TwoFactorController,
    ApiKeyController,
    OrganizationController,
  ],
  providers: [
    AuthService,
    AccountService,
    InvitationService,
    MemberService,
    OrganizationService,
    TwoFactorService,
    ApiKeyService,
    TokenService,
    LoginLimiter,
    RateLimiter,
    MailService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: DemoGuard },
  ],
  exports: [AuthService, TokenService, MailService, RateLimiter, ApiKeyService, TwoFactorService],
})
export class AuthModule {}
