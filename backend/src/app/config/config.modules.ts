/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: config.modules.ts
 * Description: Application configuration module that provides centralized configuration service using environment variables
 * Created: 2025-10-26
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';

/**
 * Module that configures and exports the application configuration service
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}