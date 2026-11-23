/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

/** Storefront languages the product ships (same list as the API's SUPPORTED_LANGUAGES). */
export const LOCALES = ['ka', 'en', 'ru', 'uk', 'az', 'hy'] as const;
export type Locale = (typeof LOCALES)[number];
export const FALLBACK_LOCALE: Locale = 'ka';

export const LOCALE_NAMES: Record<Locale, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  az: 'Azərbaycanca',
  hy: 'Հայերեն',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Pick the best of `allowed` for an Accept-Language header (`ru-RU,ru;q=0.9,en;q=0.8`).
 * Falls back to `fallback` (the organization's default language).
 */
export function negotiateLocale(
  acceptLanguage: string | null | undefined,
  allowed: readonly string[],
  fallback: string,
): string {
  const wanted = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = Number(
        params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? '1',
      );
      return {
        lang: tag.toLowerCase().split('-')[0],
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q);
  return wanted.find((w) => allowed.includes(w.lang))?.lang ?? fallback;
}
