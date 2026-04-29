/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin.guard.ts
 * Description: Guard to protect admin routes - checks if user has admin role
 * Created: 2025-11-03
 */

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../enums/user.enum.shared';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;

    console.log('AdminGuard - Current user:', currentUser);
    console.log('AdminGuard - User role:', currentUser?.role);

    if (currentUser) {
      // Check if user has admin role using enum
      if (currentUser.role === UserRole.Admin) {
        console.log('AdminGuard - Access granted');
        return true;
      }

      // User is logged in but not admin - redirect to dashboard
      console.log('AdminGuard - Access denied, not admin');
      this.router.navigate(['/dashboard']);
      return false;
    }

    // Not logged in - redirect to login page with return url
    console.log('AdminGuard - Not logged in');
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
