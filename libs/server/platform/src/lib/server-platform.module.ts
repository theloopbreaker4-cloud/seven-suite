/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Global, Module } from '@nestjs/common';
import { PlatformConfigModule } from './config/config.module';
import { PrismaService } from './db/prisma.service';
import { HealthController } from './health/health.controller';
import { PlatformLoggingModule } from './logging/logging.module';
import { RedisService } from './redis/redis.service';

/** Kernel shared by the API and the worker: config, logging, database, Redis, health probes. */
@Global()
@Module({
  imports: [PlatformConfigModule, PlatformLoggingModule],
  controllers: [HealthController],
  providers: [PrismaService, RedisService],
  exports: [
    PlatformConfigModule,
    PlatformLoggingModule,
    PrismaService,
    RedisService,
  ],
})
export class ServerPlatformModule {}
