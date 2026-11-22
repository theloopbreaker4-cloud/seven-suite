/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { getRequestConfig } from 'next-intl/server';
import { FALLBACK_LOCALE, isLocale } from '../lib/locales';

/** next-intl: messages for the locale in the URL (`/[locale]/…`). */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : FALLBACK_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
