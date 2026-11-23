/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  Controller,
  Get,
  Header,
  Injectable,
  RequestMethod,
} from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { z, type ZodType } from 'zod';
import {
  DEMO_LOCKED,
  IS_PUBLIC,
  Public,
  REQUIRED_PERMISSION,
  USER_ONLY,
} from '../auth/decorators';
import { ZodPipe } from '../validation/zod.pipe';

// Nest's own metadata keys (stable public constants of @nestjs/common).
const PATH = 'path';
const METHOD = 'method';
const ROUTE_ARGS = '__routeArguments__';
const HTTP_CODE = '__httpCode__';
const BODY = 3;
const QUERY = 4;

type Json = Record<string, unknown>;

const errorSchema = {
  type: 'object',
  required: ['error', 'code'],
  properties: {
    error: { type: 'string', description: 'Human-readable message (English)' },
    code: {
      type: 'string',
      description: 'Stable machine code, e.g. `validation_failed`, `forbidden`',
    },
    fields: {
      type: 'object',
      additionalProperties: { type: 'string' },
      description: 'Per-field messages (422)',
    },
  },
};

function jsonSchema(schema: ZodType): Json {
  try {
    const out = z.toJSONSchema(schema, {
      unrepresentable: 'any',
      io: 'input',
    }) as Json;
    delete out['$schema'];
    return out;
  } catch {
    return { type: 'object' };
  }
}

function zodOf(
  args: Record<string, { pipes?: unknown[] }> | undefined,
  type: number,
): ZodType | undefined {
  if (!args) return undefined;
  for (const [key, arg] of Object.entries(args)) {
    if (Number(key.split(':')[0]) !== type) continue;
    const pipe = arg.pipes?.find(
      (p): p is ZodPipe<unknown> => p instanceof ZodPipe,
    );
    if (pipe) return pipe.schema as ZodType;
  }
  return undefined;
}

const joinPath = (...parts: (string | undefined)[]) =>
  '/' +
  parts
    .flatMap((p) => (p ?? '').split('/'))
    .filter(Boolean)
    .join('/');

/**
 * Builds the OpenAPI 3.1 document from the running application itself: every controller route,
 * its HTTP method, path parameters, request body schema (from the ZodPipe on @Body — the same
 * schema that validates it), who may call it (public / signed in / permission / people only)
 * and the shared error format. Nothing to keep in sync by hand.
 */
@Injectable()
export class OpenApiBuilder {
  private cached?: Json;

  constructor(private readonly modules: ModulesContainer) {}

  build(version = '0.0.0'): Json {
    if (this.cached) return this.cached;
    const paths: Record<string, Record<string, Json>> = {};

    for (const mod of this.modules.values()) {
      for (const wrapper of mod.controllers.values()) {
        const ctrl = wrapper.metatype as
          (new (...a: unknown[]) => unknown) | undefined;
        if (!ctrl?.prototype) continue;
        const base = Reflect.getMetadata(PATH, ctrl) as string | undefined;
        const tag = ctrl.name.replace(/Controller$/, '');
        for (const name of Object.getOwnPropertyNames(ctrl.prototype)) {
          if (name === 'constructor') continue;
          const handler = (ctrl.prototype as Record<string, unknown>)[name];
          if (typeof handler !== 'function') continue;
          const method = Reflect.getMetadata(METHOD, handler) as
            RequestMethod | undefined;
          const sub = Reflect.getMetadata(PATH, handler) as string | undefined;
          if (method === undefined || sub === undefined) continue;

          const meta = <T>(key: string): T | undefined =>
            (Reflect.getMetadata(key, handler) as T | undefined) ??
            (Reflect.getMetadata(key, ctrl) as T | undefined);
          const isPublic = meta<boolean>(IS_PUBLIC) === true;
          const permission = meta<string>(REQUIRED_PERMISSION);
          const userOnly = meta<boolean>(USER_ONLY) === true;
          const demoLocked = meta<boolean>(DEMO_LOCKED) === true;
          const status =
            (Reflect.getMetadata(HTTP_CODE, handler) as number | undefined) ??
            (method === RequestMethod.POST ? 201 : 200);

          const rawPath = joinPath(base, sub);
          const oaPath = rawPath.replace(/:(\w+)/g, '{$1}');
          const verb = RequestMethod[method].toLowerCase();
          const args = Reflect.getMetadata(ROUTE_ARGS, ctrl, name) as
            Record<string, { pipes?: unknown[] }> | undefined;
          const body = zodOf(args, BODY);
          const query = zodOf(args, QUERY);

          const notes: string[] = [];
          if (permission) notes.push(`Requires permission \`${permission}\`.`);
          if (userOnly && !isPublic)
            notes.push('People only — not available with an API key.');
          if (demoLocked)
            notes.push('Disabled on the public demo (`403 demo_locked`).');

          const parameters: Json[] = [...rawPath.matchAll(/:(\w+)/g)].map(
            (m) => ({
              name: m[1],
              in: 'path',
              required: true,
              schema: { type: 'string' },
            }),
          );
          if (query) {
            const qs = jsonSchema(query) as {
              properties?: Record<string, Json>;
              required?: string[];
            };
            for (const [qName, qSchema] of Object.entries(qs.properties ?? {}))
              parameters.push({
                name: qName,
                in: 'query',
                required: qs.required?.includes(qName) ?? false,
                schema: qSchema,
              });
          }

          const responses: Json = {
            [status]:
              status === 204
                ? { description: 'Done' }
                : {
                    description: 'OK',
                    content: {
                      'application/json': { schema: { type: 'object' } },
                    },
                  },
            default: {
              description: 'Error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          };
          if (body)
            responses['422'] = {
              description: 'Validation failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            };

          (paths[oaPath] ??= {})[verb] = {
            operationId: `${tag}_${name}`,
            tags: [tag],
            ...(notes.length ? { description: notes.join(' ') } : {}),
            ...(parameters.length ? { parameters } : {}),
            ...(body
              ? {
                  requestBody: {
                    required: true,
                    content: {
                      'application/json': { schema: jsonSchema(body) },
                    },
                  },
                }
              : {}),
            responses,
            security: isPublic
              ? []
              : userOnly
                ? [{ bearer: [] }]
                : [{ bearer: [] }, { apiKey: [] }],
            ...(permission ? { 'x-permission': permission } : {}),
          };
        }
      }
    }

    this.cached = {
      openapi: '3.1.0',
      info: {
        title: 'Seven Suite API',
        version,
        description:
          'All-in-one business platform API. Authenticate with a session access token (`Authorization: Bearer <jwt>`) ' +
          'or an organization API key (`X-Api-Key: sv_…`). Errors always look like `{ error, code, fields? }`.',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKey: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
        },
        schemas: { Error: errorSchema },
      },
      paths: Object.fromEntries(
        Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)),
      ),
    };
    return this.cached;
  }
}

/** The API description, public (it documents routes, not data). */
@Controller()
export class OpenApiController {
  constructor(private readonly builder: OpenApiBuilder) {}

  @Public()
  @Get('openapi.json')
  @Header('Cache-Control', 'public, max-age=300')
  spec() {
    return this.builder.build(
      process.env['npm_package_version'] ??
        process.env['APP_VERSION'] ??
        '0.3.0',
    );
  }
}
