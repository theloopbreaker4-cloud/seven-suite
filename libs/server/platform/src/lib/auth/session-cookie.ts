/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { CookieOptions, Request, Response } from 'express';
import type { Env } from '../config/env';
import { DomainError } from '../errors/domain-error';
import type { ClientInfo, Session } from './auth.service';

export const REFRESH_COOKIE = 'seven_rt';
/** Where the browser sees the auth routes: behind /suite the proxy strips the prefix, the cookie must not. */
const cookiePath = (env: Env) => `${env.PUBLIC_BASE_PATH}/api/v1/auth`;

/** httpOnly + SameSite=Strict, scoped to the auth routes; Secure in production. */
export function refreshCookieOptions(env: Env): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
    path: cookiePath(env),
  };
}

/** Set the refresh cookie and return what the client may see (never the refresh token). */
export function sessionResponse(res: Response, session: Session, env: Env) {
  res.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...refreshCookieOptions(env),
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

export function clientInfo(req: Request): ClientInfo {
  return { ip: req.ip ?? 'unknown', userAgent: req.headers['user-agent'] };
}

/** Cookie-authenticated routes need a header a cross-site form can't send (CSRF). */
export function requireXhr(req: Request): void {
  if (!req.headers['x-requested-with']) {
    throw DomainError.forbidden(
      'Missing X-Requested-With header',
      'csrf_check_failed',
    );
  }
}
