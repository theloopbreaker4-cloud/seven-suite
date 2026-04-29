/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: error.interceptor.ts
 * Description: HTTP interceptor for centralized error handling
 * Created: 2025-10-26
 */

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * ErrorInterceptor - handles HTTP errors globally
 * @remarks Catches HTTP errors and handles them based on status code
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
          console.error('Client-side error:', error.error.message);
        } else {
          // Server-side error
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
          console.error(`Server-side error: ${error.status}`, error.message);

          // Handle specific error codes
          switch (error.status) {
            case 401:
              // Unauthorized - token expired or invalid
              console.warn('Unauthorized access - redirecting to login');
              this.authService.logout();
              this.router.navigate(['/signin']);
              errorMessage = 'Session expired. Please login again.';
              break;

            case 403:
              // Forbidden - user doesn't have permission
              console.warn('Forbidden access');
              errorMessage = 'You do not have permission to access this resource.';
              break;

            case 404:
              // Not Found
              console.warn('Resource not found');
              errorMessage = 'The requested resource was not found.';
              break;

            case 500:
              // Internal Server Error
              console.error('Internal server error');
              errorMessage = 'Internal server error. Please try again later.';
              break;

            case 503:
              // Service Unavailable
              console.error('Service unavailable');
              errorMessage = 'Service is temporarily unavailable. Please try again later.';
              break;

            default:
              errorMessage = error.error?.message || error.message || 'An unexpected error occurred';
          }
        }

        // You can show error in a notification service here
        // this.notificationService.showError(errorMessage);

        return throwError(() => ({
          message: errorMessage,
          status: error.status,
          error: error.error
        }));
      })
    );
  }
}
