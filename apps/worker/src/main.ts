/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: `${process.cwd()}/.env`, quiet: true }); // dev only; production sets real env vars

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

/** No HTTP server: the worker only talks to PostgreSQL and Redis. */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.get(Logger).log('Worker started: outbox dispatcher + event consumers');
}

bootstrap();
