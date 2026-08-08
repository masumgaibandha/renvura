import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogueEmptyState } from '@/components/commerce/CatalogueEmptyState';
import { ProductGrid } from '@/components/commerce/ProductGrid';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { DEFAULT_SORT, parseCatalogueQuery, type RawSearchParams } from '@/lib/catalogue/discovery';
import { getCatalogue, getCategory } from '@/lib/content/storefront';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * Category browsing — `/category/[slug]`.
 *
 * A **parent category shows everything beneath it.** Opening "Learning &
 * Educational" lists the products filed under Activity & Matching, Sorting &
 * Fine Motor and Numbers & Math; the products are not also assigned to the
 * parent to make that work — `getCatalogue()` expands the slug to its
 * descendants. A child category shows only its own.
 *
 * No filter toolbar here, deliberately. A shelf holds two or three products;
 * offering to filter it further is a control that cannot change the outcome
 * (§11.1.1, §21). Discovery controls live on `/products`, where there is a
 * catalogue to sift.
 *
 * Dynamic rather than statically generated: `generateStaticParams` would need a
 * database at build time, and the build's independence from Mongo is a kept
 * Phase 1 invariant (D-15).
 */
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return buildMetadata({ path: `/category/${slug}`, title: 'Category not found', noindex: true });
  }

  return buildMetadata({
    // Canonical is always the bare category path — a sorted view of a shelf is
    // the same page, not a new one.
    path: `/category/${category.slug}`,
    title: category.name,
    description: category.description,
    // Every product in the catalogue is a protected demo draft, so no category
    // page may be indexed yet (D-08). This becomes conditional on real
    // published products, not on the category itself.
    noindex: true,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  // Unknown slug, inactive category, demo mode off, or an unreachable database:
  // all of them are a genuine 404 rather than an empty shelf for a category
  // that does not exist.
  if (!category) notFound();

  // Sort is honoured if a link carried one; there is no control to set it here.
  const query = parseCatalogueQuery(await searchParams);
  const { products, total } = await getCatalogue({
    ...query,
    category: category.slug,
    sort: query.sort ?? DEFAULT_SORT,
    terms: [],
  });

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <Breadcrumb category={category} />

        <header className="mt-5 max-w-2xl">
          <h1 className="font-display text-[1.875rem] leading-[1.15] text-ink sm:text-[2.5rem]">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-4 text-base leading-relaxed text-ink-muted">{category.description}</p>
          ) : null}
          {/* A count only where it is truthful and adds something. Suppressed at
              zero, where the empty state below says it better. */}
          {total > 0 ? (
            <p className="mt-3 text-xs text-ink-muted">
              {total === 1 ? '1 product' : `${total} products`}
            </p>
          ) : null}
        </header>

        {category.children.length > 0 ? (
          <nav aria-label={`${category.name} subcategories`} className="mt-6">
            <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
              {category.children.map((child) => (
                <li key={child.slug} className="shrink-0">
                  <AppLink
                    href={child.href}
                    className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3.5 text-[0.8125rem] font-medium text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
                  >
                    {child.name}
                  </AppLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-8 sm:mt-10">
          {products.length > 0 ? (
            <ProductGrid products={products} aria-label={`${category.name} products`} />
          ) : (
            <CatalogueEmptyState
              title={`Nothing in ${category.name} yet.`}
              body="This part of the catalogue is still being put together. Everything that is ready is on the main shop page."
              actions={[
                { label: 'View all products', href: '/products', primary: true },
                { label: 'Ask what is coming', href: '/contact' },
              ]}
            />
          )}
        </div>
      </Container>
    </div>
  );
}

/** Shop → parent (when there is one) → this category. */
function Breadcrumb({
  category,
}: {
  category: { name: string; parent?: { name: string; href: string } };
}) {
  return (
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

        {category.parent ? (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <AppLink
                href={category.parent.href}
                className="inline-flex min-h-11 items-center rounded transition-colors hover:text-ink"
              >
                {category.parent.name}
              </AppLink>
            </li>
          </>
        ) : null}

        <li aria-hidden="true">/</li>
        <li className="truncate" aria-current="page">
          {category.name}
        </li>
      </ol>
    </nav>
  );
}
