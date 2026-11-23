/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_DAYS = 30;

/** What an authenticated request knows about its caller. */
export interface AuthContext {
  userId: string;
  orgId: string;
  roleKey: string;
  permissions: string[];
  /** Set when the caller is an API key (then `userId` is the key's creator). */
  apiKeyId?: string;
}

const ISSUER = 'seven-suite';
const AUDIENCE = 'seven-suite-api';
const MFA_AUDIENCE = 'seven-suite-mfa';
export const MFA_TTL_SECONDS = 5 * 60;

/** Short-lived access JWTs (HS256) and opaque refresh tokens (only their SHA-256 is stored). */
@Injectable()
export class TokenService {
  private readonly key: Uint8Array;

  constructor(@Inject(ENV) env: Env) {
    this.key = new TextEncoder().encode(env.JWT_SECRET);
  }

  async signAccess(ctx: AuthContext): Promise<string> {
    return new SignJWT({
      org: ctx.orgId,
      role: ctx.roleKey,
      perms: ctx.permissions,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(ctx.userId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
      .sign(this.key);
  }

  /** Returns the caller, or null for any invalid, expired or foreign token. */
  async verifyAccess(token: string): Promise<AuthContext | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
      });
      const { sub, org, role, perms } = payload as Record<string, unknown>;
      if (
        typeof sub !== 'string' ||
        typeof org !== 'string' ||
        typeof role !== 'string'
      )
        return null;
      if (!Array.isArray(perms) || !perms.every((p) => typeof p === 'string'))
        return null;
      return {
        userId: sub,
        orgId: org,
        roleKey: role,
        permissions: perms as string[],
      };
    } catch {
      return null;
    }
  }

  /**
   * Proof that the password was right, for the second sign-in step only (5 minutes). Its own
   * audience: it can never be used as an access token.
   */
  async signMfa(userId: string, orgId: string): Promise<string> {
    return new SignJWT({ org: orgId })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(ISSUER)
      .setAudience(MFA_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${MFA_TTL_SECONDS}s`)
      .sign(this.key);
  }

  async verifyMfa(
    token: string,
  ): Promise<{ userId: string; orgId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        audience: MFA_AUDIENCE,
        algorithms: ['HS256'],
      });
      const { sub, org } = payload as Record<string, unknown>;
      return typeof sub === 'string' && typeof org === 'string'
        ? { userId: sub, orgId: org }
        : null;
    } catch {
      return null;
    }
  }

  newRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: TokenService.hash(token) };
  }

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
