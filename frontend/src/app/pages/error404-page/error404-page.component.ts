/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: error404-page.component.ts
 * Description: 404 Not Found page with link back to home
 * Created: 2026-04-24
 */

import { Component } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-error404-page',
  standalone: false,
  templateUrl: './error404-page.component.html',
})
export class Error404PageComponent {
  constructor(private i18n: I18nService) {}
  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }
}
