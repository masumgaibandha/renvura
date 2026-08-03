import { getTranslations } from 'next-intl/server';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';

/**
 * Branded 404 — Project Specification v1.8 §5.8. Works in both themes and both
 * languages, with clear routes back.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');

  const links = [
    { href: '/', label: t('home') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ] as const;

  return (
    <Container className="flex min-h-[60vh] flex-col justify-center py-16">
      <div className="max-w-xl">
        <p className="latin font-display text-6xl text-accent-ink">{t('code')}</p>
        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-base text-ink-muted">{t('body')}</p>

        <ul className="mt-8 flex flex-col gap-3 sm:flex-row">
          {links.map((link) => (
            <li key={link.href}>
              <AppLink
                href={link.href}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                {link.label}
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
