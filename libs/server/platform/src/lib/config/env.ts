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

  API_PORT: z.coerce.number().int().positive().default(4000),
  API_PUBLIC_URL: url.default('http://127.0.0.1:4000'),
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
