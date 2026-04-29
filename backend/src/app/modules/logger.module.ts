/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: logger.module.ts
 * Description: Global logger module - exposes AppLoggerService application-wide
 * Created: 2026-04-24
 */

import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from '../services/logger.service';

@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
