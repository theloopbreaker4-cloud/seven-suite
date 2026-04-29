/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: support-page.component.ts
 * Description: Support page with contact options and response times
 * Created: 2026-04-24
 */

import { Component } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-support-page',
  standalone: false,
  templateUrl: './support-page.component.html',
})
export class SupportPageComponent {
  constructor(private i18n: I18nService) {}
  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }
}
