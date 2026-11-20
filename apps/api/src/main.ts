/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: `${process.cwd()}/.env`, quiet: true }); // dev only; production sets real env vars

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ENV, type Env } from '@seven/server-platform';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  const env = app.get<Env>(ENV);
  await app.listen(env.API_PORT, '127.0.0.1');

  // Lets `nx serve` know the server is ready.
  if (process.env['NX_READY_SIGNAL_SOCKET']) {
    try {
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      // @nx/js isn't installed
    }
  }
  app
    .get(Logger)
    .log(`API listening on http://127.0.0.1:${env.API_PORT}/api/v1`);
}

bootstrap();
