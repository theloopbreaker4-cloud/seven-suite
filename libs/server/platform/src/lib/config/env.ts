/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { z } from 'zod';

const url = z.string().url();

/**
 * Every environment variable the server apps read. Parsed once at boot: a missing or
 * malformed value stops the process with a list of what's wrong instead of failing later.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  DATABASE_URL: url,
  DATABASE_APP_URL: url,

  REDIS_URL: url,
  /** Key prefix for BullMQ queues (tests use their own, so they never touch a running worker). */
  QUEUE_PREFIX: z.string().regex(/^[a-z0-9-]+$/).default('seven'),

  API_PORT: z.coerce.number().int().positive().default(4000),
  /** Interface to listen on: loopback by default (nginx proxies); 0.0.0.0 inside a bridged container. */
  API_HOST: z.string().default('127.0.0.1'),
  API_PUBLIC_URL: url.default('http://127.0.0.1:4000'),
  /**
   * Path prefix the app is served under behind the proxy (e.g. /suite on seven.toolpix.dev);
   * the proxy strips it, but cookies must carry it in their Path.
   */
  PUBLIC_BASE_PATH: z
    .string()
    .regex(
      /^(\/[a-z0-9-]+)*$/,
      'PUBLIC_BASE_PATH must look like /suite (or be empty)',
    )
    .default(''),
  /** Where links in emails point (verify, reset, invitation). */
  ADMIN_URL: url.default('http://127.0.0.1:4200'),
  JWT_SECRET: z.string().min(48, 'JWT_SECRET must be at least 48 characters'),
  WEB_SERVICE_KEY: z
    .string()
    .min(32, 'WEB_SERVICE_KEY must be at least 32 characters'),

  S3_ENDPOINT: url.optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET_PUBLIC: z.string().default('seven-public'),
  S3_BUCKET_PRIVATE: z.string().default('seven-private'),

  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('Seven Suite <no-reply@seven.local>'),

  /**
   * Public demo instance: routes marked @DemoLocked() (credentials, mail, membership) answer
   * 403 demo_locked, and the sign-in page shows the shared demo account.
   */
  DEMO_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  DEMO_EMAIL: z.string().default('demo@example.com'),
  DEMO_PASSWORD: z.string().default('seven-demo-2026'),

  /**
   * Operators of this installation (comma-separated emails). Only they see cross-tenant
   * internals such as queue stats and dead-letter jobs — organization owners do not.
   */
  PLATFORM_ADMINS: z
    .string()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid environment:\n  - ${issues.join('\n  - ')}`);
    this.name = 'EnvValidationError';
  }
}

/** Parse and validate; throws EnvValidationError listing every problem at once. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map(
        (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
      ),
    );
  }
  return result.data;
}
