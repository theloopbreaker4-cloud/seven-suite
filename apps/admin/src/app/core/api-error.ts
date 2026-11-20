/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpErrorResponse } from '@angular/common/http';
import { isApiErrorBody, type ApiErrorBody } from '@seven/shared';

/** Normalize any failure into the API's `{ error, code, fields }` shape for display. */
export function apiError(err: unknown): ApiErrorBody {
  if (err instanceof HttpErrorResponse) {
    if (isApiErrorBody(err.error)) return err.error;
    if (err.status === 0)
      return { error: 'Cannot reach the server', code: 'network' };
    return { error: err.message, code: `http_${err.status}` };
  }
  return { error: 'Something went wrong', code: 'unknown' };
}
