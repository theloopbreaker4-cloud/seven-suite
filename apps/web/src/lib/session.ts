/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Customer session plumbing (docs/03-architecture.md §6): the Next.js server keeps the customer's
 * session in an httpOnly cookie and calls the API server-to-server; the browser never holds API
 * tokens. The cookie carries a small signed payload (HMAC-SHA256, WEB_SESSION_SECRET) with an
 * expiry; it is scoped to one organization so a cookie from one shop is useless on another.
 */
export const SESSION_COOKIE = 'seven_cs';
export const SESSION_TTL_SECONDS = 30 * 24 * 3600;

export interface CustomerSession {
  /** Organization the session belongs to. */
  org: string;
  /** Customer id once signed in; absent for a guest (cart only). */
  sub?: string;
  /** Anonymous cart / visitor id. */
  vid: string;
  /** Expiry, unix seconds. */
  exp: number;
}

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function sealSession(session: CustomerSession, secret: string): string {
  if (secret.length < 32) throw new Error('WEB_SESSION_SECRET must be at least 32 characters');
  const payload = b64(JSON.stringify(session));
  return `${payload}.${sign(payload, secret)}`;
}

/** The session, or null if the cookie is missing, tampered with, expired or for another organization. */
export function openSession(value: string | undefined, secret: string, orgId: string, now = Date.now()): CustomerSession | null {
  if (!value || secret.length < 32) return null;
  const [payload, mac] = value.split('.');
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as CustomerSession;
    if (typeof s.exp !== 'number' || s.exp * 1000 <= now) return null;
    if (s.org !== orgId || typeof s.vid !== 'string') return null;
    return s;
  } catch {
    return null;
  }
}

/** Cookie attributes for the session (Secure outside local development). */
export function sessionCookieOptions(secure: boolean) {
  return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: SESSION_TTL_SECONDS };
}
