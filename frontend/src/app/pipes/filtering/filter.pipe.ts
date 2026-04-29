import { Pipe, PipeTransform } from '@angular/core';

/**
 * Filter Pipe
 *
 * Filters an array of objects by a search term across specified properties
 *
 * Usage:
 * {{ users | filter:'searchTerm':['name', 'email'] }}
 *
 * Example:
 * users = [
 *   { name: 'John', email: 'john@example.com' },
 *   { name: 'Jane', email: 'jane@example.com' }
 * ]
 * {{ users | filter:'john':['name', 'email'] }}
 * Returns: [{ name: 'John', email: 'john@example.com' }]
 */
@Pipe({
  name: 'filter',
  standalone: true,
})
export class FilterPipe implements PipeTransform {
  transform<T>(items: T[], searchTerm: string, properties: (keyof T)[]): T[] {
    if (!items || !searchTerm || !properties || properties.length === 0) {
      return items;
    }

    const term = searchTerm.toLowerCase().trim();

    return items.filter(item => {
      return properties.some(property => {
        const value = item[property];
        if (value === null || value === undefined) {
          return false;
        }
        return String(value).toLowerCase().includes(term);
      });
    });
  }
}
