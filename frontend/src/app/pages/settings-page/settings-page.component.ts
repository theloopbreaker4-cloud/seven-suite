/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: settings-page.component.ts
 * Description: User account settings — theme, language, password change, 2FA toggle
 * Created: 2026-04-24
 */

import { Component } from '@angular/core';
import { I18nService, SUPPORTED_LANGS } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings-page',
  standalone: false,
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent {
  readonly langs = SUPPORTED_LANGS;

  constructor(public i18n: I18nService, public theme: ThemeService) {}

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  setLang(l: string): void { this.i18n.changeLang(l as any); }
}
