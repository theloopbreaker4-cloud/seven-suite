/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { cleanupTestRun, createTestApp, http, tokenFromMail } from '../../../test/test-app';

describe('organization settings and custom roles (HTTP)', () => {
  let app: INestApplication;
  const run = randomUUID().slice(0, 8);
  const mail = (n: string) => `${n}-${run}@test.seven`;
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  const password = 'a long password 1';
  let owner: string;
  let admin: string;
  let member: string;
  let memberId: string;

  const join = async (who: string, role: string) => {
    await http(app).post('/api/v1/org/invitations').set(bearer(owner)).send({ email: mail(who), role }).expect(201);
    return (
      await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({ token: tokenFromMail(app, mail(who)), name: who, password })
        .expect(200)
    ).body.accessToken as string;
  };

  beforeAll(async () => {
    app = await createTestApp();
    owner = (
      await http(app)
        .post('/api/v1/auth/signup')
        .send({ email: mail('own'), password, name: 'Own', organizationName: 'Org Settings Co' })
        .expect(201)
    ).body.accessToken;
    admin = await join('adm', 'admin');
    member = await join('mem', 'member');
    const list = await http(app).get('/api/v1/org/members').set(bearer(owner)).expect(200);
    memberId = list.body.items.find((m: { email: string }) => m.email === mail('mem')).id;
  });

  afterAll(async () => {
    await cleanupTestRun(app, run);
    await app.close();
  });

  describe('settings', () => {
    it('shows the profile to admins, not to members', async () => {
      const res = await http(app).get('/api/v1/org/settings').set(bearer(admin)).expect(200);
      expect(res.body).toMatchObject({
        name: 'Org Settings Co',
        country: 'GE',
        baseCurrency: 'GEL',
        timezone: 'Asia/Tbilisi',
        supportedLanguages: ['ka', 'en', 'ru', 'uk', 'az', 'hy'],
      });
      await http(app).get('/api/v1/org/settings').set(bearer(member)).expect(403);
    });

    it('updates and validates', async () => {
      const ok = await http(app)
        .patch('/api/v1/org/settings')
        .set(bearer(admin))
        .send({ name: 'Renamed Co', legalName: 'Renamed LLC', timezone: 'Europe/Kyiv', languages: ['ka', 'en', 'uk'] })
        .expect(200);
      expect(ok.body).toMatchObject({ name: 'Renamed Co', legalName: 'Renamed LLC', timezone: 'Europe/Kyiv', languages: ['ka', 'en', 'uk'] });

      const bad = await http(app)
        .patch('/api/v1/org/settings')
        .set(bearer(admin))
        .send({ timezone: 'Mars/Olympus', baseCurrency: 'gel' })
        .expect(422);
      expect(Object.keys(bad.body.fields).sort()).toEqual(['baseCurrency', 'timezone']);
      // The default language (ka) must stay in the list.
      await http(app).patch('/api/v1/org/settings').set(bearer(admin)).send({ languages: ['en'] }).expect(422);
      await http(app).patch('/api/v1/org/settings').set(bearer(admin)).send({ locale: 'ru' }).expect(422);
      await http(app).patch('/api/v1/org/settings').set(bearer(member)).send({ name: 'x' }).expect(403);
    });
  });

  describe('custom roles', () => {
    it('creates a role with no more than you have', async () => {
      const created = await http(app)
        .post('/api/v1/org/roles')
        .set(bearer(admin))
        .send({ key: 'support', name: 'Support', permissions: ['platform:member:read'] })
        .expect(201);
      expect(created.body).toEqual({ key: 'support', name: 'Support', permissions: ['platform:member:read'], isSystem: false });

      const tooMuch = await http(app)
        .post('/api/v1/org/roles')
        .set(bearer(admin))
        .send({ key: 'god', name: 'God', permissions: ['*'] })
        .expect(403);
      expect(tooMuch.body.code).toBe('cannot_grant');
      await http(app)
        .post('/api/v1/org/roles')
        .set(bearer(admin))
        .send({ key: 'support', name: 'Again', permissions: [] })
        .expect(422);
      await http(app).post('/api/v1/org/roles').set(bearer(member)).send({ key: 'x1', name: 'X', permissions: [] }).expect(403);
    });

    it('edits custom roles but never the built-in ones', async () => {
      await http(app)
        .patch('/api/v1/org/roles/support')
        .set(bearer(admin))
        .send({ name: 'Customer support', permissions: ['platform:member:read', 'platform:member:invite'] })
        .expect(200);
      const sys = await http(app).patch('/api/v1/org/roles/member').set(bearer(owner)).send({ name: 'x' }).expect(403);
      expect(sys.body.code).toBe('system_role');
      const roles = await http(app).get('/api/v1/org/roles').set(bearer(admin)).expect(200);
      expect(roles.body.items.find((r: { key: string }) => r.key === 'support')).toMatchObject({
        name: 'Customer support',
        assignable: true,
      });
    });

    it('cannot delete a role people still have', async () => {
      await http(app).patch(`/api/v1/org/members/${memberId}`).set(bearer(admin)).send({ role: 'support' }).expect(204);
      const busy = await http(app).delete('/api/v1/org/roles/support').set(bearer(admin)).expect(409);
      expect(busy.body.code).toBe('role_in_use');
      await http(app).patch(`/api/v1/org/members/${memberId}`).set(bearer(admin)).send({ role: 'member' }).expect(204);
      await http(app).delete('/api/v1/org/roles/support').set(bearer(admin)).expect(204);
      await http(app).delete('/api/v1/org/roles/support').set(bearer(admin)).expect(404);
    });
  });
});
