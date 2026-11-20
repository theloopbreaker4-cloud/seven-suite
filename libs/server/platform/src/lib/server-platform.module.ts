/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PlatformConfigModule } from './config/config.module';
import { PrismaService } from './db/prisma.service';
import { ErrorFilter } from './errors/error.filter';
import { HealthController } from './health/health.controller';
import { PlatformLoggingModule } from './logging/logging.module';
import { RedisService } from './redis/redis.service';

/**
 * Kernel shared by the API and the worker: config, logging, database, Redis, identity,
 * the deny-by-default auth guard, the `{ error, code, fields }` error format, health probes.
 */
@Global()
@Module({
  imports: [PlatformConfigModule, PlatformLoggingModule, AuthModule],
  controllers: [HealthController],
  providers: [
    PrismaService,
    RedisService,
    { provide: APP_FILTER, useClass: ErrorFilter },
  ],
  exports: [
    PlatformConfigModule,
    PlatformLoggingModule,
    PrismaService,
    RedisService,
    AuthModule,
  ],
})
export class ServerPlatformModule {}
