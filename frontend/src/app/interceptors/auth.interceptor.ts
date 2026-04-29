/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth.interceptor.ts
 * Description: HTTP interceptor for adding JWT token to requests
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
import { AuthService } from '../services/auth.service';

/**
 * AuthInterceptor - automatically adds JWT token to HTTP requests
 * @remarks Intercepts all HTTP requests and adds Authorization header with Bearer token
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get token from AuthService
    const token = this.authService.getToken();

    // Skip adding token for auth endpoints (login, register)
    const isAuthEndpoint = request.url.includes('/auth/login') ||
                          request.url.includes('/auth/register');

    // Clone request and add Authorization header if token exists
    if (token && !isAuthEndpoint) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
