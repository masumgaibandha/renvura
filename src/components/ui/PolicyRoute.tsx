import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PendingPage } from '@/components/ui/PendingPage';
import type { Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import type { PolicyKey } from '@/lib/site';

/**
 * The five footer policy routes — Project Specification v1.8 §5.9.
 *
 * The routes, titles and footer links exist so the structure is in place, but
 * §5.9 is explicit that these pages need real, reviewed legal wording. Until
 * that exists they render the pending state and are kept out of the index.
 */
export async function createPolicyMetadata(
  locale: Locale,
  policyKey: PolicyKey,
  path: string,
): Promise<Metadata> {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'policies' });

  return buildMetadata({
    locale,
    path,
    title: t(`${policyKey}.title`),
    noindex: true,
  });
}

export async function PolicyRoute({
  locale,
  policyKey,
}: {
  locale: Locale;
  policyKey: PolicyKey;
}) {
  const t = await getTranslations({ locale, namespace: 'policies' });

  return (
    <PendingPage
      title={t(`${policyKey}.title`)}
      summary={t(`${policyKey}.summary`)}
      pendingLabel={t('pendingLabel')}
      pendingTitle={t('pendingTitle')}
      pendingBody={t('pendingBody')}
      contactCta={t('contactCta')}
    />
  );
}
