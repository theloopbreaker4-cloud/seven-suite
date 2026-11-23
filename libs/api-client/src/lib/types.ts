/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { paths } from './schema';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** JSON body a route accepts: `RequestBody<'/auth/login', 'post'>`. */
export type RequestBody<P extends keyof paths, M extends Method> =
  paths[P] extends Record<
    M,
    { requestBody?: { content: { 'application/json': infer B } } }
  >
    ? B
    : never;

/** Every documented API path. */
export type ApiPath = keyof paths;
