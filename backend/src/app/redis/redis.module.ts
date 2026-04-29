/**
 * Project: Seven
 * File: redis.module.ts
 * Description: Redis module for caching and session management
 * Created: 2025-11-06
 */

import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD') || undefined,
        db: parseInt(configService.get('REDIS_DB') || '0'),
        ttl: parseInt(configService.get('REDIS_TTL') || '3600'),
        max: 100, // максимальное количество ключей в кэше
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, CacheModule],
})
export class RedisModule {}
