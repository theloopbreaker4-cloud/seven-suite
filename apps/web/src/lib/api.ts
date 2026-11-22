/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';

/** Public profile of the organization this storefront request belongs to (GET /api/v1/web/site). */
export interface Site {
  organizationId: string;
  slug: string;
  name: string;
  locale: string;
  languages: string[];
  timezone: string;
  baseCurrency: string;
  country: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function config() {
  const url = process.env['API_INTERNAL_URL'] ?? 'http://127.0.0.1:4000/api/v1';
  const key = process.env['WEB_SERVICE_KEY'];
  if (!key) throw new Error('WEB_SERVICE_KEY is not set');
  return { url: url.replace(/\/$/, ''), key };
}

/**
 * Server-side call to the API with the service key. Never runs in the browser (`server-only`),
 * so the key can't leak into client bundles.
 */
export async function api<T>(path: string, init: RequestInit & { revalidate?: number } = {}): Promise<T> {
  const { url, key } = config();
  const { revalidate = 60, ...rest } = init;
  const res = await fetch(`${url}${path}`, {
    ...rest,
    headers: { ...(rest.headers ?? {}), 'X-Service-Key': key, Accept: 'application/json' },
    next: { revalidate },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
    throw new ApiError(res.status, body.code ?? 'api_error', body.error ?? `API ${res.status}`);
  }
  return (await res.json()) as T;
}

/** The Host this request was made for (behind nginx: X-Forwarded-Host). */
export async function requestHost(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  // Local development: map localhost to a configured storefront host.
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) && process.env['WEB_DEV_HOST']) return process.env['WEB_DEV_HOST'];
  return host;
}

/** The current site, once per request; null when no organization owns this host. */
export const currentSite = cache(async (): Promise<Site | null> => {
  const host = await requestHost();
  if (!host) return null;
  try {
    return await api<Site>(`/web/site?host=${encodeURIComponent(host)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});
