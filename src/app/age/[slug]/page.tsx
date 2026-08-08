import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogueEmptyState } from '@/components/commerce/CatalogueEmptyState';
import { ProductGrid } from '@/components/commerce/ProductGrid';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { getAgeBand, getProductsForAgeBand } from '@/lib/content/storefront';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * Shop by age — `/age/[slug]`.
 *
 * **This route is built and correct, and nothing links to it yet.** That is the
 * deliberate outcome of a data question, not an oversight:
 *
 *  - The age bands are real, founder-confirmed, contiguous navigation bands.
 *  - **No product has an approved age range.** The only age information in the
 *    catalogue is supplier listing text, which §7.2 treats as non-probative and
 *    D-16 refuses to render. Assigning products to bands from it would be
 *    exactly the fabricated claim this project exists not to make.
 *
 * So the architecture ships and the navigation stays gated on
 * `hasAgeAssignments()`. Publishing a "Shop by Age" menu today would be five
 * links to five empty pages — a dead control with a useful-looking label
 * (D-15, §11.1.1). The moment a founder-approved assignment exists, the menu
 * appears and these pages fill, with no redesign.
 *
 * Membership is derived from months rather than stored as a band reference, so
 * re-banding never requires re-tagging a product (§3.3).
 */
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const band = await getAgeBand(slug);

  if (!band) {
    return buildMetadata({ path: `/age/${slug}`, title: 'Age range not found', noindex: true });
  }

  return buildMetadata({
    path: `/age/${band.slug}`,
    title: `Shop by age: ${band.label}`,
    // No claim about suitability in the description — the band is a browsing
    // range, not an assessment of any product.
    description: `Products in the Renvura catalogue grouped under ${band.label}.`,
    // Never indexable while it lists nothing, and never while its products are
    // protected demo drafts (D-08).
    noindex: true,
  });
}

export default async function AgeBandPage({ params }: PageProps) {
  const { slug } = await params;
  const band = await getAgeBand(slug);

  if (!band) notFound();

  const products = await getProductsForAgeBand(band);

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
            <li>
              <AppLink
                href="/products"
                className="inline-flex min-h-11 items-center rounded transition-colors hover:text-ink"
              >
                Shop
              </AppLink>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{band.label}</li>
          </ol>
        </nav>

        <header className="mt-5 max-w-2xl">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-xs">
            Shop by age
          </p>
          <h1 className="mt-2 font-display text-[1.875rem] leading-[1.15] text-ink sm:text-[2.5rem]">
            {band.label}
          </h1>
        </header>

        <div className="mt-8 sm:mt-10">
          {products.length > 0 ? (
            <ProductGrid products={products} aria-label={`Products for ${band.label}`} />
          ) : (
            /**
             * The honest reason, stated plainly.
             *
             * Not "no results" and not "coming soon": the products exist, the
             * age assessment does not. Saying so is more useful to a parent than
             * a generic empty state, and it is the truth.
             */
            <CatalogueEmptyState
              title="No products are listed for this age yet."
              body="We only place a product in an age range once that has been properly checked — we do not copy the age printed on a supplier's box. Until then, every product is on the main shop page with a plain description of what it actually is."
              bodyBn="কোনো পণ্য কোন বয়সের জন্য, তা যাচাই না করে আমরা লিখি না। সব পণ্য মূল তালিকায় বর্ণনাসহ দেওয়া আছে।"
              actions={[
                { label: 'View all products', href: '/products', primary: true },
                { label: 'Ask us about age', href: '/contact' },
              ]}
            />
          )}
        </div>
      </Container>
    </div>
  );
}
