/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import {
  cleanupTestRun,
  createTestApp,
  http,
  refreshCookie,
  tokenFromMail,
} from '../../../test/test-app';
import { PrismaService } from '../db/prisma.service';
import { totpCode, totpStep } from './totp';

/** Two-factor sign-in, API keys and the audit trail, over HTTP on a real database. */
describe('two-factor sign-in, API keys, audit (HTTP)', () => {
  let app: INestApplication;
  const run = randomUUID().slice(0, 8);
  const mail = (n: string) => `${n}-${run}@test.seven`;
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  const password = 'a long password 1';
  let owner: string;
  let ownerUserId: string;
  let orgId: string;
  let member: string;

  beforeAll(async () => {
    process.env['PLATFORM_ADMINS'] = mail('own');
    app = await createTestApp();
    const res = await http(app)
      .post('/api/v1/auth/signup')
      .set('X-Request-Id', `signup-${run}`)
      .send({ email: mail('own'), password, name: 'Own', organizationName: 'Security Co' })
      .expect(201);
    owner = res.body.accessToken;
    const me = await http(app).get('/api/v1/auth/me').set(bearer(owner)).expect(200);
    ownerUserId = me.body.user.id;
    orgId = me.body.organization.id;

    await http(app).post('/api/v1/org/invitations').set(bearer(owner)).send({ email: mail('mem'), role: 'member' }).expect(201);
    member = (
      await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({ token: tokenFromMail(app, mail('mem')), name: 'Mem', password })
        .expect(200)
    ).body.accessToken;
  });

  afterAll(async () => {
    delete process.env['PLATFORM_ADMINS'];
    await cleanupTestRun(app, run);
    await app.close();
  });

  describe('two-factor sign-in', () => {
    let secret: string;
    let recovery: string[];
    const login = () => http(app).post('/api/v1/auth/login').send({ email: mail('own'), password });

    it('sets up and enables with a code from the app', async () => {
      const setup = await http(app).post('/api/v1/auth/2fa/setup').set(bearer(owner)).expect(200);
      secret = setup.body.secret;
      expect(setup.body.otpauthUrl).toContain('otpauth://totp/');
      await http(app).post('/api/v1/auth/2fa/enable').set(bearer(owner)).send({ code: '000000' }).expect(422);
      const step = totpStep();
      const on = await http(app)
        .post('/api/v1/auth/2fa/enable')
        .set(bearer(owner))
        .send({ code: totpCode(secret, step) })
        .expect(200);
      recovery = on.body.recoveryCodes;
      expect(recovery).toHaveLength(10);
      const status = await http(app).get('/api/v1/auth/2fa').set(bearer(owner)).expect(200);
      expect(status.body).toMatchObject({ enabled: true, recoveryCodesLeft: 10 });
    });

    it('stores the secret encrypted', async () => {
      const u = await app.get(PrismaService).system.user.findUniqueOrThrow({ where: { id: ownerUserId } });
      expect(u.totpSecret).toMatch(/^v1\./);
      expect(u.totpSecret).not.toContain(secret);
    });

    it('asks for a second factor instead of starting a session', async () => {
      const res = await login().expect(200);
      expect(res.body).toEqual({ mfaRequired: true, mfaToken: expect.any(String) });
      expect(res.headers['set-cookie']).toBeUndefined();
      // The challenge token is not an access token.
      await http(app).get('/api/v1/auth/me').set(bearer(res.body.mfaToken)).expect(401);
    });

    it('signs in with the next app code, which then cannot be reused', async () => {
      const { mfaToken } = (await login().expect(200)).body;
      await http(app).post('/api/v1/auth/login/2fa').send({ mfaToken, code: '123456' }).expect(401);
      const code = totpCode(secret, totpStep() + 1); // the enable step is already used
      const ok = await http(app).post('/api/v1/auth/login/2fa').send({ mfaToken, code }).expect(200);
      expect(ok.body.accessToken).toEqual(expect.any(String));
      refreshCookie(ok);
      const again = (await login().expect(200)).body.mfaToken;
      await http(app).post('/api/v1/auth/login/2fa').send({ mfaToken: again, code }).expect(401);
    });

    it('accepts each recovery code once', async () => {
      const { mfaToken } = (await login().expect(200)).body;
      await http(app)
        .post('/api/v1/auth/login/2fa')
        .send({ mfaToken, code: recovery[0].toUpperCase() })
        .expect(200);
      const second = (await login().expect(200)).body.mfaToken;
      await http(app).post('/api/v1/auth/login/2fa').send({ mfaToken: second, code: recovery[0] }).expect(401);
      const status = await http(app).get('/api/v1/auth/2fa').set(bearer(owner)).expect(200);
      expect(status.body.recoveryCodesLeft).toBe(9);
    });

    it('turns off only with the password and a code', async () => {
      await http(app)
        .post('/api/v1/auth/2fa/disable')
        .set(bearer(owner))
        .send({ password: 'wrong password', code: recovery[1] })
        .expect(422);
      await http(app)
        .post('/api/v1/auth/2fa/disable')
        .set(bearer(owner))
        .send({ password, code: recovery[1] })
        .expect(204);
      const res = await login().expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });
  });

  describe('API keys', () => {
    let key: string;
    let keyId: string;

    it('creates a key shown once, with no more rights than its creator', async () => {
      await http(app)
        .post('/api/v1/api-keys')
        .set(bearer(member))
        .send({ name: 'x', permissions: ['platform:member:read'] })
        .expect(403); // members have no api_key permission
      const res = await http(app)
        .post('/api/v1/api-keys')
        .set(bearer(owner))
        .send({ name: 'CRM sync', permissions: ['platform:member:read'] })
        .expect(201);
      key = res.body.key;
      keyId = res.body.id;
      expect(key).toMatch(/^sv_[\w-]{43}$/);
      const list = await http(app).get('/api/v1/api-keys').set(bearer(owner)).expect(200);
      expect(list.body.items[0]).toMatchObject({ id: keyId, prefix: key.slice(0, 12), active: true });
      expect(JSON.stringify(list.body)).not.toContain(key);
    });

    it('authenticates with X-Api-Key or Bearer, only for granted permissions', async () => {
      await http(app).get('/api/v1/org/members').set('X-Api-Key', key).expect(200);
      await http(app).get('/api/v1/org/members').set(bearer(key)).expect(200);
      await http(app)
        .post('/api/v1/org/invitations')
        .set('X-Api-Key', key)
        .send({ email: mail('nope'), role: 'member' })
        .expect(403);
    });

    it('cannot manage sessions, 2FA or keys', async () => {
      for (const [method, path] of [
        ['get', '/api/v1/auth/me'],
        ['get', '/api/v1/auth/2fa'],
        ['get', '/api/v1/api-keys'],
      ] as const) {
        const res = await http(app)[method](path).set('X-Api-Key', key).expect(403);
        expect(res.body.code).toBe('api_key_not_allowed');
      }
    });

    it('stops working when revoked', async () => {
      await http(app).delete(`/api/v1/api-keys/${keyId}`).set(bearer(owner)).expect(204);
      await http(app).get('/api/v1/org/members').set('X-Api-Key', key).expect(401);
    });

    it('refuses unknown or malformed keys', async () => {
      await http(app).get('/api/v1/org/members').set('X-Api-Key', 'sv_nope').expect(401);
      await http(app).get('/api/v1/org/members').set('X-Api-Key', 'x'.repeat(500)).expect(401);
    });
  });

  it('shows queue internals to platform operators only', async () => {
    const ok = await http(app).get('/api/v1/system/queues').set(bearer(owner)).expect(200);
    expect(ok.body.queues.map((q: { name: string }) => q.name)).toEqual(['seven-events', 'seven-scheduler']);
    expect(ok.body.outbox).toEqual({ pending: expect.any(Number), failing: expect.any(Number) });
    const denied = await http(app).get('/api/v1/system/queues').set(bearer(member)).expect(403);
    expect(denied.body.code).toBe('not_platform_admin');
    await http(app).get('/api/v1/system/queues/nope/failed').set(bearer(owner)).expect(404);
  });

  it('writes an audit trail with request id, ip and no secrets', async () => {
    const db = app.get(PrismaService).system;
    const rows = await db.auditLog.findMany({ where: { OR: [{ orgId }, { actorId: ownerUserId }] } });
    const actions = rows.map((r) => r.action);
    expect(actions).toEqual(
      expect.arrayContaining(['created', '2fa_enabled', 'login', 'login_recovery_code', '2fa_disabled', 'revoked']),
    );
    const signup = rows.find((r) => r.entityType === 'organization' && r.action === 'created');
    expect(signup?.requestId).toBe(`signup-${run}`);
    expect(signup?.ip).toBeTruthy();
    expect(JSON.stringify(rows)).not.toMatch(/sv_[\w-]{20}/);
    // The same changes went to the outbox for consumers.
    const events = await db.outboxEvent.findMany({ where: { orgId } });
    expect(events.map((e) => e.name)).toEqual(
      expect.arrayContaining(['platform.organization.created', 'platform.member.invited', 'platform.api_key.created']),
    );
  });
});
