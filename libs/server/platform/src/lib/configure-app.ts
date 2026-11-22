/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { requestContextMiddleware } from './context/request-context';

/**
 * HTTP setup shared by main.ts and integration tests, so tests exercise exactly what runs
 * in production.
 */
export function configureApp(app: INestApplication): void {
  const express = app as NestExpressApplication;
  // nginx on the same host is the only proxy; trust it for req.ip / protocol, nobody else.
  express.set('trust proxy', 'loopback');
  express.disable('x-powered-by');
  // First: every later step (logs, guards, services, audit, outbox) sees the same request id.
  app.use(requestContextMiddleware);
  // JSON only, never rendered as a page: lock everything down. Responses carry session data,
  // so nothing may be cached on the way.
  app.use(
    (
      _req: unknown,
      res: { setHeader(k: string, v: string): void },
      next: () => void,
    ) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'",
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      res.setHeader('Cache-Control', 'no-store');
      next();
    },
  );
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
}
