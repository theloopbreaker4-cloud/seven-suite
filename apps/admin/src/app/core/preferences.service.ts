/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Theme = 'light' | 'dark';
export const LANGUAGES = [
  { code: 'ka', label: 'ქართული' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'az', label: 'Azərbaycanca' },
  { code: 'hy', label: 'Հայերեն' },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — preference just isn't remembered */
  }
};

/** Per-browser UI preferences: colour theme and interface language. */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly doc = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);

  readonly theme = signal<Theme>(this.initialTheme());
  readonly lang = signal<Lang>(this.initialLang());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.doc.documentElement.dataset['theme'] = theme;
      write('sv.theme', theme);
    });
    effect(() => {
      const lang = this.lang();
      this.transloco.setActiveLang(lang);
      this.doc.documentElement.lang = lang;
      write('sv.lang', lang);
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): Theme {
    const saved = read('sv.theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  private initialLang(): Lang {
    const known = LANGUAGES.map((l) => l.code) as readonly string[];
    const saved = read('sv.lang');
    if (saved && known.includes(saved)) return saved as Lang;
    const browser = (globalThis.navigator?.language ?? 'en').slice(0, 2);
    return (known.includes(browser) ? browser : 'en') as Lang;
  }
}
