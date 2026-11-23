/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import {
  cleanupTestRun,
  createTestApp,
  http,
  tokenFromMail,
} from '../../../test/test-app';
import { RequireModule } from '../auth/decorators';
import { ModuleRegistry } from './module-registry';

@Controller('test-crm')
class TestCrmController {
  @RequireModule('crm_t')
  @Get()
  ping() {
    return { ok: true };
  }
}

describe('module manifests (HTTP)', () => {
  let app: INestApplication;
  const run = randomUUID().slice(0, 8);
  const mail = (n: string) => `${n}-${run}@test.seven`;
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  let owner: string;
  let member: string;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [TestCrmController] });
    const registry = app.get(ModuleRegistry);
    registry.register({
      id: 'crm_t',
      name: 'CRM (test)',
      description: 'test',
      requires: ['core'],
      permissions: ['crm_t:deal:read'],
    });
    registry.register({
      id: 'billing_t',
      name: 'Billing (test)',
      description: 'test',
      requires: ['crm_t'],
      permissions: [],
    });
    owner = (
      await http(app)
        .post('/api/v1/auth/signup')
        .send({
          email: mail('own'),
          password: 'a long password 1',
          name: 'Own',
          organizationName: 'Modules Co',
        })
        .expect(201)
    ).body.accessToken;
    await http(app)
      .post('/api/v1/org/invitations')
      .set(bearer(owner))
      .send({ email: mail('mem'), role: 'member' })
      .expect(201);
    member = (
      await http(app)
        .post('/api/v1/auth/invitations/accept')
        .send({
          token: tokenFromMail(app, mail('mem')),
          name: 'Mem',
          password: 'a long password 1',
        })
        .expect(200)
    ).body.accessToken;
  });

  afterAll(async () => {
    const registry = app.get(ModuleRegistry);
    registry.unregister('billing_t');
    registry.unregister('crm_t');
    await cleanupTestRun(app, run);
    await app.close();
  });

  const list = async (t = owner) =>
    (await http(app).get('/api/v1/org/modules').set(bearer(t)).expect(200)).body
      .items as { id: string; enabled: boolean; requiredBy: string[] }[];
  const toggle = (id: string, enabled: boolean, t = owner) =>
    http(app).put(`/api/v1/org/modules/${id}`).set(bearer(t)).send({ enabled });

  it('lists core as always on and new modules as off', async () => {
    const items = await list(member); // any member may read
    expect(items.find((m) => m.id === 'core')).toMatchObject({
      enabled: true,
      alwaysOn: true,
    });
    expect(items.find((m) => m.id === 'crm_t')).toMatchObject({
      enabled: false,
    });
  });

  it('guards module routes until the module is enabled', async () => {
    const off = await http(app)
      .get('/api/v1/test-crm')
      .set(bearer(owner))
      .expect(403);
    expect(off.body.code).toBe('module_disabled');
    await toggle('crm_t', true).expect(200);
    await http(app).get('/api/v1/test-crm').set(bearer(owner)).expect(200);
  });

  it('enforces dependencies in both directions', async () => {
    await toggle('crm_t', false).expect(200);
    const needs = await toggle('billing_t', true).expect(409);
    expect(needs.body.code).toBe('module_requires');
    await toggle('crm_t', true).expect(200);
    await toggle('billing_t', true).expect(200);
    const blocked = await toggle('crm_t', false).expect(409);
    expect(blocked.body.code).toBe('module_required_by');
    expect((await list()).find((m) => m.id === 'crm_t')?.requiredBy).toEqual([
      'billing_t',
    ]);
  });

  it('never switches core off and needs the settings permission', async () => {
    expect((await toggle('core', false).expect(409)).body.code).toBe(
      'module_always_on',
    );
    await toggle('billing_t', false, member).expect(403);
    await toggle('nope', true).expect(404);
  });
});
