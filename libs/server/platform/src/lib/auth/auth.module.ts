/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginLimiter } from './login-limiter';
import { TokenService } from './tokens';

/** Identity: sessions, tokens, and the deny-by-default guard for every route. */
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    LoginLimiter,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
