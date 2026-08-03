import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

type PageProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  return buildMetadata({
    locale,
    path: '/',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  const principles = [
    { title: t('principleCurationTitle'), body: t('principleCurationBody') },
    { title: t('principleGuidanceTitle'), body: t('principleGuidanceBody') },
    { title: t('principleLanguageTitle'), body: t('principleLanguageBody') },
  ];

  return (
    <>
      {/* Curator first, then the promise — design reference 1b. */}
      <section className="pt-10 sm:pt-16">
        <Container>
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Image
                src="/brand/profile-light.png"
                alt=""
                aria-hidden="true"
                width={64}
                height={64}
                priority
                className="block size-16 rounded-full dark:hidden"
              />
              <Image
                src="/brand/profile-dark.png"
                alt=""
                aria-hidden="true"
                width={64}
                height={64}
                priority
                className="hidden size-16 rounded-full dark:block"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  {t('curatorLabel')}
                </p>
                <p className="latin mt-1 text-lg font-semibold text-ink">{t('curatorName')}</p>
                <p className="text-sm text-ink-muted">{t('curatorRole')}</p>
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">
              {t('curatorCredentials')}
            </p>
          </div>

          <div className="mt-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {t('eyebrow')}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
              {t('headline')}
            </h1>
            <p className="mt-4 text-base text-ink-muted sm:text-lg">{t('subline')}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AppLink
                href="/about"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
              >
                {t('ctaPrimary')}
              </AppLink>
              <AppLink
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                {t('ctaSecondary')}
              </AppLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="mt-16 sm:mt-24">
        <Container>
          <h2 className="font-display text-2xl text-ink sm:text-3xl">{t('principlesTitle')}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {principles.map((principle) => (
              <li
                key={principle.title}
                className="rounded-2xl border border-line bg-surface p-5"
              >
                <span aria-hidden="true" className="block h-1 w-8 rounded-full bg-accent" />
                <h3 className="mt-4 text-base font-semibold text-ink">{principle.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{principle.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Honest build status. Nothing on this page is a live product offer. */}
      <section className="mt-16 sm:mt-24">
        <Container>
          <div className="rounded-2xl bg-brand-navy p-6 text-brand-cream sm:p-8">
            <h2 className="font-display text-2xl">{t('statusTitle')}</h2>
            <p className="mt-3 max-w-2xl text-sm text-brand-slate">{t('statusBody')}</p>
            <AppLink
              href="/contact"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
            >
              {t('statusCta')}
            </AppLink>
          </div>
        </Container>
      </section>
    </>
  );
}
