/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Who and what the current unit of work is about. One per HTTP request (set by
 * `requestContextMiddleware`, enriched by AuthGuard) or per job in the worker (`RequestContext.run`).
 * Read it anywhere below — services, audit, outbox — without threading parameters through.
 */
export interface RequestContextData {
  requestId: string;
  orgId?: string;
  userId?: string;
  /** How the caller authenticated: a user session or an API key. */
  actorType?: 'user' | 'api_key' | 'system';
  apiKeyId?: string;
  locale?: string;
  ip?: string;
}

const storage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  /** Run `fn` with `data` as the current context (worker jobs, tests, scripts). */
  run<T>(data: RequestContextData, fn: () => T): T {
    return storage.run(data, fn);
  },

  /** The current context, or undefined outside a request/job. */
  get(): RequestContextData | undefined {
    return storage.getStore();
  },

  /** Update fields of the current context (no-op outside one). */
  patch(fields: Partial<RequestContextData>): void {
    const store = storage.getStore();
    if (store) Object.assign(store, fields);
  },
};

/** Same rule the logger uses: accept a trusted upstream id, otherwise generate one. */
export function requestIdFrom(req: IncomingMessage): string {
  const header = req.headers['x-request-id'];
  return typeof header === 'string' && /^[\w-]{8,64}$/.test(header)
    ? header
    : randomUUID();
}

/**
 * Express middleware, registered first: opens the context for the whole request and puts the
 * id on `req.id`, so pino-http logs the very same request id.
 */
export function requestContextMiddleware(
  req: IncomingMessage & { id?: string; ip?: string },
  res: ServerResponse,
  next: () => void,
): void {
  const requestId = req.id ?? requestIdFrom(req);
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  const lang = req.headers['accept-language'];
  storage.run(
    {
      requestId,
      ip: req.ip,
      locale: typeof lang === 'string' ? lang.split(',')[0]?.trim().slice(0, 16) : undefined,
    },
    next,
  );
}
