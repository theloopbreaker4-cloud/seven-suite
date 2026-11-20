/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

/** Auth endpoints answer 401 for wrong credentials; retrying them after a refresh is wrong. */
const NO_RETRY =
  /\/api\/v1\/auth\/(login|signup|refresh|logout|password|verify-email$|invitations)/;

/**
 * For every API call: mark it as XHR (the API's CSRF check for cookie routes), send cookies,
 * attach the access token. On 401, refresh once and replay; if that fails, go to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);
  const store = inject(AuthStore);
  const router = inject(Router);

  const withAuth = (r: HttpRequest<unknown>) => {
    const token = store.accessToken();
    return r.clone({
      withCredentials: true,
      setHeaders: {
        'X-Requested-With': 'seven-admin',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  return next(withAuth(req)).pipe(
    catchError((err: unknown) => {
      if (
        !(err instanceof HttpErrorResponse) ||
        err.status !== 401 ||
        NO_RETRY.test(req.url)
      ) {
        return throwError(() => err);
      }
      return from(store.refresh()).pipe(
        switchMap((ok) => {
          if (ok) return next(withAuth(req));
          void router.navigate(['/login'], {
            queryParams: { next: router.url },
          });
          return throwError(() => err);
        }),
      );
    }),
  );
};
