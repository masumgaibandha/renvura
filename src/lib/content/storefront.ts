/**
 * Storefront data sources.
 *
 * Phase 1 deliberately returns **empty** collections. Categories, age bands and
 * products are Phase 2 decisions (D-15, §11.1.2) and must not be invented here:
 * no sample categories, no placeholder age bands, no demo products.
 *
 * Every consumer is therefore written against a dataset that may legitimately be
 * empty, which is exactly the behaviour Phase 2 needs when the founder's real
 * catalogue is still partial. Phase 2 replaces the bodies of these functions
 * with MongoDB queries; no calling component changes.
 */

/**
 * Supporting pastel tokens a category or age band may be tinted with (D-06).
 * Canonically defined alongside the models, so the stored `accentToken` and the
 * rendered one cannot drift apart.
 */
import type { AccentToken } from '@/lib/catalogue/types';

export type { AccentToken };

export type CategoryTile = {
  slug: string;
  name: string;
  href: string;
  imageUrl?: string;
  accentToken: AccentToken;
};

export type AgeBandPill = {
  slug: string;
  label: string;
  href: string;
  /** Inclusive month bounds. Bands must be contiguous and non-overlapping (§3.3). */
  minMonths: number;
  maxMonths: number;
  accentToken: AccentToken;
};

export type ProductCardData = {
  slug: string;
  name: string;
  href: string;
  imageUrl?: string;
  imageAlt: string;
  /** Minor units (poisha). Formatted at the edge; never invented. */
  priceMinor: number;
  comparePriceMinor?: number;
  categoryLabel?: string;
  ageLabel?: string;
  badge?: 'sale' | 'new';
  inStock: boolean;
};

/**
 * Reads the catalogue only when demo mode is on, and never lets a database
 * problem break a page.
 *
 * Two invariants depend on this wrapper:
 *  - `npm run build` must not require a live MongoDB (D-15 "must be kept").
 *    Demo mode is off by default and impossible in production, so a normal
 *    build never opens a connection.
 *  - A slow or unreachable development database degrades to an empty section,
 *    which every consumer already renders correctly (§11.1.2).
 */
async function fromCatalogue<T>(read: () => Promise<T[]>): Promise<T[]> {
  const { demoModeEnabled } = await import('@/lib/catalogue/demo');
  if (!demoModeEnabled()) return [];

  try {
    return await read();
  } catch {
    return [];
  }
}

/** Top-level categories for the "Shop by category" rail. */
export async function getCategoryTiles(): Promise<CategoryTile[]> {
  return fromCatalogue(async () => {
    const { listActiveCategories } = await import('@/lib/catalogue/repository');
    const categories = await listActiveCategories();

    // Only top-level categories reach the homepage rail; children belong to the
    // category page's own navigation (design direction §8.1).
    return categories
      .filter((category) => category.parent === null || category.parent === undefined)
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        href: `/category/${category.slug}`,
        imageUrl: category.image?.url ?? undefined,
        accentToken: (category.accentToken ?? 'soft-sky') as AccentToken,
      }));
  });
}

/** Age bands for the "Shop by age" rail. */
export async function getAgeBands(): Promise<AgeBandPill[]> {
  return fromCatalogue(async () => {
    const { listActiveAgeBands } = await import('@/lib/catalogue/repository');
    const bands = await listActiveAgeBands();

    return bands.map((band) => ({
      slug: band.slug,
      label: band.label,
      href: `/age/${band.slug}`,
      minMonths: band.minMonths,
      maxMonths: band.maxMonths,
      accentToken: (band.accentToken ?? 'soft-sky') as AccentToken,
    }));
  });
}

/**
 * Founder-curated products for the homepage grid.
 *
 * Named "featured", never "best sellers": a hand-picked grid labelled as best
 * selling is a fabricated claim until real completed-order data exists (D-10).
 */
export async function getFeaturedProducts(): Promise<ProductCardData[]> {
  return [];
}

/** New arrivals grid. Phase 2 populates this. */
export async function getNewArrivals(): Promise<ProductCardData[]> {
  return [];
}

/**
 * Best sellers, derived from completed-order data only.
 *
 * Stays empty until Phase 4 produces real orders. It is never seeded and never
 * back-filled from the featured list.
 */
export async function getBestSellers(): Promise<ProductCardData[]> {
  return [];
}

/** Published articles for the homepage. Phase 9 populates this. */
export async function getHelpfulArticles(): Promise<
  { slug: string; title: string; href: string; excerpt: string }[]
> {
  return [];
}

/**
 * Published customer reviews.
 *
 * Absent until real reviews exist — no seeded testimonials, ever (D-12).
 */
export async function getCustomerReviews(): Promise<
  { id: string; author: string; rating: number; body: string }[]
> {
  return [];
}
