/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Time-based one-time passwords (RFC 6238: HMAC-SHA1, 6 digits, 30 s) — what Google
 * Authenticator, 1Password, Authy… implement — plus at-rest encryption for the shared secret.
 */

export const TOTP_PERIOD = 30;
export const TOTP_DIGITS = 6;
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** 160-bit secret, base32 (the format authenticator apps expect). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpStep(now = Date.now()): number {
  return Math.floor(now / 1000 / TOTP_PERIOD);
}

export function totpCode(secretB32: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac('sha1', base32Decode(secretB32))
    .update(counter)
    .digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = (mac.readUInt32BE(offset) & 0x7fffffff) % 10 ** TOTP_DIGITS;
  return bin.toString().padStart(TOTP_DIGITS, '0');
}

/**
 * Check `code` against the current step ±`window` (clock drift). Returns the matching step, or
 * null. Steps ≤ `lastStep` are refused, so a code (even an intercepted one) works only once.
 */
export function verifyTotp(
  secretB32: string,
  code: string,
  lastStep: number | null,
  now = Date.now(),
  window = 1,
): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const current = totpStep(now);
  for (let step = current - window; step <= current + window; step++) {
    if (lastStep !== null && step <= lastStep) continue;
    const expected = Buffer.from(totpCode(secretB32, step));
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

export function otpauthUrl(
  secretB32: string,
  account: string,
  issuer = 'Seven Suite',
): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretB32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** AES-256-GCM with a key derived from the app secret (HKDF, own context string). */
export class SecretBox {
  private readonly key: Buffer;

  constructor(appSecret: string, context: string) {
    this.key = Buffer.from(
      hkdfSync('sha256', appSecret, 'seven-suite', context, 32),
    );
  }

  seal(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      body.toString('base64url'),
    ].join('.');
  }

  open(sealed: string): string {
    const [v, iv, tag, body] = sealed.split('.');
    if (v !== 'v1' || !iv || !tag || !body)
      throw new Error('Unsupported sealed value');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(body, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}

/** Ten recovery codes like `k7f2-9qxm-3hdw`: 60 bits each, easy to type. */
export function generateRecoveryCodes(count = 10): string[] {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(12);
    const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
    return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
  });
}

export function normalizeRecoveryCode(code: string): string {
  return code
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^(.{4})(.{4})(.{4})$/, '$1-$2-$3');
}
