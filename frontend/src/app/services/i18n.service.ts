import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type LangCode = 'en' | 'ru' | 'ka' | 'uk' | 'az' | 'hy' | 'be' | 'de' | 'fr';

export const SUPPORTED_LANGS: LangCode[] = ['en', 'ru', 'ka', 'uk', 'az', 'hy', 'be', 'de', 'fr'];
export const DEFAULT_LANG: LangCode = 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly isBrowser: boolean;
  readonly lang = signal<LangCode>(DEFAULT_LANG);
  private cache: Partial<Record<LangCode, Record<string, unknown>>> = {};

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (isPlatformBrowser(platformId)) {
      this.lang.set(this.detectLang());
    }
  }

  setLang(code: LangCode): void {
    this.lang.set(code);
    if (this.isBrowser) {
      localStorage.setItem('lang', code);
    }
  }

  private detectLang(): LangCode {
    try {
      // 1. URL prefix /ru/...
      const match = window.location.pathname.match(/^\/([a-z]{2})(\/|$)/);
      if (match && SUPPORTED_LANGS.includes(match[1] as LangCode)) return match[1] as LangCode;
      // 2. localStorage
      const stored = localStorage.getItem('lang') as LangCode;
      if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
      // 3. Browser language
      const bl = navigator.language.split('-')[0] as LangCode;
      return SUPPORTED_LANGS.includes(bl) ? bl : DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  }

  async init(): Promise<void> {
    await this.loadLang(this.lang());
  }

  async changeLang(code: LangCode): Promise<void> {
    if (!SUPPORTED_LANGS.includes(code)) return;
    await this.loadLang(code);
    this.setLang(code);
  }

  private async loadLang(code: LangCode): Promise<void> {
    if (this.cache[code]) return;
    try {
      const data = await firstValueFrom(
        this.http.get<Record<string, unknown>>(`/assets/i18n/${code}.json`)
      );
      this.cache[code] = data;
    } catch {
      this.cache[code] = this.cache[DEFAULT_LANG] ?? {};
    }
  }

  /** Translate key like 'nav.home'. Returns the key itself when nothing is found. */
  t(key: string, lang?: LangCode): string {
    const resolved = this.resolve(key, lang);
    return resolved ?? key;
  }

  /** Translate with an explicit fallback string when the key is missing. */
  tOr(key: string, fallback: string, lang?: LangCode): string {
    return this.resolve(key, lang) ?? fallback;
  }

  /** Returns the string for the key, or null when the key does not resolve to a string. */
  private resolve(key: string, lang?: LangCode): string | null {
    const l = lang ?? this.lang();
    const data = this.cache[l] ?? this.cache[DEFAULT_LANG] ?? {};
    const parts = key.split('.');
    let val: unknown = data;
    for (const part of parts) {
      if (val == null || typeof val !== 'object') return null;
      val = (val as Record<string, unknown>)[part];
    }
    return typeof val === 'string' ? val : null;
  }

  /** Get all strings for current lang — for use in templates via object spread */
  get strings(): Record<string, unknown> {
    return (this.cache[this.lang()] ?? {}) as Record<string, unknown>;
  }
}
