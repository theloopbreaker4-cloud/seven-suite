/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: logging.interceptor.ts
 * Description: Interceptor that logs request execution time and provides before/after request logging
 * Created: 2025-10-26
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req    = context.switchToHttp().getRequest();
    const method = req?.method ?? 'WS';
    const url    = req?.url ?? context.getClass().name;
    const start  = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${method} ${url} +${Date.now() - start}ms`, 'HTTP');
        },
        error: (err) => {
          this.logger.error(`${method} ${url} failed: ${err.message}`, err.stack, 'HTTP');
        },
      }),
    );
  }
}
