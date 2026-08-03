import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

type PageProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  return buildMetadata({
    locale,
    path: '/about',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  const sections = [
    { title: t('founderTitle'), body: t('founderBody') },
    { title: t('approachTitle'), body: t('approachBody') },
    { title: t('buildTitle'), body: t('buildBody') },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <article className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-5 text-lg text-ink-muted">{t('lead')}</p>

        {sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="font-display text-xl text-ink sm:text-2xl">{section.title}</h2>
            <p className="mt-3 text-base text-ink-muted">{section.body}</p>
          </section>
        ))}

        <AppLink
          href="/contact"
          className="mt-12 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
        >
          {t('contactCta')}
        </AppLink>
      </article>
    </Container>
  );
}
