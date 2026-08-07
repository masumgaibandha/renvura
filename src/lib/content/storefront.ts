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

/** Supporting pastel tokens a category or age band may be tinted with (D-06). */
export type AccentToken =
  | 'soft-sky'
  | 'soft-mint'
  | 'soft-blush'
  | 'soft-lavender'
  | 'soft-sunshine';

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

/** Top-level categories for the "Shop by category" rail. Phase 2 populates this. */
export async function getCategoryTiles(): Promise<CategoryTile[]> {
  return [];
}

/** Age bands for the "Shop by age" rail. Phase 2 populates this. */
export async function getAgeBands(): Promise<AgeBandPill[]> {
  return [];
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
