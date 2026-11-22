/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { currentSite } from '../../lib/api';
import { isLocale, LOCALE_NAMES, type Locale } from '../../lib/locales';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const site = await currentSite();
  const t = await getTranslations({ locale: isLocale(locale) ? locale : 'en', namespace: 'home' });
  return site
    ? { title: { default: site.name, template: `%s · ${site.name}` }, description: t('subtitle', { name: site.name }) }
    : { title: 'Seven Suite', robots: { index: false } };
}

/**
 * Every storefront page: resolves the organization from the Host, keeps the language within the
 * ones it enabled, and renders the shared frame. Unknown hosts get the "no shop here" page.
 */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const site = await currentSite();
  if (site && !site.languages.includes(locale)) redirect(`/${site.locale}`);
  setRequestLocale(locale);

  // The CSP nonce from src/proxy.ts is picked up by Next for its own scripts automatically.
  const [messages, t] = await Promise.all([getMessages(), getTranslations('frame')]);
  const languages = (site?.languages ?? [locale]).filter(isLocale) as Locale[];

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <header className="frame-header">
            <a href={`/${locale}`} className="brand">
              {site?.name ?? 'Seven Suite'}
            </a>
            {languages.length > 1 && (
              <nav aria-label={t('language')} className="langs">
                {languages.map((l) => (
                  <a key={l} href={`/${l}`} aria-current={l === locale ? 'true' : undefined} lang={l}>
                    {LOCALE_NAMES[l]}
                  </a>
                ))}
              </nav>
            )}
          </header>
          <main className="frame-main">{children}</main>
          <footer className="frame-footer">
            <span>
              © {new Date().getFullYear()} {site?.name ?? 'Seven Suite'}
            </span>
            <span>
              {t('poweredBy')}{' '}
              <a href="https://seven.toolpix.dev/products/seven-suite" rel="noopener">
                Seven Suite
              </a>
            </span>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
