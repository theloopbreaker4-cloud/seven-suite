/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth.module.ts
 * Description: Authentication module - configures JWT and Passport strategies for user authentication
 * Created: 2025-10-26
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordResetTokenSchema } from '../schemas/password-reset.schema';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthConfigController } from './auth-config.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';
import { TelegramStrategy } from './strategies/telegram.strategy';
import { UserModule } from '../modules/user.module';
import { TwoFactorService } from '../services/two-factor.service';
import { RecaptchaService } from './recaptcha.service';
import { OAuthConfigService } from '../config/oauth.config';

/**
 * AuthModule - handles user authentication and authorization
 * @remarks Configures JWT with 1 hour expiration and integrates with Passport for strategies
 */
@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: 'PasswordResetToken', schema: PasswordResetTokenSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret123',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController, AuthConfigController],
  providers: [
    AuthService,
    TwoFactorService,
    RecaptchaService,
    OAuthConfigService,
    LocalStrategy,
    JwtStrategy,
    // Only include OAuth strategies if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleStrategy]
      : []),
    ...(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
      ? [FacebookStrategy]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHubStrategy]
      : []),
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? [DiscordStrategy]
      : []),
    ...(process.env.TELEGRAM_BOT_TOKEN
      ? [TelegramStrategy]
      : []),
  ],
  exports: [AuthService, TwoFactorService, RecaptchaService],
})
export class AuthModule {}
