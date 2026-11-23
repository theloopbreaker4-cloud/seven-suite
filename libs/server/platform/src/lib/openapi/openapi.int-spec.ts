/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { createTestApp, http } from '../../../test/test-app';

/** The OpenAPI document is generated from the live routes and their zod schemas. */
describe('OpenAPI', () => {
  let app: INestApplication;
  let doc: {
    openapi: string;
    paths: Record<string, Record<string, Record<string, unknown>>>;
    components: { securitySchemes: Record<string, unknown> };
  };

  beforeAll(async () => {
    app = await createTestApp();
    doc = (await http(app).get('/api/v1/openapi.json').expect(200)).body;
  });
  afterAll(() => app.close());

  it('is public OpenAPI 3.1 with both auth schemes', () => {
    expect(doc.openapi).toBe('3.1.0');
    expect(Object.keys(doc.components.securitySchemes).sort()).toEqual([
      'apiKey',
      'bearer',
    ]);
  });

  it('lists every route with its method and path parameters', () => {
    expect(doc.paths['/auth/login']?.['post']).toBeDefined();
    expect(doc.paths['/org/members/{id}']?.['patch']?.['parameters']).toEqual([
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    ]);
    expect(
      doc.paths['/api-keys/{id}']?.['delete']?.['responses'],
    ).toHaveProperty('204');
  });

  it('takes request bodies from the same zod schemas that validate them', () => {
    const body = doc.paths['/auth/login']['post']['requestBody'] as {
      content: {
        'application/json': {
          schema: { properties: Record<string, unknown>; required: string[] };
        };
      };
    };
    const schema = body.content['application/json'].schema;
    expect(Object.keys(schema.properties)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
    expect(schema.required).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('documents who may call what', () => {
    expect(doc.paths['/auth/login']['post']['security']).toEqual([]);
    expect(doc.paths['/org/roles']['post']['x-permission']).toBe(
      'platform:role:create',
    );
    expect(doc.paths['/api-keys']['post']['security']).toEqual([
      { bearer: [] },
    ]); // people only
    expect(doc.paths['/org/members']['get']['security']).toEqual([
      { bearer: [] },
      { apiKey: [] },
    ]);
    expect(
      String(doc.paths['/auth/2fa/setup']['post']['description']),
    ).toContain('demo_locked');
  });

  it('matches the committed libs/api-client/openapi.json (run `nx run api-client:generate` after API changes)', () => {
    const committed = JSON.parse(
      readFileSync(
        join(__dirname, '../../../../../api-client/openapi.json'),
        'utf8',
      ),
    ) as typeof doc;
    const shape = (d: typeof doc) =>
      Object.fromEntries(
        Object.entries(d.paths).map(([p, ops]) => [
          p,
          Object.fromEntries(
            Object.entries(ops).map(([m, op]) => [m, JSON.stringify(op)]),
          ),
        ]),
      );
    expect(shape(doc)).toEqual(shape(committed));
  });
});
