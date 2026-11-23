'use client';
/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { useTranslations } from 'next-intl';

/** Something failed while rendering a page (the frame around it still works). */
export default function PageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  return (
    <section className="hero">
      <p className="code">500</p>
      <h1>{t('errorTitle')}</h1>
      <p>{t('errorText')}</p>
      <button type="button" className="button" onClick={() => reset()}>
        {t('retry')}
      </button>
    </section>
  );
}
