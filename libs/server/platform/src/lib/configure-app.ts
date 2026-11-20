/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

/**
 * HTTP setup shared by main.ts and integration tests, so tests exercise exactly what runs
 * in production.
 */
export function configureApp(app: INestApplication): void {
  const express = app as NestExpressApplication;
  // nginx on the same host is the only proxy; trust it for req.ip / protocol, nobody else.
  express.set('trust proxy', 'loopback');
  express.disable('x-powered-by');
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
}
