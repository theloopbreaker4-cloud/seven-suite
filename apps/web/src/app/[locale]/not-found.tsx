/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <section className="hero">
      <p className="code">404</p>
      <h1>{t('notFoundTitle')}</h1>
      <p>{t('notFoundText')}</p>
      <a className="button" href="./">
        {t('home')}
      </a>
    </section>
  );
}
