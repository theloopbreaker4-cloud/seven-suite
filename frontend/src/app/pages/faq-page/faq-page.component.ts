/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: faq-page.component.ts
 * Description: Static FAQ page with collapsible questions, content sourced from i18n
 * Created: 2026-04-24
 */

import { Component, computed, signal } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

interface FaqItem { q: string; a: string; }

@Component({
  selector: 'app-faq-page',
  standalone: false,
  templateUrl: './faq-page.component.html',
})
export class FaqPageComponent {
  open = signal<number | null>(0);

  // Recompute on language change so FAQ texts stay localized.
  items = computed<FaqItem[]>(() => {
    const _ = this.i18n.lang(); // dependency
    return [1, 2, 3, 4].map(i => ({
      q: this.i18n.tOr(`faq.items.q${i}`, `Question ${i}`),
      a: this.i18n.tOr(`faq.items.a${i}`, ''),
    }));
  });

  constructor(public i18n: I18nService) {}
  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  toggle(i: number): void {
    this.open.set(this.open() === i ? null : i);
  }
}
