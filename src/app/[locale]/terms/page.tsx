import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PolicyRoute, createPolicyMetadata } from '@/components/ui/PolicyRoute';
import type { Locale } from '@/i18n/routing';

type PageProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return createPolicyMetadata(locale, 'terms', '/terms');
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PolicyRoute locale={locale} policyKey="terms" />;
}
