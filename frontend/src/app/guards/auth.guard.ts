/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth.guard.ts
 * Description: Route guard to protect authenticated routes
 * Created: 2025-10-26
 */

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - protects routes that require authentication
 * @remarks Redirects to signin page if user is not authenticated
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Check if user can activate the route
   * @param route - Activated route snapshot
   * @param state - Router state snapshot
   * @returns true if authenticated, otherwise redirects to signin
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Store the attempted URL for redirecting after login
    return this.router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: state.url }
    });
  }
}
