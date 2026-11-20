/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/** Signed-in only; otherwise to /login, remembering where the user wanted to go. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthStore).isSignedIn()) return true;
  return inject(Router).createUrlTree(['/login'], {
    queryParams: { next: state.url },
  });
};

/** Login/sign-up pages: a signed-in user goes straight to the app. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthStore).isSignedIn() ? inject(Router).createUrlTree(['/']) : true;

/** Route data `{ permission: 'platform:member:read' }` must be granted. */
export const permissionGuard: CanActivateFn = (route) => {
  const permission = route.data?.['permission'] as string | undefined;
  return !permission || inject(AuthStore).can(permission)
    ? true
    : inject(Router).createUrlTree(['/']);
};

/** Only follow same-app paths from ?next= (no open redirects). */
export function safeNext(next: string | null | undefined): string {
  return next &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.includes('\\')
    ? next
    : '/';
}
