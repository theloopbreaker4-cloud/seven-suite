/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

/**
 * Structured JSON logs (pretty in development). Every request gets an id — taken from a
 * trusted upstream `x-request-id` or generated — that appears on each log line of that request.
 * Credentials never reach the logs.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          genReqId: (req: IncomingMessage) => {
            const header = req.headers['x-request-id'];
            return typeof header === 'string' && /^[\w-]{8,64}$/.test(header)
              ? header
              : randomUUID();
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-api-key"]',
              'req.headers["x-service-key"]',
              'res.headers["set-cookie"]',
            ],
            censor: '[redacted]',
          },
          autoLogging: {
            ignore: (req: IncomingMessage) =>
              (req.url ?? '').includes('/health/'),
          },
          transport:
            env.NODE_ENV === 'development'
              ? {
                  target: 'pino-pretty',
                  options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
                }
              : undefined,
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class PlatformLoggingModule {}
