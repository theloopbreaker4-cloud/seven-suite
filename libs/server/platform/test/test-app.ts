/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/lib/configure-app';
import { PrismaService } from '../src/lib/db/prisma.service';
import { MailService } from '../src/lib/mail/mail.service';
import { RedisService } from '../src/lib/redis/redis.service';
import { ServerPlatformModule } from '../src/lib/server-platform.module';

/** The API exactly as main.ts wires it, on the test database, with mail captured in memory. */
export async function createTestApp(): Promise<INestApplication> {
  const testUrl = process.env['DATABASE_TEST_URL'];
  if (!testUrl) throw new Error('DATABASE_TEST_URL is not set');
  const appUrl = process.env['DATABASE_APP_URL'];
  if (!appUrl) throw new Error('DATABASE_APP_URL is not set');
  // Same credentials as the application role, pointed at the test database: RLS applies.
  const tenantUrl = new URL(appUrl);
  tenantUrl.pathname = new URL(testUrl).pathname;
  process.env['DATABASE_URL'] = testUrl;
  process.env['DATABASE_APP_URL'] = tenantUrl.toString();
  process.env['JWT_SECRET'] ??= 'test-secret-'.repeat(5);
  process.env['WEB_SERVICE_KEY'] ??= 'k'.repeat(32);
  process.env['LOG_LEVEL'] = 'fatal';
  process.env['NODE_ENV'] = 'test';

  const moduleRef = await Test.createTestingModule({
    imports: [ServerPlatformModule],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return app;
}

/** Delete everything created for test users whose email ends with `-${run}@test.seven`. */
export async function cleanupTestRun(
  app: INestApplication,
  run: string,
): Promise<void> {
  const db = app.get(PrismaService).system;
  const users = await db.user.findMany({
    where: { email: { endsWith: `-${run}@test.seven` } },
  });
  const ids = users.map((u) => u.id);
  const memberships = await db.membership.findMany({
    where: { userId: { in: ids } },
  });
  await db.organization.deleteMany({
    where: { id: { in: memberships.map((m) => m.orgId) } },
  });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  const redis = app.get(RedisService).client;
  const keys = await redis.keys('rl:*');
  if (keys.length) await redis.del(...keys);
}

/** The token from the newest captured email to `to` (from the link's ?token=). */
export function tokenFromMail(app: INestApplication, to: string): string {
  const mail = [...app.get(MailService).sent]
    .reverse()
    .find((m) => m.to === to);
  if (!mail) throw new Error(`no email sent to ${to}`);
  const match = /[?&]token=([^\s&"<]+)/.exec(mail.text);
  if (!match) throw new Error(`no token in email "${mail.subject}"`);
  return decodeURIComponent(match[1]);
}

export const http = (app: INestApplication) => request(app.getHttpServer());

/** The `seven_rt=…` pair from a response's Set-Cookie, for sending back. */
export function refreshCookie(res: request.Response): string {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = raw?.find((c) => c.startsWith('seven_rt='));
  if (!cookie) throw new Error('expected a seven_rt cookie');
  return cookie.split(';')[0];
}
