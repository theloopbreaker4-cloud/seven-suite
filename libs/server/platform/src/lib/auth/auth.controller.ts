/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { DomainError } from '../errors/domain-error';
import { ZodPipe } from '../validation/zod.pipe';
import { AccountService } from './account.service';
import { AuthService, isMfaChallenge } from './auth.service';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  mfaLoginSchema,
  type MfaLoginInput,
  switchOrganizationSchema,
  tokenSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignupInput,
  type SwitchOrganizationInput,
  type TokenInput,
} from './auth.schemas';
import { CurrentAuth, DemoLocked, Public, UserOnly } from './decorators';
import {
  clientInfo,
  REFRESH_COOKIE,
  refreshCookieOptions,
  requireXhr,
  sessionResponse,
} from './session-cookie';
import type { AuthContext } from './tokens';

/**
 * Sessions and account recovery. The refresh token only ever travels in the httpOnly cookie;
 * the access token is returned in the body and kept in memory by the client.
 */
@UserOnly()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly account: AccountService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Public demo: whether this is one, and the shared account to sign in with. */
  @Public()
  @Get('demo')
  demo() {
    return this.env.DEMO_MODE
      ? {
          enabled: true,
          email: this.env.DEMO_EMAIL,
          password: this.env.DEMO_PASSWORD,
        }
      : { enabled: false };
  }

  @DemoLocked()
  @Public()
  @Post('signup')
  async signup(
    @Body(new ZodPipe(signupSchema)) body: SignupInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.signup(body, clientInfo(req));
    await this.account.sendVerification(session.auth.userId);
    return sessionResponse(res, session, this.env);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body, clientInfo(req));
    // Two-factor accounts get a short-lived challenge instead of a session (no cookie yet).
    if (isMfaChallenge(result)) return result;
    return sessionResponse(res, result, this.env);
  }

  /** Second sign-in step for accounts with two-factor sign-in. */
  @Public()
  @Post('login/2fa')
  @HttpCode(200)
  async loginSecondFactor(
    @Body(new ZodPipe(mfaLoginSchema)) body: MfaLoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sessionResponse(
      res,
      await this.auth.completeMfaLogin(body.mfaToken, body.code, clientInfo(req)),
      this.env,
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    requireXhr(req);
    const token = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== 'string' || !token) {
      throw DomainError.unauthorized(
        'Session expired, sign in again',
        'session_expired',
      );
    }
    try {
      return sessionResponse(
        res,
        await this.auth.refresh(token, clientInfo(req)),
        this.env,
      );
    } catch (e) {
      res.clearCookie(REFRESH_COOKIE, refreshCookieOptions(this.env));
      throw e;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    requireXhr(req);
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions(this.env));
  }

  @Get('me')
  me(@CurrentAuth() auth: AuthContext) {
    return this.auth.me(auth);
  }

  @Post('switch-organization')
  @HttpCode(200)
  async switchOrganization(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(switchOrganizationSchema)) body: SwitchOrganizationInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.switchOrganization(
      auth,
      body.organization,
      clientInfo(req),
    );
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]); // the old organization's session ends
    return sessionResponse(res, session, this.env);
  }

  @DemoLocked()
  @Post('verify-email/request')
  @HttpCode(202)
  async requestVerification(@CurrentAuth() auth: AuthContext): Promise<void> {
    await this.account.sendVerification(auth.userId);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(204)
  async verifyEmail(
    @Body(new ZodPipe(tokenSchema)) body: TokenInput,
  ): Promise<void> {
    await this.account.verifyEmail(body.token);
  }

  @DemoLocked()
  @Public()
  @Post('password/forgot')
  @HttpCode(202)
  async forgotPassword(
    @Body(new ZodPipe(forgotPasswordSchema)) body: ForgotPasswordInput,
    @Req() req: Request,
  ) {
    await this.account.forgotPassword(body.email, clientInfo(req).ip);
    return {
      message:
        'If an account exists for this email, a reset link is on its way.',
    };
  }

  @DemoLocked()
  @Public()
  @Post('password/reset')
  @HttpCode(204)
  async resetPassword(
    @Body(new ZodPipe(resetPasswordSchema)) body: ResetPasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.account.resetPassword(
      body.token,
      body.password,
      clientInfo(req).ip,
    );
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions(this.env));
  }
}
