/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

const scrypt = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, options, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

// scrypt from Node's crypto: memory-hard, no native dependency. N=2^15, r=8 ≈ 32 MB per hash.
const N = 32768;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

/** Format: `scrypt$N$r$p$saltB64$hashB64` — parameters travel with the hash so they can be raised later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return [
    'scrypt',
    N,
    R,
    P,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const key = await scrypt(
    password.normalize('NFKC'),
    Buffer.from(saltB64, 'base64'),
    expected.length,
    {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    },
  );
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** True when a stored hash uses weaker parameters than today's — rehash after a successful login. */
export function needsRehash(stored: string): boolean {
  const [, n, r, p] = stored.split('$');
  return Number(n) < N || Number(r) < R || Number(p) < P;
}

/** A pre-computed hash so login spends the same time whether or not the email exists. */
export const DUMMY_PASSWORD_HASH =
  'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' +
  Buffer.alloc(64).toString('base64');
