import type { Metadata } from 'next';
import { CatalogueEmptyState } from '@/components/commerce/CatalogueEmptyState';
import { CatalogueToolbar } from '@/components/commerce/CatalogueToolbar';
import { ProductGrid } from '@/components/commerce/ProductGrid';
import { AppLink } from '@/components/ui/AppLink';
import { Bn } from '@/components/ui/Bn';
import { Container } from '@/components/ui/Container';
import {
  catalogueHref,
  isDefaultQuery,
  isFiltered,
  parseCatalogueQuery,
  type RawSearchParams,
} from '@/lib/catalogue/discovery';
import { getCatalogue, getCategoryTree } from '@/lib/content/storefront';
import { buildMetadata } from '@/lib/seo/metadata';
import { isIndexable } from '@/lib/site';

/**
 * The shop — the main discovery page.
 *
 * Phase 3 added category and availability filtering and a truthful sort. It did
 * not add a facet sidebar: an eleven-product catalogue does not need one, and
 * every facet a marketplace would offer here (rating, brand, material, age,
 * gender, discount) would have to be invented to exist (D-12).
 *
 * **State lives in the URL.** Filters are links and sort is a GET form, so back,
 * forward, refresh and a shared link all behave, and the page server-renders the
 * result rather than shipping the catalogue to the browser to filter it there.
 *
 * Rendered per request, not baked into the build: the catalogue lives in the
 * database and changes when the founder changes it, and the query string is
 * part of the render.
 */
export const dynamic = 'force-dynamic';

type PageProps = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCatalogueQuery(await searchParams);

  /**
   * **One canonical for every filtered variant.**
   *
   * `?category=numbers-math&sort=price-asc` is a view of the shop, not a
   * separate page, and letting each combination mint its own indexable URL is
   * how a small catalogue turns into hundreds of near-duplicate pages. The
   * canonical always points at the bare `/products`, and any non-default query
   * is additionally `noindex` so a crawler that ignores the canonical still
   * takes the hint.
   */
  // Two independent reasons to stay out of the index, and the page must honour
  // whichever applies: the registry currently marks the shop non-indexable
  // while the catalogue is being prepared, and a filtered view is never its own
  // page. Reading the registry rather than hardcoding `true` means the filtered
  // rule keeps working by itself the day the shop becomes indexable.
  const indexable = isIndexable('/products') && isDefaultQuery(query);

  return buildMetadata({
    // Always the bare path, never the current query string.
    path: '/products',
    title: 'Shop all products',
    description:
      'Learning and play products for children, selected by a child-development specialist.',
    noindex: !indexable,
  });
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const query = parseCatalogueQuery(await searchParams);

  const [{ products, total }, categories] = await Promise.all([
    getCatalogue(query),
    getCategoryTree(),
  ]);

  const hasComingSoon = products.some((product) => product.availability === 'coming-soon');
  const catalogueIsEmpty = total === 0 && !isFiltered(query);

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <header className="max-w-2xl">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-xs">
            Shop
          </p>
          <h1 className="mt-2 font-display text-[1.875rem] leading-[1.15] text-ink sm:text-[2.5rem]">
            All products
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Learning and play products chosen one at a time, with plain explanations of what each
            one actually does.
            {/* Said only when it is true. On an empty catalogue — which is what
                production sees — there is nothing marked Coming soon, and the
                sentence would be describing products that are not there. */}
            {hasComingSoon ? ' Some are still being confirmed and are marked Coming soon.' : ''}
          </p>
        </header>

        {/* The toolbar earns its place only when there is a catalogue to sift.
            On an empty shop it would be a set of controls that filter nothing. */}
        {!catalogueIsEmpty ? (
          <div className="mt-8 sm:mt-10">
            <CatalogueToolbar query={query} categories={categories} total={total} />
          </div>
        ) : null}

        <div className="mt-8 sm:mt-10">
          {products.length > 0 ? (
            <ProductGrid products={products} aria-label="All products" />
          ) : catalogueIsEmpty ? (
            <EmptyCatalogue />
          ) : (
            <CatalogueEmptyState
              title="Nothing matches that combination."
              body="No product in the catalogue fits every filter you have applied. Clearing them brings the whole shop back."
              actions={[
                { label: 'Clear filters', href: catalogueHref('/products', { sort: query.sort }), primary: true },
                { label: 'Ask what is coming', href: '/contact' },
              ]}
            />
          )}
        </div>
      </Container>
    </div>
  );
}

/**
 * The honest empty state.
 *
 * This is what production sees, and what development sees before the demo
 * catalogue is seeded. It is designed rather than accidental (§8.3) and invents
 * nothing — no skeleton grid implying products are loading, no placeholder
 * tiles, no "50+ products coming".
 */
function EmptyCatalogue() {
  return (
    <div className="rounded-2xl border border-line bg-soft-sunshine/45 p-6 sm:p-8">
      <h2 className="max-w-2xl font-display text-[1.375rem] leading-tight text-ink sm:text-2xl">
        The catalogue is still being prepared.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
        Products, prices and delivery details are being confirmed before anything goes on sale.
        When they open, they will appear here with real details — not estimates.
      </p>
      <Bn as="p" className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
        পণ্য, দাম ও ডেলিভারির তথ্য এখনো নিশ্চিত করা হচ্ছে। প্রস্তুত হলে সঠিক তথ্যসহ এখানেই পাওয়া
        যাবে।
      </Bn>

      <AppLink
        href="/contact"
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-navy/25 bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
      >
        Ask what is coming
      </AppLink>
    </div>
  );
}
