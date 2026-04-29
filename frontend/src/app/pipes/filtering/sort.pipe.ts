import { Pipe, PipeTransform } from '@angular/core';

/**
 * Sort Pipe
 *
 * Sorts an array of objects by a specified property
 *
 * Usage:
 * {{ users | sort:'name' }}              // Ascending
 * {{ users | sort:'name':'desc' }}       // Descending
 * {{ users | sort:'age':'asc' }}         // Ascending (explicit)
 *
 * Example:
 * users = [
 *   { name: 'John', age: 30 },
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 35 }
 * ]
 * {{ users | sort:'age':'desc' }}
 * Returns: [{ name: 'Bob', age: 35 }, { name: 'John', age: 30 }, { name: 'Alice', age: 25 }]
 */
@Pipe({
  name: 'sort',
  standalone: true,
})
export class SortPipe implements PipeTransform {
  transform<T>(items: T[], property: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    if (!items || !property) {
      return items;
    }

    const sorted = [...items].sort((a, b) => {
      const aValue = a[property];
      const bValue = b[property];

      if (aValue === bValue) return 0;

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      // Default comparison
      return aValue > bValue ? 1 : -1;
    });

    return order === 'desc' ? sorted.reverse() : sorted;
  }
}
