import type { QueryFilter, Types } from 'mongoose';
import { demoModeEnabled, demoVisibilityFilter } from '@/lib/catalogue/demo';
import { connectToDatabase } from '@/lib/db/mongoose';
import { AgeBand, type AgeBandDoc } from '@/lib/models/AgeBand';
import { Category, type CategoryDoc } from '@/lib/models/Category';
import { Collection, type CollectionDoc } from '@/lib/models/Collection';
import { Product, type ProductDoc } from '@/lib/models/Product';

/**
 * Catalogue data access.
 *
 * Exists for one reason: **the storefront visibility rules are enforced in a
 * single place.** A draft product must 404 to the public, an archived product
 * must leave discovery but keep its URL, and a demo product must not exist
 * outside demo mode (§7.1, D-08). Re-deriving that filter at each call site is
 * how a draft eventually leaks into a listing.
 *
 * This is the seam Phase 2B builds on. `src/lib/content/storefront.ts` keeps its
 * current empty returns until then — there are still no products, and inventing
 * some is exactly what §11.1.2 forbids.
 *
 * Every function connects on demand. Nothing runs at import time, which is what
 * keeps `npm run build` independent of a live database.
 */

/**
 * `InferSchemaType` describes the schema's own fields and omits `_id`, which
 * lean reads always return and callers need for reference lookups.
 */
export type WithId<T> = T & { _id: Types.ObjectId };

export type ProductRecord = WithId<ProductDoc>;
export type CategoryRecord = WithId<CategoryDoc>;
export type AgeBandRecord = WithId<AgeBandDoc>;
export type CollectionRecord = WithId<CollectionDoc>;

/** Publicly listable: active, and demo-visible only when demo mode is on. */
export function storefrontProductFilter(): QueryFilter<ProductDoc> {
  return { status: 'active', ...demoVisibilityFilter() } as QueryFilter<ProductDoc>;
}

/**
 * Reachable by direct URL: active **or** archived.
 *
 * Archived products keep their URL alive so historical order links and inbound
 * links do not 404 — they are marked unavailable and `noindex`, but they leave
 * discovery entirely (§7.1). Drafts are absent from both filters.
 */
export function reachableProductFilter(): QueryFilter<ProductDoc> {
  return {
    status: { $in: ['active', 'archived'] },
    ...demoVisibilityFilter(),
  } as QueryFilter<ProductDoc>;
}

export type ProductListOptions = {
  limit?: number;
  skip?: number;
  /** Extra constraints, already trusted — merged after the visibility rules. */
  where?: QueryFilter<ProductDoc>;
};

/** Listing query. Pagination, never infinite scroll (design direction §8.3). */
export async function listStorefrontProducts({
  limit = 24,
  skip = 0,
  where = {},
}: ProductListOptions = {}): Promise<ProductRecord[]> {
  await connectToDatabase();

  return Product.find({ ...storefrontProductFilter(), ...where })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 100))
    .lean<ProductRecord[]>()
    .exec();
}

/** Detail lookup. Returns archived products too, so their URLs keep working. */
export async function findProductBySlug(slug: string): Promise<ProductRecord | null> {
  await connectToDatabase();

  return Product.findOne({ ...reachableProductFilter(), slug })
    .lean<ProductRecord | null>()
    .exec();
}

export async function listProductsByCategory(
  categoryId: string,
  options: ProductListOptions = {},
): Promise<ProductRecord[]> {
  return listStorefrontProducts({
    ...options,
    where: { $or: [{ category: categoryId }, { categories: categoryId }] } as QueryFilter<ProductDoc>,
  });
}

/**
 * Products whose declared age range intersects a band.
 *
 * Membership is derived from months, never stored as a band reference, so
 * re-banding never requires re-tagging a product (§3.3).
 */
export async function listProductsForAgeRange(
  minMonths: number,
  maxMonths: number,
  options: ProductListOptions = {},
): Promise<ProductRecord[]> {
  return listStorefrontProducts({
    ...options,
    where: {
      'ageRange.minMonths': { $lte: maxMonths },
      'ageRange.maxMonths': { $gte: minMonths },
    } as QueryFilter<ProductDoc>,
  });
}

export async function listFeaturedProducts(limit = 8): Promise<ProductRecord[]> {
  return listStorefrontProducts({ limit, where: { isFeatured: true } as QueryFilter<ProductDoc> });
}

/**
 * How many demo products are currently active.
 *
 * Feeds `assertNoActiveDemoData()` — the production guard and the launch-gate
 * check that demo data has actually been purged (D-08, §11.2).
 */
export async function countActiveDemoProducts(): Promise<number> {
  await connectToDatabase();
  return Product.countDocuments({ isDemo: true, status: 'active' }).exec();
}

/**
 * The demo catalogue, for development surfaces only.
 *
 * Seeded products are **drafts**, so `listStorefrontProducts()` correctly never
 * returns them. This is the separate, explicitly demo-gated seam the Phase 2C
 * UI task uses to exercise real product components against real records —
 * without weakening the public filter by one condition.
 *
 * Returns nothing unless demo mode is on, which is impossible in production.
 */
export async function listDemoCatalogueProducts(limit = 24): Promise<ProductRecord[]> {
  if (!demoModeEnabled()) return [];

  await connectToDatabase();
  return Product.find({ isDemo: true })
    .sort({ createdAt: 1 })
    .limit(Math.min(limit, 100))
    .lean<ProductRecord[]>()
    .exec();
}

/**
 * One demo product by slug, for the development detail page.
 *
 * The companion to `listDemoCatalogueProducts()`: seeded products are drafts,
 * which `findProductBySlug()` deliberately excludes because a draft must 404 to
 * the public (§7.1). Rather than loosen that filter, this is a separate,
 * explicitly demo-gated lookup that returns nothing outside demo mode.
 */
