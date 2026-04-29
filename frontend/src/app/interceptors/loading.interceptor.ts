/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: loading.interceptor.ts
 * Description: HTTP interceptor for managing loading state
 * Created: 2025-10-26
 */

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/**
 * LoadingService - manages global loading state
 * @remarks This is a simple service that can be expanded with BehaviorSubject
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = 0;
  private _isLoading = false;

  get isLoading(): boolean {
    return this._isLoading;
  }

  startLoading(): void {
    this.loadingCount++;
    this._isLoading = true;
  }

  stopLoading(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this._isLoading = false;
    }
  }
}

/**
 * LoadingInterceptor - shows/hides loading indicator during HTTP requests
 * @remarks Automatically manages loading state for all HTTP requests
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Start loading
    this.loadingService.startLoading();

    return next.handle(request).pipe(
      finalize(() => {
        // Stop loading when request completes (success or error)
        this.loadingService.stopLoading();
      })
    );
  }
}
