/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: site-layout.component.ts
 * Description: Public site shell — sticky header with nav, theme toggle, lang switcher, auth CTA + footer
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService, Theme } from '../../services/theme.service';
import { I18nService, SUPPORTED_LANGS, LangCode } from '../../services/i18n.service';

@Component({
  selector: 'app-site-layout',
  standalone: false,
  templateUrl: './site-layout.component.html',
})
export class SiteLayoutComponent implements OnInit {
  readonly year = new Date().getFullYear();
  readonly langs = SUPPORTED_LANGS;

  langOpen  = signal(false);
  theme     = signal<Theme>('light');
  currentLang = signal<LangCode>('en');

  constructor(
    public auth: AuthService,
    private themeService: ThemeService,
    private i18n: I18nService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.theme.set(this.themeService.currentThemeValue);
    this.themeService.currentTheme.subscribe(t => this.theme.set(t));
    this.currentLang.set(this.i18n.lang());
  }

  t(key: string): string { return this.i18n.t(key); }
  tr(key: string, fallback: string): string { return this.i18n.tOr(key, fallback); }

  toggleTheme(): void { this.themeService.toggleTheme(); }

  setLang(code: LangCode): void {
    this.i18n.changeLang(code);
    this.currentLang.set(code);
    this.langOpen.set(false);
  }

  signout(): void {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