export async function findDemoProductBySlug(slug: string): Promise<ProductRecord | null> {
  if (!demoModeEnabled()) return null;

  await connectToDatabase();
  return Product.findOne({ isDemo: true, slug })
    .lean<ProductRecord | null>()
    .exec();
}

/**
 * The demo catalogue, filtered — the Phase 3 discovery query.
 *
 * Filtering happens **in the database**, not in the browser and not by pulling
 * every record and discarding most of it. Search is a case-insensitive regex
 * across the customer-facing fields only; ordering is applied afterwards by the
 * pure `sortProducts()`, because "a missing price is not zero" is a presentation
 * rule that deserves to be readable and unit-testable rather than buried in a
 * `$cond` (§9 balance: real queries, no aggregation pipeline for eleven rows).
 *
 * **`compliance` and `evidence` are never searched.** Those hold supplier
 * claims and internal notes; matching a product because its unverified evidence
 * mentions a word would surface exactly the information §7.2 keeps off the
 * storefront.
 */
export type CatalogueFilter = {
  /** Category ids to match, already expanded to include descendants. */
  categoryIds?: string[];
  availability?: string;
  /** Normalised search terms. Every term must match somewhere (AND). */
  terms?: string[];
  /** Category ids whose *name* matched a term, so a term can hit a category. */
  termCategoryIds?: string[];
};

/** Escapes a user term so it is matched literally, never as a pattern. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function queryDemoCatalogueProducts(
  filter: CatalogueFilter = {},
  limit = 60,
): Promise<ProductRecord[]> {
  if (!demoModeEnabled()) return [];

  await connectToDatabase();

  const where: Record<string, unknown>[] = [];

  // An **empty** list is a filter that matches nothing, not an absent filter.
  // `undefined` means "no category filter"; `[]` means "a category was asked
  // for and no such category exists", which must be a zero-result state rather
  // than silently showing the whole catalogue under a stale category link.
  if (filter.categoryIds !== undefined) {
    where.push({
      $or: [{ category: { $in: filter.categoryIds } }, { categories: { $in: filter.categoryIds } }],
    });
  }

  if (filter.availability) where.push({ availability: filter.availability });

  for (const term of filter.terms ?? []) {
    const pattern = new RegExp(escapeRegExp(term), 'i');
    const clauses: Record<string, unknown>[] = [
      { name: pattern },
      { shortDescription: pattern },
      { description: pattern },
      { searchAliases: pattern },
    ];

    // A term that named a category matches every product in it, so "math"
    // finds the Numbers & Math shelf even where the word is not in the copy.
    if (filter.termCategoryIds && filter.termCategoryIds.length > 0) {
      clauses.push({ category: { $in: filter.termCategoryIds } });
    }

    where.push({ $or: clauses });
  }

  return Product.find({ isDemo: true, ...(where.length > 0 ? { $and: where } : {}) })
    .sort({ createdAt: 1 })
    .limit(Math.min(limit, 100))
    .lean<ProductRecord[]>()
    .exec();
}

/**
 * Category ids whose name, Bangla name or alias matches any of the terms.
 *
 * One extra query rather than a per-product lookup — the category set is tiny
 * and fetched once, so this never becomes an N+1.
 */
export async function findCategoryIdsMatchingTerms(terms: string[]): Promise<string[]> {
  if (terms.length === 0) return [];

  const categories = await listActiveCategories();

  return categories
    .filter((category) => {
      const haystack = [category.name, category.nameBn ?? '', ...(category.searchAliases ?? [])]
        .join(' ')
        .toLowerCase();
      return terms.some((term) => haystack.includes(term));
    })
    .map((category) => String(category._id));
}

/** One active category by slug, or null. */
export async function findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
  await connectToDatabase();
  return Category.findOne({ slug, isActive: true }).lean<CategoryRecord | null>().exec();
}

/** One active age band by slug, or null. */
export async function findAgeBandBySlug(slug: string): Promise<AgeBandRecord | null> {
  await connectToDatabase();
  return AgeBand.findOne({ slug, isActive: true }).lean<AgeBandRecord | null>().exec();
}

/**
 * How many demo products carry a verified age range.
 *
 * Gates the "Shop by Age" navigation on **assignments**, not on the existence of
 * bands. Bands are configured; assignments are a founder decision that has not
 * been made, and a menu of five links to five empty pages is a dead control
 * wearing a useful label (D-15, §11.1.1).
 */
export async function countProductsWithAgeRange(): Promise<number> {
  if (!demoModeEnabled()) return 0;

  await connectToDatabase();
  return Product.countDocuments({ isDemo: true, 'ageRange.minMonths': { $exists: true } }).exec();
}

/** Removes every demo record. The "one admin action" D-08 requires. */
export async function purgeDemoProducts(): Promise<number> {
  await connectToDatabase();
  const result = await Product.deleteMany({ isDemo: true }).exec();
  return result.deletedCount ?? 0;
}

/* -------------------------------------------------------------------------- */
/* Navigation datasets                                                         */
/* -------------------------------------------------------------------------- */

export async function listActiveCategories(): Promise<CategoryRecord[]> {
  await connectToDatabase();
  return Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<CategoryRecord[]>()
    .exec();
}

export async function listActiveAgeBands(): Promise<AgeBandRecord[]> {
  await connectToDatabase();
  return AgeBand.find({ isActive: true })
    .sort({ minMonths: 1 })
    .lean<AgeBandRecord[]>()
    .exec();
}

export async function listActiveCollections(): Promise<CollectionRecord[]> {
  await connectToDatabase();
  return Collection.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<CollectionRecord[]>()
    .exec();
}
