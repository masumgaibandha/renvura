import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * `/checkout` — design direction §17. Never indexable (§24; already
 * `indexable: false` in `src/lib/site.ts`).
 */
export function generateMetadata(): Metadata {
  return buildMetadata({ path: '/checkout', title: 'Checkout', noindex: true });
}

export default function CheckoutPage() {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <header className="max-w-2xl">
          <h1 className="font-display text-[1.875rem] leading-[1.15] text-ink sm:text-[2.5rem]">
            Checkout
          </h1>
        </header>

        <div className="mt-8 sm:mt-10">
          <CheckoutForm />
        </div>
      </Container>
    </div>
  );
}
