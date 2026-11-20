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
import { MailService } from '../mail/mail.service';

describe('email verification, password reset, invitations (HTTP)', () => {
  let app: INestApplication;
  const run = randomUUID().slice(0, 8);
  const mail = (name: string) => `${name}-${run}@test.seven`;
  const pw = 'first password 123';

  const signup = async (email: string, org: string) => {
    const res = await http(app)
      .post('/api/v1/auth/signup')
      .send({
        email,
        password: pw,
        name: email.split('-')[0],
        organizationName: org,
      })
      .expect(201);
    return {
      token: res.body.accessToken as string,
      cookie: refreshCookie(res),
    };
  };
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await cleanupTestRun(app, run);
    await app.close();
  });

  describe('email verification', () => {
    it('sends a link on sign-up that verifies the address once', async () => {
      const email = mail('verify');
      const { token } = await signup(email, 'Verify Co');
      const link = tokenFromMail(app, email);

      let me = await http(app)
        .get('/api/v1/auth/me')
        .set(bearer(token))
        .expect(200);
      expect(me.body.user.emailVerified).toBeNull();

      await http(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: link })
        .expect(204);
      me = await http(app)
        .get('/api/v1/auth/me')
        .set(bearer(token))
        .expect(200);
      expect(me.body.user.emailVerified).toBeTruthy();

      const again = await http(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: link })
        .expect(400);
      expect(again.body.code).toBe('invalid_token');
    });
  });

  describe('password reset', () => {
    const email = mail('reset');
    let oldCookie: string;

    beforeAll(async () => {
      oldCookie = (await signup(email, 'Reset Co')).cookie;
    });

    it('answers the same for unknown addresses and sends nothing', async () => {
      const before = app.get(MailService).sent.length;
      const res = await http(app)
        .post('/api/v1/auth/password/forgot')
        .send({ email: mail('nobody') })
        .expect(202);
      expect(res.body.message).toMatch(/If an account exists/);
      expect(app.get(MailService).sent.length).toBe(before);
    });

    it('resets the password and signs out every session', async () => {
      await http(app)
        .post('/api/v1/auth/password/forgot')
        .send({ email })
        .expect(202);
      const link = tokenFromMail(app, email);
      await http(app)
        .post('/api/v1/auth/password/reset')
        .send({ token: link, password: 'brand new password 456' })
        .expect(204);

      await http(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', oldCookie)
        .set('X-Requested-With', 'x')
        .expect(401);
      await http(app)
        .post('/api/v1/auth/login')
        .send({ email, password: pw })
        .expect(401);
      await http(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'brand new password 456' })
        .expect(200);

      const reuse = await http(app)
        .post('/api/v1/auth/password/reset')
        .send({ token: link, password: 'yet another password 789' })
        .expect(400);
      expect(reuse.body.code).toBe('invalid_token');
    });
  });

  describe('invitations', () => {
    const ownerEmail = mail('owner');
    let owner: string;

    beforeAll(async () => {
      owner = (await signup(ownerEmail, 'Acme Invite')).token;
    });

    it('invites a new person who creates an account and joins with the role', async () => {
      const invitee = mail('newbie');
      const inv = await http(app)
        .post('/api/v1/org/invitations')
        .set(bearer(owner))
        .send({ email: invitee, role: 'member' })
        .expect(201);
      expect(inv.body).toMatchObject({ email: invitee, role: 'member' });

      const token = tokenFromMail(app, invitee);
      const preview = await http(app)
        .get('/api/v1/auth/invitations/preview')
        .query({ token })
        .expect(200);
      expect(preview.body).toEqual({
        organization: 'Acme Invite',
        email: invitee,
        role: 'member',
        hasAccount: false,
      });

      const missing = await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({ token })
        .expect(422);
      expect(Object.keys(missing.body.fields).sort()).toEqual([
        'name',
        'password',
      ]);

      const accepted = await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({ token, name: 'Newbie', password: 'newbie password 1' })
        .expect(200);
      expect(accepted.body.role).toBe('member');

      // A member may not invite.
      await http(app)
        .post('/api/v1/org/invitations')
        .set(bearer(accepted.body.accessToken))
        .send({ email: mail('x'), role: 'member' })
        .expect(403);

      // The link works once.
      await http(app)
        .get('/api/v1/auth/invitations/preview')
        .query({ token })
        .expect(400);
    });

    it('an admin cannot hand out the owner role', async () => {
      const adminEmail = mail('admin');
      await http(app)
        .post('/api/v1/org/invitations')
        .set(bearer(owner))
        .send({ email: adminEmail, role: 'admin' })
        .expect(201);
      const admin = await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({
          token: tokenFromMail(app, adminEmail),
          name: 'Admin',
          password: 'admin password 1',
        })
        .expect(200);
      const res = await http(app)
        .post('/api/v1/org/invitations')
        .set(bearer(admin.body.accessToken))
        .send({ email: mail('wannabe'), role: 'owner' })
        .expect(403);
      expect(res.body.code).toBe('role_too_powerful');
      await http(app)
        .post('/api/v1/org/invitations')
        .set(bearer(admin.body.accessToken))
        .send({ email: mail('helper'), role: 'member' })
        .expect(201);
    });

    it('an existing user proves their password, then can switch between organizations', async () => {
      const otherEmail = mail('other');
      const other = await signup(otherEmail, 'Other Org');
      await http(app)
        .post('/api/v1/org/invitations')
        .set(bearer(owner))
        .send({ email: otherEmail, role: 'member' })
        .expect(201);
      const token = tokenFromMail(app, otherEmail);

      expect(
        (
          await http(app)
            .get('/api/v1/auth/invitations/preview')
            .query({ token })
        ).body.hasAccount,
      ).toBe(true);
      await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({ token, password: 'wrong password!' })
        .expect(401);
      await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({ token, password: pw })
        .expect(200);

      const me = await http(app)
        .get('/api/v1/auth/me')
        .set(bearer(other.token))
        .expect(200);
      expect(
        me.body.organizations.map((o: { name: string }) => o.name).sort(),
      ).toEqual(['Acme Invite', 'Other Org']);
      const acme = me.body.organizations.find(
        (o: { name: string }) => o.name === 'Acme Invite',
      );

      const switched = await http(app)
        .post('/api/v1/auth/switch-organization')
        .set(bearer(other.token))
        .set('Cookie', other.cookie)
        .send({ organization: acme.slug })
        .expect(200);
      expect(switched.body.organizationId).toBe(acme.id);
      expect(switched.body.role).toBe('member');
      // The previous organization's session is closed.
      await http(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', other.cookie)
        .set('X-Requested-With', 'x')
        .expect(401);

      await http(app)
        .post('/api/v1/auth/switch-organization')
        .set(bearer(switched.body.accessToken))
        .send({ organization: 'not-mine' })
        .expect(403);
    });

    it('revoked invitations stop working and are listed only while pending', async () => {
      const email = mail('revoked');
      const inv = await http(app)
        .post('/api/v1/org/invitations')
        .set(bearer(owner))
        .send({ email, role: 'member' })
        .expect(201);
      const listed = await http(app)
        .get('/api/v1/org/invitations')
        .set(bearer(owner))
        .expect(200);
      expect(
        listed.body.items.map((i: { email: string }) => i.email),
      ).toContain(email);

      await http(app)
        .delete(`/api/v1/org/invitations/${inv.body.id}`)
        .set(bearer(owner))
        .expect(204);
      await http(app)
        .get('/api/v1/auth/invitations/preview')
        .query({ token: tokenFromMail(app, email) })
        .expect(400);
      const after = await http(app)
        .get('/api/v1/org/invitations')
        .set(bearer(owner))
        .expect(200);
      expect(
        after.body.items.map((i: { email: string }) => i.email),
      ).not.toContain(email);
    });
  });
});
