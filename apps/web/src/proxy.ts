/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { NextResponse, type NextRequest } from 'next/server';
import {
  FALLBACK_LOCALE,
  isLocale,
  LOCALES,
  negotiateLocale,
} from './lib/locales';

/**
 * Runs before every page request:
 *  - paths without a language prefix go to the visitor's language (`/` → `/ka`); the layout then
 *    narrows it to the languages the organization enabled;
 *  - a fresh nonce per request for a strict Content-Security-Policy (Next applies it to its own
 *    scripts), so injected inline scripts can't run.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const first = pathname.split('/')[1];
  if (!isLocale(first)) {
    const locale = negotiateLocale(
      req.headers.get('accept-language'),
      LOCALES,
      FALLBACK_LOCALE,
    );
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const dev = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src 'self'${dev ? ' ws:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  // Pages only: not the API routes, Next internals or static files.
  matcher: ['/((?!api/|_next/|favicon.ico|robots.txt|.*\\.[a-z0-9]+$).*)'],
};
