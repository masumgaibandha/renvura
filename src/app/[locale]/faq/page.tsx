import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PendingPage } from '@/components/ui/PendingPage';
import type { Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

type PageProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'faq' });

  return buildMetadata({
    locale,
    path: '/faq',
    title: t('metaTitle'),
    // Answers would have to state delivery, returns and safety terms that are
    // not confirmed yet, so this page stays out of the index until it is real.
    noindex: true,
  });
}

export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'faq' });

  return (
    <PendingPage
      title={t('title')}
      pendingTitle={t('pendingTitle')}
      pendingBody={t('pendingBody')}
      contactCta={t('contactCta')}
    />
  );
}
