/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { currentSite } from '../../lib/api';

/**
 * Storefront home. The catalogue, cart and checkout arrive with the Commerce module (M2+);
 * until then the page introduces the organization.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [site, t] = await Promise.all([currentSite(), getTranslations('home')]);

  if (!site) {
    const n = await getTranslations('noSite');
    return (
      <section className="hero">
        <h1>{n('title')}</h1>
        <p>{n('text')}</p>
      </section>
    );
  }

  return (
    <section className="hero">
      <h1>{t('title', { name: site.name })}</h1>
      <p>{t('subtitle', { name: site.name })}</p>
      <p className="muted">{t('soon')}</p>
    </section>
  );
}
