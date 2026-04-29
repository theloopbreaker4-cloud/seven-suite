import { Pipe, PipeTransform } from '@angular/core';

/**
 * Date Ago Pipe
 *
 * Transforms a date into a human-readable "time ago" format
 *
 * Usage:
 * {{ someDate | dateAgo }}
 * Output: "2 minutes ago", "3 hours ago", "1 day ago"
 *
 * {{ someDate | dateAgo:true }}
 * Output: "2m ago", "3h ago", "1d ago" (short format)
 */
@Pipe({
  name: 'dateAgo',
  standalone: true,
})
export class DateAgoPipe implements PipeTransform {
  transform(value: Date | string | number, shortFormat: boolean = false): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0) return 'just now';

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    const shortLabels: { [key: string]: string } = {
      year: 'y',
      month: 'mo',
      week: 'w',
      day: 'd',
      hour: 'h',
      minute: 'm',
      second: 's',
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);

      if (interval >= 1) {
        if (shortFormat) {
          return `${interval}${shortLabels[unit]} ago`;
        }
        return interval === 1
          ? `1 ${unit} ago`
          : `${interval} ${unit}s ago`;
      }
    }

    return 'just now';
  }
}
