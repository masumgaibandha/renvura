import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { isBuilt } from '@/lib/site';

/**
 * Product-focused hero — design direction §6.4.
 *
 * Says what Renvura sells and offers one primary action. It is never the
 * founder's story (D-09): the founder appears far below, in a small row.
 *
 * The primary CTA points at `/products` once that route exists (Phase 2). Until
 * then it points at `/contact`, which is real and answers the question a
 * pre-launch visitor actually has. No invented prices, no placeholder product
 * imagery, no auto-rotating carousel (D-12, D-14).
 *
 * Kept to ≤ 70vh on mobile so the next section is partly visible on first
 * paint. A single soft-sky panel stands in for the product photograph until
 * real photography exists — a neutral tile, never a reference-theme image (D-11).
 */
export function Hero() {
  const shopBuilt = isBuilt('/products');

  return (
    <section className="bg-canvas pt-8 pb-10 sm:pt-12 sm:pb-14">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
          <div className="max-w-xl">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-xs">
              For Bangladeshi families
            </p>
            <h1 className="mt-3 font-display text-[1.875rem] leading-[1.15] text-ink sm:text-[2.5rem]">
              Everything your child needs, in one careful shop.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              Learning and play, baby essentials, feeding, safety, clothing and school
              supplies — selected by a child-development specialist and explained in plain
              language.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <AppLink
                href={shopBuilt ? '/products' : '/contact'}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
              >
                {shopBuilt ? 'Shop all products' : 'Ask about a product'}
              </AppLink>
              <AppLink
                href="/about"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                How Renvura chooses
              </AppLink>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden aspect-[4/3] w-full rounded-3xl bg-soft-sky lg:block"
          />
        </div>
      </Container>
    </section>
  );
}
