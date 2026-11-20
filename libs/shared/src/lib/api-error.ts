/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

/** The body of every API error response (docs/06-conventions.md). */
export interface ApiErrorBody {
  error: string;
  code: string;
  fields?: Record<string, string>;
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  const v = value as Partial<ApiErrorBody> | null;
  return !!v && typeof v.error === 'string' && typeof v.code === 'string';
}
