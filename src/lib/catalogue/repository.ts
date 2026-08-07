import type { QueryFilter } from 'mongoose';
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
}: ProductListOptions = {}): Promise<ProductDoc[]> {
  await connectToDatabase();

  return Product.find({ ...storefrontProductFilter(), ...where })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 100))
    .lean<ProductDoc[]>()
    .exec();
}

/** Detail lookup. Returns archived products too, so their URLs keep working. */
export async function findProductBySlug(slug: string): Promise<ProductDoc | null> {
  await connectToDatabase();

  return Product.findOne({ ...reachableProductFilter(), slug })
    .lean<ProductDoc | null>()
    .exec();
}

export async function listProductsByCategory(
  categoryId: string,
  options: ProductListOptions = {},
): Promise<ProductDoc[]> {
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
): Promise<ProductDoc[]> {
  return listStorefrontProducts({
    ...options,
    where: {
      'ageRange.minMonths': { $lte: maxMonths },
      'ageRange.maxMonths': { $gte: minMonths },
    } as QueryFilter<ProductDoc>,
  });
}

export async function listFeaturedProducts(limit = 8): Promise<ProductDoc[]> {
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
export async function listDemoCatalogueProducts(limit = 24): Promise<ProductDoc[]> {
  if (!demoModeEnabled()) return [];

  await connectToDatabase();
  return Product.find({ isDemo: true })
    .sort({ createdAt: 1 })
    .limit(Math.min(limit, 100))
    .lean<ProductDoc[]>()
    .exec();
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

export async function listActiveCategories(): Promise<CategoryDoc[]> {
  await connectToDatabase();
  return Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<CategoryDoc[]>()
    .exec();
}

export async function listActiveAgeBands(): Promise<AgeBandDoc[]> {
  await connectToDatabase();
  return AgeBand.find({ isActive: true })
    .sort({ minMonths: 1 })
    .lean<AgeBandDoc[]>()
    .exec();
}

export async function listActiveCollections(): Promise<CollectionDoc[]> {
  await connectToDatabase();
  return Collection.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<CollectionDoc[]>()
    .exec();
}
