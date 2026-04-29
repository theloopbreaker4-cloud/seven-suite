import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate Pipe
 *
 * Truncates a string to a specified length and adds ellipsis
 *
 * Usage:
 * {{ 'This is a long text' | truncate:10 }}
 * Output: "This is a..."
 *
 * {{ 'This is a long text' | truncate:10:'[...]' }}
 * Output: "This is a[...]"
 *
 * {{ 'Short' | truncate:10 }}
 * Output: "Short" (no truncation if shorter than limit)
 */
@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50, ellipsis: string = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;

    return value.substring(0, limit) + ellipsis;
  }
}
