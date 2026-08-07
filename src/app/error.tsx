'use client';

import { Button } from '@heroui/react';
import { useEffect } from 'react';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';

/** Branded server-error page, with a retry action and a route out to support. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[renvura] route error', error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col justify-center py-16">
      <div className="max-w-xl">
        <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-accent" />
        <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">Something went wrong</h1>
        <p className="mt-4 text-base text-ink-muted">
          The page could not be loaded. Trying again usually works — if it does not, please get
          in touch and we will look into it.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" size="lg" onPress={() => reset()}>
            Try again
          </Button>
          <AppLink
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Contact Renvura
          </AppLink>
        </div>

        {error.digest ? (
          <p className="latin mt-8 text-xs text-ink-muted">Ref: {error.digest}</p>
        ) : null}
      </div>
    </Container>
  );
}
