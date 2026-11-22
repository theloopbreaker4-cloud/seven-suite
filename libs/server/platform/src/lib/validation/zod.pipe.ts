/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { DomainError } from '../errors/domain-error';

/**
 * Validates a request body/query against a zod schema at the controller boundary.
 * Failures become 422 `validation_failed` with one message per field.
 *   @Body(new ZodPipe(loginSchema)) body: LoginInput
 */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value ?? {});
    if (result.success) return result.data;
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    throw DomainError.validation(fields);
  }
}
