import type { Metadata } from 'next';
import { TrackOrderForm } from '@/components/checkout/TrackOrderForm';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * `/track` — §15. Unlike cart, checkout and confirmation, the bare form page
 * is genuinely indexable evergreen content ("how do I track my Renvura
 * order") — `src/lib/site.ts` already marks it so; the *results* of a lookup
 * are personal and rendered client-side, never part of what a crawler sees.
 */
export function generateMetadata(): Metadata {
  return buildMetadata({ path: '/track', title: 'Track your order' });
}

export default function TrackPage() {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <header className="max-w-2xl">
          <h1 className="font-display text-[1.875rem] leading-[1.15] text-ink sm:text-[2.5rem]">
            Track your order
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Enter your order number and the phone number you ordered with.
          </p>
        </header>

        <div className="mt-8 sm:mt-10">
          <TrackOrderForm />
        </div>
      </Container>
    </div>
  );
}
