import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FiMail, FiPhone } from 'react-icons/fi';
import { ContactForm } from '@/components/contact/ContactForm';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site';

type PageProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  return buildMetadata({
    locale,
    path: '/contact',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-base text-ink-muted">{t('lead')}</p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <section aria-labelledby="contact-form-heading" className="order-2 lg:order-1">
          <h2 id="contact-form-heading" className="font-display text-xl text-ink">
            {t('formTitle')}
          </h2>
          <div className="mt-5">
            <ContactForm />
          </div>
        </section>

        <section aria-labelledby="contact-details-heading" className="order-1 lg:order-2">
          <h2 id="contact-details-heading" className="font-display text-xl text-ink">
            {t('detailsTitle')}
          </h2>
          <ul className="mt-5 space-y-4">
            <li>
              <a
                href={siteConfig.phoneHref}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <FiPhone aria-hidden="true" className="size-5 text-ink-muted" />
                <span>
                  <span className="block text-xs uppercase tracking-[0.14em] text-ink-muted">
                    {t('phoneLabel')}
                  </span>
                  <span className="latin block text-base font-semibold text-ink">
                    {siteConfig.phone}
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.emailHref}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <FiMail aria-hidden="true" className="size-5 text-ink-muted" />
                <span>
                  <span className="block text-xs uppercase tracking-[0.14em] text-ink-muted">
                    {t('emailLabel')}
                  </span>
                  <span className="latin block text-base font-semibold text-ink">
                    {siteConfig.email}
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </Container>
  );
}
