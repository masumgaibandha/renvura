import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * `/cart` — design direction §17. Never indexable: the cart is personal,
 * dynamic state, not content (§24; `src/lib/site.ts` already marks it
 * `indexable: false`).
 *
 * The page itself is a server shell; every byte of cart content is client
 * state (`localStorage`), so it renders through `<CartView>` alone.
 */
export function generateMetadata(): Metadata {
  return buildMetadata({ path: '/cart', title: 'Your cart', noindex: true });
}

export default function CartPage() {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <header className="max-w-2xl">
          <h1 className="font-display text-[1.875rem] leading-[1.15] text-ink sm:text-[2.5rem]">
            Your cart
          </h1>
        </header>

        <div className="mt-8 sm:mt-10">
          <CartView />
        </div>
      </Container>
    </div>
  );
}
