import { Pipe, PipeTransform } from '@angular/core';

/**
 * File Size Pipe
 *
 * Transforms bytes into human-readable file size format
 *
 * Usage:
 * {{ 1024 | fileSize }}
 * Output: "1 KB"
 *
 * {{ 1536 | fileSize:2 }}
 * Output: "1.50 KB" (2 decimal places)
 *
 * {{ 1048576 | fileSize }}
 * Output: "1 MB"
 */
@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number, decimals: number = 2): string {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
