import { Pipe, PipeTransform } from '@angular/core';

/**
 * Unique Pipe
 *
 * Filters an array to contain only unique values
 * Can work with primitive arrays or object arrays with a specific property
 *
 * Usage:
 * {{ [1, 2, 2, 3, 3, 4] | unique }}
 * Output: [1, 2, 3, 4]
 *
 * {{ users | unique:'email' }}
 * Returns: users with unique emails only
 *
 * Example:
 * users = [
 *   { id: 1, email: 'john@example.com' },
 *   { id: 2, email: 'john@example.com' },
 *   { id: 3, email: 'jane@example.com' }
 * ]
 * {{ users | unique:'email' }}
 * Returns: [
 *   { id: 1, email: 'john@example.com' },
 *   { id: 3, email: 'jane@example.com' }
 * ]
 */
@Pipe({
  name: 'unique',
  standalone: true,
})
export class UniquePipe implements PipeTransform {
  transform<T>(items: T[], property?: keyof T): T[] {
    if (!items) {
      return items;
    }

    if (!property) {
      // For primitive arrays
      return [...new Set(items)];
    }

    // For object arrays with a specific property
    const seen = new Set();
    return items.filter(item => {
      const value = item[property];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
}
