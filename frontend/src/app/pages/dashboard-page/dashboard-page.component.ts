/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: dashboard-page.component.ts
 * Description: Authenticated user dashboard — greeting and quick links
 * Created: 2026-04-24
 */

import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: false,
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent {
  constructor(public auth: AuthService, private i18n: I18nService) {}
  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }
}
