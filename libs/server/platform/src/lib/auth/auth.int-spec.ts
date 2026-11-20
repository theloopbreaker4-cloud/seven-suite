/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../configure-app';
import { PrismaService } from '../db/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ServerPlatformModule } from '../server-platform.module';

/**
 * The whole auth flow over HTTP against real PostgreSQL and Redis, wired exactly like the
 * API (configureApp + ServerPlatformModule).
 */
describe('auth (HTTP)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const run = randomUUID().slice(0, 8);
  const email = `owner-${run}@test.seven`;
  const password = 'correct horse battery';

  const cookieOf = (res: request.Response): string | undefined => {
    const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
    return raw?.find((c) => c.startsWith('seven_rt='));
  };
  const tokenOf = (cookie: string | undefined) => {
    if (!cookie) throw new Error('expected a seven_rt cookie');
    return cookie.split(';')[0];
  };

  beforeAll(async () => {
    const testUrl = process.env['DATABASE_TEST_URL'];
    if (!testUrl) throw new Error('DATABASE_TEST_URL is not set');
    process.env['DATABASE_URL'] = testUrl;
    process.env['DATABASE_APP_URL'] = testUrl;
    process.env['JWT_SECRET'] ??= 'test-secret-'.repeat(5);
    process.env['WEB_SERVICE_KEY'] ??= 'k'.repeat(32);
    process.env['LOG_LEVEL'] = 'fatal';
    process.env['NODE_ENV'] = 'test';

    const moduleRef = await Test.createTestingModule({
      imports: [ServerPlatformModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    const db = app.get(PrismaService).system;
    const users = await db.user.findMany({
      where: { email: { endsWith: `-${run}@test.seven` } },
    });
    const memberships = await db.membership.findMany({
      where: { userId: { in: users.map((u) => u.id) } },
    });
    await db.organization.deleteMany({
      where: { id: { in: memberships.map((m) => m.orgId) } },
    });
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    const redis = app.get(RedisService).client;
    const keys = await redis.keys('rl:login:*');
    if (keys.length) await redis.del(...keys);
    await app.close();
  });

  it('health stays public', async () => {
    await http.get('/api/v1/health/live').expect(200);
  });

  let accessToken: string;
  let refreshCookie: string;

  it('signs up a user with a new organization', async () => {
    const res = await http
      .post('/api/v1/auth/signup')
      .send({
        email: email.toUpperCase(),
        password,
        name: 'Owner',
        organizationName: 'Тест ООО Seven',
      })
      .expect(201);
    expect(res.body.role).toBe('owner');
    expect(res.body.permissions).toEqual(['*']);
    accessToken = res.body.accessToken;
    const cookie = cookieOf(res) ?? '';
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    refreshCookie = tokenOf(cookie);
    expect(JSON.stringify(res.body)).not.toContain(refreshCookie.split('=')[1]);
  });

  it('refuses a second account with the same email', async () => {
    const res = await http
      .post('/api/v1/auth/signup')
      .send({ email, password, name: 'X', organizationName: 'X' })
      .expect(409);
    expect(res.body).toEqual({
      error: expect.any(String),
      code: 'email_taken',
    });
  });

  it('validates input with per-field messages', async () => {
    const res = await http
      .post('/api/v1/auth/signup')
      .send({
        email: 'nope',
        password: 'short',
        name: '',
        organizationName: 'A',
      })
      .expect(422);
    expect(res.body.code).toBe('validation_failed');
    expect(Object.keys(res.body.fields).sort()).toEqual([
      'email',
      'name',
      'password',
    ]);
  });

  it('protects routes by default', async () => {
    const res = await http.get('/api/v1/auth/me').expect(401);
    expect(res.body).toEqual({
      error: 'Authentication required',
      code: 'unauthorized',
    });
    await http
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer garbage')
      .expect(401);
  });

  it('returns the current user and organization', async () => {
    const res = await http
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.organization.name).toBe('Тест ООО Seven');
    expect(res.body.organizations).toHaveLength(1);
  });

  it('rejects a wrong password without saying which part was wrong', async () => {
    const wrong = await http
      .post('/api/v1/auth/login')
      .send({ email, password: 'not it at all' })
      .expect(401);
    const unknown = await http
      .post('/api/v1/auth/login')
      .send({ email: `ghost-${run}@test.seven`, password })
      .expect(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('logs in', async () => {
    const res = await http
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(cookieOf(res)).toBeTruthy();
  });

  it('refresh requires X-Requested-With (CSRF)', async () => {
    const res = await http
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(403);
    expect(res.body.code).toBe('csrf_check_failed');
  });

  it('rotates the refresh token, and a reused one revokes the whole family', async () => {
    const first = await http
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .set('X-Requested-With', 'fetch')
      .expect(200);
    const rotated = tokenOf(cookieOf(first));
    expect(rotated).not.toBe(refreshCookie);

    // The old token again: someone copied it.
    const replay = await http
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .set('X-Requested-With', 'fetch')
      .expect(401);
    expect(replay.body.code).toBe('session_reused');

    // …and the legitimate newest token from that login is dead too.
    await http
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotated)
      .set('X-Requested-With', 'fetch')
      .expect(401);
  });

  it('logout revokes the session', async () => {
    const login = await http
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = tokenOf(cookieOf(login));
    await http
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'fetch')
      .expect(204);
    await http
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'fetch')
      .expect(401);
  });

  it('rate-limits repeated failed logins', async () => {
    const target = `limit-${run}@test.seven`;
    for (let i = 0; i < 5; i++) {
      await http
        .post('/api/v1/auth/login')
        .send({ email: target, password: 'wrong password' })
        .expect(401);
    }
    const res = await http
      .post('/api/v1/auth/login')
      .send({ email: target, password: 'wrong password' })
      .expect(429);
    expect(res.body.code).toBe('rate_limited');
  });
});
