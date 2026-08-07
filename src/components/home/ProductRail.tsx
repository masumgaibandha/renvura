import { ProductCard } from '@/components/commerce/ProductCard';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { ProductCardData } from '@/lib/content/storefront';
import { isBuilt } from '@/lib/site';

/**
 * A product grid section — design direction §7 (grid) and §6.2 (labels).
 *
 * Used for Featured Products, New Arrivals, Collections and Best Sellers. The
 * heading is passed in rather than derived, because the *label* carries a
 * claim: "Featured Products" is honest at any stage, while "Best Sellers" may
 * only be used when the data behind it comes from completed orders (D-10).
 *
 * Renders nothing when the list is empty — no skeleton, no "coming soon" grid,
 * no seeded products (D-12).
 */
export function ProductRail({
  eyebrow,
  title,
  products,
  viewAllHref,
}: {
  eyebrow?: string;
  title: string;
  products: ProductCardData[];
  viewAllHref?: string;
}) {
  if (products.length === 0) return null;

  const showViewAll = viewAllHref !== undefined && isBuilt(viewAllHref);

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          action={
            showViewAll ? (
              <AppLink
                href={viewAllHref}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-ink-muted"
              >
                View all
              </AppLink>
            ) : undefined
          }
        />

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
