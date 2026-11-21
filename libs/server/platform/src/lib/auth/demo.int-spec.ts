/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { cleanupTestRun, createTestApp, http } from '../../../test/test-app';

describe('public demo mode (HTTP)', () => {
  let app: INestApplication;
  const run = randomUUID().slice(0, 8);
  const email = `demo-${run}@test.seven`;
  const password = 'the demo password';
  let token: string;

  beforeAll(async () => {
    // Created before demo mode is on: the hourly reset script makes the demo account the same way.
    const plain = await createTestApp();
    const res = await http(plain)
      .post('/api/v1/auth/signup')
      .send({ email, password, name: 'Demo', organizationName: 'Demo Co' })
      .expect(201);
    token = res.body.accessToken;
    await plain.close();

    process.env['DEMO_MODE'] = 'true';
    process.env['DEMO_EMAIL'] = email;
    process.env['DEMO_PASSWORD'] = password;
    app = await createTestApp();
  });

  afterAll(async () => {
    delete process.env['DEMO_MODE'];
    delete process.env['DEMO_EMAIL'];
    delete process.env['DEMO_PASSWORD'];
    await cleanupTestRun(app, run);
    await app.close();
  });

  it('publishes the shared account', async () => {
    const res = await http(app).get('/api/v1/auth/demo').expect(200);
    expect(res.body).toEqual({ enabled: true, email, password });
  });

  it('lets visitors sign in and read', async () => {
    const res = await http(app)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    await http(app)
      .get('/api/v1/org/members')
      .set({ Authorization: `Bearer ${res.body.accessToken}` })
      .expect(200);
  });

  it.each([
    [
      'post',
      '/api/v1/auth/signup',
      {
        email: `x-${run}@test.seven`,
        password: 'a long password 1',
        name: 'X',
        organizationName: 'X',
      },
    ],
    ['post', '/api/v1/auth/password/forgot', { email }],
    [
      'post',
      '/api/v1/auth/password/reset',
      { token: 'x', password: 'a long password 1' },
    ],
    [
      'post',
      '/api/v1/org/invitations',
      { email: `y-${run}@test.seven`, role: 'member' },
    ],
    ['post', '/api/v1/auth/verify-email/request', {}],
  ] as const)('locks %s %s', async (method, url, body) => {
    const res = await http(app)
      [method](url)
      .set({ Authorization: `Bearer ${token}` })
      .send(body)
      .expect(403);
    expect(res.body.code).toBe('demo_locked');
  });

  it('is off by default', async () => {
    delete process.env['DEMO_MODE'];
    const plain = await createTestApp();
    const res = await http(plain).get('/api/v1/auth/demo').expect(200);
    expect(res.body).toEqual({ enabled: false });
    await plain.close();
    process.env['DEMO_MODE'] = 'true';
  });
});
