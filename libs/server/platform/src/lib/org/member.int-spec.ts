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

describe('members and roles (HTTP)', () => {
  let app: INestApplication;
  const run = randomUUID().slice(0, 8);
  const mail = (n: string) => `${n}-${run}@test.seven`;
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  let owner: string;
  let admin: string;
  let member: string;
  let memberCookie: string;

  const join = async (email: string, role: string) => {
    await http(app)
      .post('/api/v1/org/invitations')
      .set(bearer(owner))
      .send({ email, role })
      .expect(201);
    const res = await http(app)
      .post('/api/v1/auth/invitations/accept')
      .send({
        token: tokenFromMail(app, email),
        name: email.split('-')[0],
        password: 'a long password 1',
      })
      .expect(200);
    return res;
  };

  beforeAll(async () => {
    app = await createTestApp();
    const res = await http(app)
      .post('/api/v1/auth/signup')
      .send({
        email: mail('own'),
        password: 'a long password 1',
        name: 'Own',
        organizationName: 'Members Co',
      })
      .expect(201);
    owner = res.body.accessToken;
    admin = (await join(mail('adm'), 'admin')).body.accessToken;
    const m = await join(mail('mem'), 'member');
    member = m.body.accessToken;
    memberCookie = refreshCookie(m);
  });
  afterAll(async () => {
    await cleanupTestRun(app, run);
    await app.close();
  });

  const list = async (token: string) =>
    (await http(app).get('/api/v1/org/members').set(bearer(token)).expect(200))
      .body.items as Array<{
      id: string;
      email: string;
      role: { key: string };
      isYou: boolean;
    }>;

  it('lists members (any member may read) and marks the caller', async () => {
    const items = await list(member);
    expect(items.map((i) => i.role.key)).toEqual(['owner', 'admin', 'member']);
    expect(items.find((i) => i.isYou)?.email).toBe(mail('mem'));
  });

  it('tells which roles the caller may assign', async () => {
    const roles = (
      await http(app).get('/api/v1/org/roles').set(bearer(admin)).expect(200)
    ).body.items;
    const assignable = Object.fromEntries(
      roles.map((r: { key: string; assignable: boolean }) => [
        r.key,
        r.assignable,
      ]),
    );
    expect(assignable).toEqual({ owner: false, admin: true, member: true });
  });

  it('an admin cannot touch the owner; nobody changes their own role', async () => {
    const items = await list(owner);
    const ownerRow = items.find((i) => i.role.key === 'owner');
    const ownRes = await http(app)
      .patch(`/api/v1/org/members/${ownerRow?.id}`)
      .set(bearer(admin))
      .send({ role: 'member' })
      .expect(403);
    expect(ownRes.body.code).toBe('role_too_powerful');
    const self = await http(app)
      .patch(`/api/v1/org/members/${ownerRow?.id}`)
      .set(bearer(owner))
      .send({ role: 'member' })
      .expect(403);
    expect(self.body.code).toBe('own_role');
  });

  it('a member cannot manage people', async () => {
    const items = await list(owner);
    const adminRow = items.find((i) => i.role.key === 'admin');
    await http(app)
      .patch(`/api/v1/org/members/${adminRow?.id}`)
      .set(bearer(member))
      .send({ role: 'member' })
      .expect(403);
    await http(app)
      .delete(`/api/v1/org/members/${adminRow?.id}`)
      .set(bearer(member))
      .expect(403);
  });

  it('changes a role and records it', async () => {
    const memberRow = (await list(owner)).find((i) => i.role.key === 'member');
    await http(app)
      .patch(`/api/v1/org/members/${memberRow?.id}`)
      .set(bearer(admin))
      .send({ role: 'admin' })
      .expect(204);
    expect(
      (await list(owner)).find((i) => i.id === memberRow?.id)?.role.key,
    ).toBe('admin');
    await http(app)
      .patch(`/api/v1/org/members/${memberRow?.id}`)
      .set(bearer(admin))
      .send({ role: 'member' })
      .expect(204);
  });

  it('removing someone ends their sessions for the organization', async () => {
    const memberRow = (await list(owner)).find((i) => i.email === mail('mem'));
    await http(app)
      .delete(`/api/v1/org/members/${memberRow?.id}`)
      .set(bearer(admin))
      .expect(204);
    expect((await list(owner)).map((i) => i.email)).not.toContain(mail('mem'));
    await http(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', memberCookie)
      .set('X-Requested-With', 'x')
      .expect(401);
    await http(app)
      .delete(`/api/v1/org/members/${randomUUID()}`)
      .set(bearer(admin))
      .expect(404);
  });
});
