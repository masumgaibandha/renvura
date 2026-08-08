import { ProductCard } from '@/components/commerce/ProductCard';
import type { ProductCardData } from '@/lib/content/storefront';

/**
 * The one product grid — design direction §7 ("Grid").
 *
 * Two columns on mobile, three on tablet, four on desktop, with 12 px mobile /
 * 24 px desktop gaps. Two columns at 360 px keeps the image tile around 150 px,
 * which is still large enough to read a toy at a glance and matches how every
 * comparable store on a phone behaves; dropping to one column would push the
 * second product below the fold for no gain.
 *
 * `items-stretch` plus the card's own `h-full` is what makes rows align — the
 * name is clamped to two lines so an unusually long title cannot break the
 * rhythm of a row.
 */
export function ProductGrid({
  products,
  'aria-label': ariaLabel,
}: {
  products: ProductCardData[];
  'aria-label'?: string;
}) {
  if (products.length === 0) return null;

  return (
    <ul
      aria-label={ariaLabel}
      className="grid grid-cols-2 items-stretch gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-6"
    >
      {products.map((product) => (
        <li key={product.slug} className="h-full">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
