import Image from 'next/image';
import type { ReactNode } from 'react';
import { AppLink } from '@/components/ui/AppLink';
import { formatTakaOrUndefined } from '@/lib/catalogue/price';
import type { ProductCardData } from '@/lib/content/storefront';

/**
 * The one product card, used in every grid — design direction §7.
 *
 * Deliberate choices carried from §7:
 *  - fixed 1:1 image box, so a grid never shifts as images load (CLS budget)
 *  - `object-contain` on a warm-white tile: the reference photography mixes
 *    600×600, 1024×1024 and 1059×1008 within one product, and cropping to fill
 *    would cut the edges off a wide product shot
 *  - product name clamped to two lines, so rows align
 *  - a transparent border at rest, so hover changes colour and not geometry
 *  - no colour swatches, no countdown, no "only N left"
 *
 * **Interactivity is conditional.** `href` is supplied only once
 * `/products/[slug]` exists (Phase 2D). Without it the card is an `<article>`,
 * not a link — a card that looks clickable and goes nowhere is exactly the dead
 * control §11.1.1 forbids. Nothing else about the card changes when the link
 * arrives.
 *
 * Add to Cart is intentionally absent until `/cart` exists (Phase 4). When it
 * arrives it must be visible and operable on both desktop and mobile — never
 * revealed on hover.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const price = formatTakaOrUndefined(product.priceMinor);
  const comparePrice = formatTakaOrUndefined(product.comparePriceMinor);

  const body = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            width={product.image.width}
            height={product.image.height}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="size-full object-contain object-center"
          />
        ) : null}

        {product.badge ? (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${
              product.badge === 'sale' ? 'bg-accent text-on-accent' : 'bg-soft-mint text-brand-navy'
            }`}
          >
            {product.badge === 'sale' ? 'Sale' : 'New'}
          </span>
        ) : null}

        {/* Per-product demo marker (D-08). Demo data is only ever visible in
            development and protected previews, and must be labelled wherever it
            appears — never left to look like a real listing. */}
        {product.isDemo ? (
          <span className="absolute right-2 top-2 rounded-full bg-brand-navy/85 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-cream">
            Demo
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-1 flex-col px-1">
        {product.categoryLabel ? (
          <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
            {product.categoryLabel}
          </p>
        ) : null}

        {/* The colour shift is a hover *reinforcement*, not the affordance
            itself: it is applied by the link shell's `group`, so a
            non-interactive card never gets it. */}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-brand-navy sm:text-base">
          {product.name}
        </h3>

        <div className="mt-auto pt-2">
          {/**
           * Coming Soon replaces the price row rather than sitting beside it.
           *
           * A small line of text in the position the price occupies, not a
           * badge over the image: the founder has selected this product but has
           * not priced it, and the honest signal is quiet. It occupies the same
           * row height as a price, so a mixed grid stays aligned.
           *
           * No price, no "৳0", no struck-through reference, no stock line, no
           * countdown — none of that exists for this product (D-12).
           */}
          {product.availability === 'coming-soon' ? (
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Coming soon
            </p>
          ) : price !== undefined ? (
            /**
             * Selling price dominant, reference price muted and struck through.
             *
             * `<del>` carries the "no longer applies" meaning semantically, so
             * the relationship survives without colour or size — and the
             * sr-only labels make it explicit rather than leaving a screen
             * reader to announce two bare numbers.
             *
             * No percentage, no "Save ৳500", no Sale badge: the price pair
             * alone does not authorise promotional claims. `savingsMinor()` in
             * `@/lib/catalogue/price` computes it if the founder ever decides
             * to show one.
             */
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="latin text-[0.9375rem] font-bold text-ink sm:text-[1.0625rem]">
                <span className="sr-only">Price </span>
                {price}
              </span>
              {comparePrice !== undefined ? (
                <del className="latin text-[0.8125rem] text-ink-muted decoration-ink-muted/60">
                  <span className="sr-only">Was </span>
                  {comparePrice}
                </del>
              ) : null}
            </p>
          ) : (
            // No founder-supplied price exists. Saying so plainly is the honest
            // option; ৳0, a struck-through guess or a loud "Coming soon" badge
            // would each imply something untrue (D-12). Kept in the price row's
            // position so card heights stay aligned across the grid.
            <p className="text-[0.8125rem] font-medium text-ink-muted">Price to be confirmed</p>
          )}

          {product.inStock === false && product.availability !== 'coming-soon' ? (
            <p className="mt-1 text-xs font-medium text-ink-muted">Out of stock</p>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <article className="h-full">
      <CardShell href={product.href}>{body}</CardShell>
    </article>
  );
}

/**
 * A link when there is somewhere to go, a plain container when there is not.
 *
 * Both share the same box so enabling the link in Phase 2D changes behaviour
 * without changing layout. Only the link form carries hover and focus
 * affordances — a non-interactive card must not imply it can be activated, and
 * only the link form owns the `group`, so the title's hover tint cannot leak
 * onto a card that goes nowhere.
 *
 * Focus is the global `:focus-visible` outline (2 px, `--focus`, 2 px offset)
 * rather than a bespoke ring: it follows the card's radius, it is the same
 * indicator every other control on the site uses, and it is never colour-only —
 * hover changes the border, focus draws an outline outside it.
 */
function CardShell({ href, children }: { href?: string; children: ReactNode }) {
  const base = 'flex h-full flex-col rounded-2xl border border-transparent p-2';

  if (href === undefined) {
    return <div className={base}>{children}</div>;
  }

  return (
    <AppLink
      href={href}
      className={`${base} group transition-colors hover:border-line hover:bg-surface/60`}
    >
      {children}
    </AppLink>
  );
}
