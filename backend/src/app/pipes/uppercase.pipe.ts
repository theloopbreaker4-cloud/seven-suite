/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: uppercase.pipe.ts
 * Description: Uppercase transformation pipe - converts string values to uppercase
 * Created: 2025-10-26
 */

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * UppercasePipe - transforms string values to uppercase
 * @remarks Used in controller methods to automatically convert responses
 */
@Injectable()
export class UppercasePipe implements PipeTransform {
  /**
   * Transforms value to uppercase if it's a string
   * @param value - Input value
   * @param metadata - Argument metadata
   * @returns Uppercased string or original value
   */
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value !== 'string') {
      return value;
    }
    return value.toUpperCase();
  }
}
