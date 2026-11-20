/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { SignJWT } from 'jose';
import type { Env } from '../config/env';
import { TokenService, type AuthContext } from './tokens';

const env = { JWT_SECRET: 's'.repeat(48) } as Env;
const ctx: AuthContext = {
  userId: 'u1',
  orgId: 'o1',
  roleKey: 'owner',
  permissions: ['*'],
};

describe('TokenService', () => {
  const tokens = new TokenService(env);

  it('round-trips an access token', async () => {
    const jwt = await tokens.signAccess(ctx);
    await expect(tokens.verifyAccess(jwt)).resolves.toEqual(ctx);
  });

  it('rejects a token signed with another secret', async () => {
    const other = new TokenService({ JWT_SECRET: 'x'.repeat(48) } as Env);
    await expect(
      tokens.verifyAccess(await other.signAccess(ctx)),
    ).resolves.toBeNull();
  });

  it('rejects tampered, expired and alg=none tokens', async () => {
    const jwt = await tokens.signAccess(ctx);
    const [h, , s] = jwt.split('.');
    const forged = Buffer.from(
      JSON.stringify({ sub: 'u1', org: 'o2', role: 'owner', perms: ['*'] }),
    ).toString('base64url');
    await expect(
      tokens.verifyAccess(`${h}.${forged}.${s}`),
    ).resolves.toBeNull();

    const expired = await new SignJWT({ org: 'o1', role: 'owner', perms: [] })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('u1')
      .setIssuer('seven-suite')
      .setAudience('seven-suite-api')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode(env.JWT_SECRET));
    await expect(tokens.verifyAccess(expired)).resolves.toBeNull();

    const none = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${forged}.`;
    await expect(tokens.verifyAccess(none)).resolves.toBeNull();
  });

  it('issues random refresh tokens and stores only their hash', () => {
    const a = tokens.newRefreshToken();
    const b = tokens.newRefreshToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.hash).toBe(TokenService.hash(a.token));
  });
});
