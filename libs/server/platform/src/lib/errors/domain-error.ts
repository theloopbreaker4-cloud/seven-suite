/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

/**
 * An expected failure with a stable machine-readable code. Services throw these; the global
 * filter turns them into `{ error, code, fields? }` with the given HTTP status
 * (docs/06-conventions.md).
 */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'DomainError';
  }

  static validation(fields: Record<string, string>): DomainError {
    return new DomainError(
      'validation_failed',
      'Some fields are invalid',
      422,
      fields,
    );
  }
  static unauthorized(
    message = 'Authentication required',
    code = 'unauthorized',
  ): DomainError {
    return new DomainError(code, message, 401);
  }
  static forbidden(
    message = 'You do not have access to this',
    code = 'forbidden',
  ): DomainError {
    return new DomainError(code, message, 403);
  }
  static notFound(message = 'Not found', code = 'not_found'): DomainError {
    return new DomainError(code, message, 404);
  }
  static conflict(code: string, message: string): DomainError {
    return new DomainError(code, message, 409);
  }
  static tooManyRequests(
    message = 'Too many attempts, try again later',
  ): DomainError {
    return new DomainError('rate_limited', message, 429);
  }
}
