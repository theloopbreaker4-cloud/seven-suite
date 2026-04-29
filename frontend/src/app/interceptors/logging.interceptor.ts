/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: logging.interceptor.ts
 * Description: HTTP interceptor — logs failed requests only (turn on verbose via localStorage.debugHttp = '1')
 * Created: 2025-10-26
 */

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (environment.production) return next.handle(request);

    const verbose = typeof localStorage !== 'undefined' && localStorage.getItem('debugHttp') === '1';

    return next.handle(request).pipe(
      tap({
        error: (error) => {
          console.error(`[HTTP ${request.method}] ${request.url} failed`, error);
        },
        next: (event) => {
          if (verbose) console.log(`[HTTP ${request.method}] ${request.url}`, event);
        },
      }),
    );
  }
}
