import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Safe HTML Pipe
 *
 * Sanitizes and marks HTML content as safe for rendering
 *
 * Usage:
 * <div [innerHTML]="htmlContent | safeHtml"></div>
 *
 * WARNING: Only use with trusted HTML content!
 * Malicious HTML can lead to XSS attacks.
 */
@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    return this.sanitizer.sanitize(1, value) || '';
  }
}
