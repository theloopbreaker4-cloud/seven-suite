/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from './domain-error';

export interface ErrorBody {
  error: string;
  code: string;
  fields?: Record<string, string>;
}

const CODE_FOR_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  405: 'method_not_allowed',
  409: 'conflict',
  413: 'payload_too_large',
  422: 'validation_failed',
  429: 'rate_limited',
  503: 'unavailable',
};

/**
 * Every error leaves the API as `{ error, code, fields? }`. Unexpected exceptions become a
 * generic 500 — their message and stack go to the log only, never to the client.
 */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly log = new Logger('ErrorFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toBody(exception);
    if (status >= 500)
      this.log.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    res.status(status).json(body);
  }

  private toBody(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof DomainError) {
      const body: ErrorBody = {
        error: exception.message,
        code: exception.code,
      };
      if (exception.fields) body.fields = exception.fields;
      return { status: exception.status, body };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const message =
        typeof raw === 'string'
          ? raw
          : typeof (raw as { message?: unknown }).message === 'string'
            ? (raw as { message: string }).message
            : exception.message;
      return {
        status,
        body: { error: message, code: CODE_FOR_STATUS[status] ?? 'error' },
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { error: 'Something went wrong', code: 'internal_error' },
    };
  }
}
