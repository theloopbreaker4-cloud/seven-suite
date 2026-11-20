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
import type { CookieOptions, Request, Response } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { DomainError } from '../errors/domain-error';
import { ZodPipe } from '../validation/zod.pipe';
import { AuthService, type ClientInfo, type Session } from './auth.service';
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from './auth.schemas';
import { CurrentAuth, Public } from './decorators';
import type { AuthContext } from './tokens';

export const REFRESH_COOKIE = 'seven_rt';
const COOKIE_PATH = '/api/v1/auth';

/**
 * The refresh token lives only in an httpOnly, SameSite=Strict cookie scoped to the auth
 * routes; the access token is returned in the body and kept in memory by the client.
 * Cookie-authenticated routes (refresh, logout) also require `X-Requested-With`, a header a
 * cross-site form can't send — so they can't be triggered by CSRF.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Public()
  @Post('signup')
  async signup(
    @Body(new ZodPipe(signupSchema)) body: SignupInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.signup(body, client(req)));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.login(body, client(req)));
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
      return this.respond(res, await this.auth.refresh(token, client(req)));
    } catch (e) {
      res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
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
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @Get('me')
  me(@CurrentAuth() auth: AuthContext) {
    return this.auth.me(auth);
  }

  private respond(res: Response, session: Session) {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...this.cookieOptions(),
      expires: session.refreshExpiresAt,
    });
    return {
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
      organizationId: session.auth.orgId,
      role: session.auth.roleKey,
      permissions: session.auth.permissions,
    };
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.env.NODE_ENV === 'production',
      path: COOKIE_PATH,
    };
  }
}

function client(req: Request): ClientInfo {
  return { ip: req.ip ?? 'unknown', userAgent: req.headers['user-agent'] };
}

function requireXhr(req: Request): void {
  if (!req.headers['x-requested-with']) {
    throw DomainError.forbidden(
      'Missing X-Requested-With header',
      'csrf_check_failed',
    );
  }
}
