/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { cleanupTestRun, createTestApp, http } from '../../../test/test-app';
import { normalizeHost } from '../org/domain.service';

describe('storefront site resolution and domains (HTTP)', () => {
  let app: INestApplication;
  const run = randomUUID().slice(0, 8);
  const mail = (n: string) => `${n}-${run}@test.seven`;
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  const serviceKey = 'k'.repeat(32);
  const domain = `shop-${run}.example.ge`;
  let owner: string;
  let other: string;
  let slug: string;

  const site = (host: string, key: string | null = serviceKey) => {
    const r = http(app).get('/api/v1/web/site').query({ host });
    return key === null ? r : r.set('X-Service-Key', key);
  };
  const signup = async (who: string, org: string) =>
    (
      await http(app)
        .post('/api/v1/auth/signup')
        .send({
          email: mail(who),
          password: 'a long password 1',
          name: who,
          organizationName: org,
        })
        .expect(201)
    ).body.accessToken as string;

  beforeAll(async () => {
    process.env['WEB_SERVICE_KEY'] = serviceKey;
    process.env['WEB_BASE_DOMAIN'] = 'shops.test';
    app = await createTestApp();
    owner = await signup('own', `Web Co ${run}`);
    other = await signup('oth', `Other Co ${run}`);
    slug = (
      await http(app).get('/api/v1/auth/me').set(bearer(owner)).expect(200)
    ).body.organization.slug;
  });
  afterAll(async () => {
    delete process.env['WEB_BASE_DOMAIN'];
    await cleanupTestRun(app, run);
    await app.close();
  });

  it('normalizes hosts', () => {
    expect(normalizeHost('HTTPS://Shop.Example.GE:443/path?x=1')).toBe(
      'shop.example.ge',
    );
    expect(normalizeHost('shop.example.ge.')).toBe('shop.example.ge');
    expect(normalizeHost('localhost')).toBeNull();
    expect(normalizeHost('bad_host.ge')).toBeNull();
  });

  it('needs the service key — not a user token, not nothing', async () => {
    expect((await site(`${slug}.shops.test`, null).expect(401)).body.code).toBe(
      'service_key_required',
    );
    await site(`${slug}.shops.test`, 'x'.repeat(32)).expect(401);
    await http(app)
      .get('/api/v1/web/site')
      .query({ host: `${slug}.shops.test` })
      .set(bearer(owner))
      .expect(401);
  });

  it('resolves the free <slug>.<base domain> address', async () => {
    const res = await site(`${slug}.shops.test`).expect(200);
    expect(res.body).toMatchObject({
      slug,
      name: `Web Co ${run}`,
      locale: 'ka',
      baseCurrency: 'GEL',
    });
    expect(res.body).not.toHaveProperty('modulesEnabled');
    await site(`nope-${run}.shops.test`).expect(404);
    await site('unknown.example.org').expect(404);
  });

  it('manages custom domains: normalized, unique across organizations, cache cleared', async () => {
    await site(domain).expect(404); // cached as unknown…
    const added = await http(app)
      .post('/api/v1/org/domains')
      .set(bearer(owner))
      .send({ domain: `https://${domain.toUpperCase()}/` })
      .expect(201);
    expect(added.body.items.map((d: { domain: string }) => d.domain)).toEqual([
      domain,
    ]);
    expect(added.body.defaultDomain).toBe(`${slug}.shops.test`);
    expect((await site(domain).expect(200)).body.slug).toBe(slug); // …and the add cleared it

    const taken = await http(app)
      .post('/api/v1/org/domains')
      .set(bearer(other))
      .send({ domain })
      .expect(409);
    expect(taken.body.code).toBe('domain_taken');
    await http(app)
      .post('/api/v1/org/domains')
      .set(bearer(owner))
      .send({ domain: 'not a host' })
      .expect(422);
    await http(app)
      .post('/api/v1/org/domains')
      .set(bearer(owner))
      .send({ domain: `x.shops.test` })
      .expect(422);
    // Another organization can't remove (it doesn't see) it.
    await http(app)
      .delete(`/api/v1/org/domains/${domain}`)
      .set(bearer(other))
      .expect(404);

    await http(app)
      .delete(`/api/v1/org/domains/${domain}`)
      .set(bearer(owner))
      .expect(200);
    await site(domain).expect(404);
  });
});
