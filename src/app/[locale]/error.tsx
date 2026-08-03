'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';

/**
 * Branded server-error page — Project Specification v1.8 §5.8.
 * Bilingual and theme-aware, with a retry action and a contact route out.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error('[renvura] route error', error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col justify-center py-16">
      <div className="max-w-xl">
        <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-accent" />
        <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-base text-ink-muted">{t('body')}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" size="lg" onPress={() => reset()}>
            {t('retry')}
          </Button>
          <AppLink
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            {t('contact')}
          </AppLink>
        </div>

        {error.digest ? (
          <p className="latin mt-8 text-xs text-ink-muted">Ref: {error.digest}</p>
        ) : null}
      </div>
    </Container>
  );
}
