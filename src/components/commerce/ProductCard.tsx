import Image from 'next/image';
import { AppLink } from '@/components/ui/AppLink';
import type { ProductCardData } from '@/lib/content/storefront';

/**
 * The one product card, used in every grid — design direction §7.
 *
 * Phase 1 ships the presentation only; there are no products to render yet and
 * none are invented. Phase 2 exercises this component with protected demo data,
 * which is when the storefront is visually approved (§11.1.3).
 *
 * Deliberate choices carried from §7:
 *  - fixed 1:1 image box, so a grid never shifts as images load (CLS budget)
 *  - product name clamped to two lines, so rows align
 *  - at most one badge
 *  - a transparent border at rest, so the hover border changes colour and not
 *    geometry
 *  - no colour swatches, no countdown, no "only N left"
 *
 * Add to Cart is intentionally absent until `/cart` exists (Phase 4). When it
 * arrives it must be visible and operable on both desktop and mobile — never
 * revealed on hover.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className="group h-full">
      <AppLink
        href={product.href}
        className="flex h-full flex-col rounded-2xl border border-transparent p-2 transition-colors hover:border-line"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className="object-contain"
            />
          ) : null}

          {product.badge ? (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${
                product.badge === 'sale'
                  ? 'bg-accent text-on-accent'
                  : 'bg-soft-mint text-brand-navy'
              }`}
            >
              {product.badge === 'sale' ? 'Sale' : 'New'}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-1 flex-col px-1">
          {product.categoryLabel ? (
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
              {product.categoryLabel}
            </p>
          ) : null}

          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink sm:text-base">
            {product.name}
          </h3>

          <div className="mt-auto pt-2">
            <p className="flex items-baseline gap-2">
              <span className="latin text-[0.9375rem] font-bold text-ink sm:text-[1.0625rem]">
                {formatBdt(product.priceMinor)}
              </span>
              {product.comparePriceMinor !== undefined ? (
                <span className="latin text-[0.8125rem] text-ink-muted line-through">
                  {formatBdt(product.comparePriceMinor)}
                </span>
              ) : null}
            </p>
            {product.inStock ? null : (
              <p className="mt-1 text-xs font-medium text-ink-muted">Out of stock</p>
            )}
          </div>
        </div>
      </AppLink>
    </article>
  );
}

/** ৳ with no decimals — the convention BD storefronts use for whole-taka prices. */
function formatBdt(minorUnits: number): string {
  return `৳${Math.round(minorUnits / 100).toLocaleString('en-BD')}`;
}
