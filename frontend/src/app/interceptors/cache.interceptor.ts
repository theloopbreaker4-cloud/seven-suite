/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: cache.interceptor.ts
 * Description: HTTP interceptor for caching GET requests
 * Created: 2025-10-26
 */

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * CacheInterceptor - caches GET requests to reduce server load
 * @remarks Only caches GET requests for specified duration
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, { response: HttpResponse<any>; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    // Skip caching for certain endpoints
    const noCacheUrls = ['/auth/', '/user/profile'];
    if (noCacheUrls.some(url => request.url.includes(url))) {
      return next.handle(request);
    }

    // Check if cached response exists and is still valid
    const cachedResponse = this.cache.get(request.url);
    if (cachedResponse) {
      const age = Date.now() - cachedResponse.timestamp;
      if (age < this.CACHE_DURATION) {
        return of(cachedResponse.response.clone());
      }
      this.cache.delete(request.url);
    }

    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(request.url, {
            response: event.clone(),
            timestamp: Date.now(),
          });
        }
      }),
    );
  }

  clearCache(): void { this.cache.clear(); }
  clearCacheForUrl(url: string): void { this.cache.delete(url); }
}
