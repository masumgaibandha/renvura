import type { CatalogueQuery } from '@/lib/catalogue/discovery';
import { sortProducts } from '@/lib/catalogue/discovery';
// Statically imported: `routes.ts` is a constant and a string helper with no
// database dependency, so it costs the build nothing.
import { productHref } from '@/lib/catalogue/routes';
import type { AccentToken, CatalogueAvailability } from '@/lib/catalogue/types';

export type { AccentToken, CatalogueAvailability };

/**
 * Storefront data sources.
 *
 * The single seam every storefront component reads through. Phase 2B put real
 * protected demo records behind it; the components did not change, which is what
 * this indirection was for.
 *
 * Every function still returns an **empty collection** when demo mode is off,
 * the database is unreachable, or nothing has been created — and every consumer
 * is written against that case (§11.1.2). Production never sees demo data.
 */

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

export type ProductCardImage = {
  url: string;
  alt: string;
  /** Real intrinsic dimensions, so the card reserves space and never shifts. */
  width: number;
  height: number;
};

export type ProductCardData = {
  slug: string;
  name: string;
  /**
   * Undefined until `/products/[slug]` exists (Phase 2D). A card with no href
   * renders as non-interactive rather than as a link to nowhere (D-15).
   */
  href?: string;
  image?: ProductCardImage;
  /**
   * Minor units (poisha). **Absent** until the founder supplies a real price —
   * never zero, never estimated (D-12).
   */
  priceMinor?: number;
  comparePriceMinor?: number;
  categoryLabel?: string;
  ageLabel?: string;
  /** Derived from real data only; never hand-typed (design direction §6.2). */
  badge?: 'sale' | 'new';
  /** Undefined while no stock decision applies yet. */
  inStock?: boolean;
  /** Drives the per-product demo marker D-08 requires. */
  isDemo?: boolean;
  /**
   * `coming-soon` products carry no price at all — the mapper drops it rather
   * than trusting the document, so a stale price can never reach a card.
   */
  availability: CatalogueAvailability;
};

/**
 * Maps one product document's price fields, honestly.
 *
 * Two rules, in one place because both cards and the detail page need them:
 *  - a Coming Soon product has no price, full stop
 *  - a reference price is mapped only when it is genuinely *above* the selling
 *    price; a "was" at or below the "now" is a data error, and showing it would
 *    be a misleading claim (D-12)
 */
export function mapPricing(product: {
  priceMinor?: number | null;
  comparePriceMinor?: number | null;
  availability?: string | null;
}): { priceMinor?: number; comparePriceMinor?: number } {
  if (product.availability === 'coming-soon') return {};

  const priceMinor = product.priceMinor ?? undefined;
  const comparePriceMinor =
    typeof product.comparePriceMinor === 'number' &&
    typeof priceMinor === 'number' &&
    product.comparePriceMinor > priceMinor
      ? product.comparePriceMinor
      : undefined;

  return { priceMinor, comparePriceMinor };
}

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

/**
 * Sellable products lead; Coming Soon follows, in one continuous grid.
 *
 * Two grids under two headings would read as two unrelated catalogues, and
 * burying the products a customer can actually buy would be worse still. A
 * stable sort, so the catalogue's own order survives inside each group.
 *
 * Pure and exported so the ordering is testable without a database.
 */
export function orderForShop<T extends { availability?: string | null }>(products: T[]): T[] {
  const rank = (value?: string | null) => (value === 'coming-soon' ? 1 : 0);
  return [...products].sort((a, b) => rank(a.availability) - rank(b.availability));
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
 * Every product the shop can currently show.
 *
 * In Phase 2C that is the protected demo catalogue: five draft records that
 * `listDemoCatalogueProducts()` returns only in demo mode. When real products
 * are published this switches to `listStorefrontProducts()` with no change to
 * any component.
 */
export async function getShopProducts(): Promise<ProductCardData[]> {
  return fromCatalogue(async () => {
    const { listDemoCatalogueProducts } = await import('@/lib/catalogue/repository');
    const [products, categoryNames] = await Promise.all([
      listDemoCatalogueProducts(),
      categoryNameIndex(),
    ]);

    return orderForShop(products).map((product) => toProductCard(product, categoryNames));
  });
}

/** `_id` → display name, so a card never triggers a per-product lookup. */
async function categoryNameIndex(): Promise<Map<string, string>> {
  const { listActiveCategories } = await import('@/lib/catalogue/repository');
  const categories = await listActiveCategories();
  return new Map(categories.map((category) => [String(category._id), category.name]));
}

/**
 * One product document → one card.
 *
 * The single mapper every listing surface shares — shop, category, age, search
 * and the related rail. That is what guarantees a product looks and behaves
 * identically wherever it appears, and that a rule like "Coming Soon has no
 * price" cannot be forgotten on one page.
 */
function toProductCard(
  product: {
    slug?: string | null;
    name?: string | null;
    images?: { url?: string | null; alt?: string | null; width?: number | null; height?: number | null; isPrimary?: boolean | null }[] | null;
    priceMinor?: number | null;
    comparePriceMinor?: number | null;
    category?: unknown;
    isDemo?: boolean | null;
    availability?: string | null;
  },
  categoryNames: Map<string, string>,
): ProductCardData {
  const images = product.images ?? [];
  const primary = images.find((image) => image.isPrimary) ?? images[0];

  return {
    slug: product.slug ?? '',
    name: product.name ?? 'Untitled product',
    href: productHref(product.slug ?? ''),
    image:
      primary?.url && primary.width && primary.height
        ? { url: primary.url, alt: primary.alt ?? '', width: primary.width, height: primary.height }
        : undefined,
    ...mapPricing(product),
    // No badge or stock state is mapped: neither is verified data, and a
    // discount badge derived from the price pair is a promotional claim the
    // founder has not made.
    categoryLabel: product.category ? categoryNames.get(String(product.category)) : undefined,
    isDemo: product.isDemo === true,
    availability: (product.availability ?? 'available') as CatalogueAvailability,
  };
}


/* -------------------------------------------------------------------------- */
/* Discovery (Phase 3)                                                         */
/* -------------------------------------------------------------------------- */

export type CategoryNode = {
  slug: string;
  name: string;
  href: string;
  description?: string;
  accentToken: AccentToken;
  children: CategoryNode[];
};

/**
 * The category tree, two levels deep, built from one query.
 *
 * Parents first, children nested — the shape both the desktop menu and the
 * mobile drawer render directly, so neither has to walk the flat list itself.
 * A category whose parent is missing or inactive is promoted to the top rather
 * than silently dropped: an orphan is a data problem, not a reason to hide a
 * shelf that has products in it.
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  return fromCatalogue(async () => {
    const { listActiveCategories } = await import('@/lib/catalogue/repository');
    const categories = await listActiveCategories();

    const node = (category: (typeof categories)[number]): CategoryNode => ({
      slug: category.slug,
      name: category.name,
      href: `/category/${category.slug}`,
      description: category.description ?? undefined,
      accentToken: (category.accentToken ?? 'soft-sky') as AccentToken,
      children: [],
    });

    const byId = new Map(categories.map((category) => [String(category._id), node(category)]));
    const roots: CategoryNode[] = [];

    for (const category of categories) {
      const self = byId.get(String(category._id))!;
      const parent = category.parent ? byId.get(String(category.parent)) : undefined;

      if (parent) parent.children.push(self);
      else roots.push(self);
    }

    return roots;
  });
}

export type CategoryDetail = {
  slug: string;
  name: string;
  description?: string;
  /** Present only for a child category — used for the breadcrumb. */
  parent?: { slug: string; name: string; href: string };
  children: { slug: string; name: string; href: string }[];
};

/** One category by slug, with the parent and children a page needs. */
export async function getCategory(slug: string): Promise<CategoryDetail | undefined> {
  const { demoModeEnabled } = await import('@/lib/catalogue/demo');
  if (!demoModeEnabled()) return undefined;

  try {
    const { listActiveCategories } = await import('@/lib/catalogue/repository');
    const categories = await listActiveCategories();

    const self = categories.find((category) => category.slug === slug);
    if (!self) return undefined;

    const parent = self.parent
      ? categories.find((category) => String(category._id) === String(self.parent))
      : undefined;

    return {
      slug: self.slug,
      name: self.name,
      description: self.description ?? undefined,
      parent: parent
        ? { slug: parent.slug, name: parent.name, href: `/category/${parent.slug}` }
        : undefined,
      children: categories
        .filter((category) => String(category.parent ?? '') === String(self._id))
        .map((category) => ({
          slug: category.slug,
          name: category.name,
          href: `/category/${category.slug}`,
        })),
    };
  } catch {
    return undefined;
  }
}

export type CatalogueResult = {
  products: ProductCardData[];
  /** How many products the query actually matched. Truthful, never padded. */
  total: number;
};

/**
 * The one filtered, sorted catalogue read — used by the shop, category pages
 * and search alike.
 *
 * A category filter matches the category **and every descendant of it**: opening
 * "Learning & Educational" shows the products filed under Activity & Matching,
 * Sorting & Fine Motor and Numbers & Math, because a parent shelf that appears
 * empty while its children hold nine products is simply broken. Products are
 * never assigned to a parent to make this work — the expansion happens here.
 */
export async function getCatalogue(query: CatalogueQuery): Promise<CatalogueResult> {
  const empty: CatalogueResult = { products: [], total: 0 };

  const { demoModeEnabled } = await import('@/lib/catalogue/demo');
  if (!demoModeEnabled()) return empty;

  try {
    const {
      listActiveCategories,
      queryDemoCatalogueProducts,
      findCategoryIdsMatchingTerms,
    } = await import('@/lib/catalogue/repository');

    const categories = await listActiveCategories();
    const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));

    let categoryIds: string[] | undefined;
    if (query.category) {
      const self = categories.find((category) => category.slug === query.category);
      // An unknown slug must match nothing rather than everything — filtering
      // by a category that does not exist is a zero-result state, not "all".
      categoryIds = self ? [String(self._id), ...descendantIds(categories, String(self._id))] : [];
    }

    const termCategoryIds = await findCategoryIdsMatchingTerms(query.terms);

    const products = await queryDemoCatalogueProducts({
      categoryIds,
      availability: query.availability,
      terms: query.terms,
      termCategoryIds,
    });

    const cards = products.map((product) => toProductCard(product, categoryNames));

    return { products: sortProducts(cards, query.sort), total: cards.length };
  } catch {
    return empty;
  }
}

/** Every category beneath `rootId`, at any depth the schema allows. */
function descendantIds(
  categories: { _id: unknown; parent?: unknown }[],
  rootId: string,
): string[] {
  const direct = categories
    .filter((category) => String(category.parent ?? '') === rootId)
    .map((category) => String(category._id));

  return direct.flatMap((id) => [id, ...descendantIds(categories, id)]);
}

export type AgeBandDetail = {
  slug: string;
  label: string;
  minMonths: number;
  maxMonths: number;
};

/** One age band by slug. */
export async function getAgeBand(slug: string): Promise<AgeBandDetail | undefined> {
  const { demoModeEnabled } = await import('@/lib/catalogue/demo');
  if (!demoModeEnabled()) return undefined;

  try {
    const { findAgeBandBySlug } = await import('@/lib/catalogue/repository');
    const band = await findAgeBandBySlug(slug);
    if (!band) return undefined;

    return {
      slug: band.slug,
      label: band.label,
      minMonths: band.minMonths,
      maxMonths: band.maxMonths,
    };
  } catch {
    return undefined;
  }
}

/**
 * Products whose **verified** age range intersects a band.
 *
 * Today this is always empty: no product carries an `ageRange`, because no age
 * suitability has been assessed and supplier listing claims are non-probative
 * (§7.2, D-16). The query is real, so the day a founder-approved assignment
 * exists the page fills in with no redesign — but nothing here invents a
 * relationship to make the page look populated.
 */
export async function getProductsForAgeBand(band: AgeBandDetail): Promise<ProductCardData[]> {
  return fromCatalogue(async () => {
    const { listProductsForAgeRange, listActiveCategories } = await import(
      '@/lib/catalogue/repository'
    );

    const [products, categories] = await Promise.all([
      listProductsForAgeRange(band.minMonths, band.maxMonths),
      listActiveCategories(),
    ]);

    const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));
    return orderForShop(products).map((product) => toProductCard(product, categoryNames));
  });
}

/** Whether any product has an approved age assignment yet. Gates the age nav. */
export async function hasAgeAssignments(): Promise<boolean> {
  try {
    const { countProductsWithAgeRange } = await import('@/lib/catalogue/repository');
    return (await countProductsWithAgeRange()) > 0;
  } catch {
    return false;
  }
}

export type ProductVideo = { url: string; title?: string; posterUrl?: string };

/** Everything the detail page renders. Nothing here is derived or invented. */
export type ProductDetailData = {
  slug: string;
  name: string;
  categoryLabel?: string;
  priceMinor?: number;
  comparePriceMinor?: number;
  shortDescription?: string;
  /** Split on blank lines; the seed stores prose with `\n\n` breaks. */
  descriptionParagraphs: string[];
  descriptionBnParagraphs: string[];
  /** Visible, factual contents — "what is in the box". */
  features: string[];
  /** Spec rows. Empty unless real attributes exist; never invented. */
  specifications: { label: string; value: string }[];
  images: ProductCardImage[];
  video?: ProductVideo;
  isDemo: boolean;
  status: string;
  availability: CatalogueAvailability;
};

const paragraphsOf = (text: string | null | undefined): string[] =>
  typeof text === 'string' ? text.split('\n\n').map((p) => p.trim()).filter(Boolean) : [];

/**
 * One product, for `/products/[slug]`.
 *
 * Resolves a real published product first; falls back to the demo catalogue,
 * which returns nothing unless demo mode is on. Returns `undefined` for an
 * unknown slug, a draft, or a database failure — the page turns that into a
 * genuine 404 rather than leaking an internal error.
 */
export async function getProductDetail(slug: string): Promise<ProductDetailData | undefined> {
  if (slug === '') return undefined;

  try {
    const { findProductBySlug, findDemoProductBySlug, listActiveCategories } = await import(
      '@/lib/catalogue/repository'
    );

    const product = (await findProductBySlug(slug)) ?? (await findDemoProductBySlug(slug));
    if (!product) return undefined;

    const categories = await listActiveCategories();
    const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));

    const attributes = product.attributes ?? [];
    const primary = (product.images ?? []).find((i) => i.isPrimary) ?? (product.images ?? [])[0];
    const video = (product.videos ?? [])[0];

    return {
      slug: product.slug ?? '',
      name: product.name ?? '',
      categoryLabel: product.category ? categoryNames.get(String(product.category)) : undefined,
      ...mapPricing(product),
      shortDescription: product.shortDescription ?? undefined,
      descriptionParagraphs: paragraphsOf(product.description),
      descriptionBnParagraphs: paragraphsOf(product.descriptionBn),
      features: attributes
        .filter((a) => a.key === 'feature' && typeof a.value === 'string')
        .map((a) => a.value as string),
      // Only genuine attribute rows. The demo records carry none, so the
      // specifications section is absent rather than empty (§8.4).
      specifications: attributes
        .filter((a) => a.key !== 'feature' && a.labelEn && a.value)
        .map((a) => ({
          label: a.labelEn as string,
          value: `${a.value}${a.unit ? ` ${a.unit}` : ''}`,
        })),
      images: (product.images ?? [])
        .filter((i) => i.url && i.width && i.height)
        .map((i) => ({
          url: i.url as string,
          alt: i.alt ?? '',
          width: i.width as number,
          height: i.height as number,
        })),
      video: video?.url
        ? { url: video.url, title: video.title ?? undefined, posterUrl: primary?.url ?? undefined }
        : undefined,
      isDemo: product.isDemo === true,
      status: product.status ?? 'draft',
      availability: (product.availability ?? 'available') as CatalogueAvailability,
    };
  } catch {
    return undefined;
  }
}

/**
 * A short related rail — same category first, then anything else.
 *
 * Deliberately not a recommendation engine: with a five-product catalogue,
 * "same category, then the rest" is the honest ordering and anything cleverer
 * would be inventing signal that does not exist.
 */
export async function getRelatedProducts(
  slug: string,
  categoryLabel?: string,
  limit = 4,
): Promise<ProductCardData[]> {
  return orderRelated(await getShopProducts(), slug, categoryLabel, limit);
}

/**
 * The ordering itself, kept pure so it is testable without a database: current
 * product removed, same category first, capped.
 */
export function orderRelated(
  all: ProductCardData[],
  slug: string,
  categoryLabel?: string,
  limit = 4,
): ProductCardData[] {
  const others = all.filter((product) => product.slug !== slug);

  const sameCategory = others.filter((product) => product.categoryLabel === categoryLabel);
  const rest = others.filter((product) => product.categoryLabel !== categoryLabel);

  return [...sameCategory, ...rest].slice(0, limit);
}

/**
 * Founder-curated products for the homepage grid.
 *
 * Named "featured", never "best sellers": a hand-picked grid labelled as best
 * selling is a fabricated claim until real completed-order data exists (D-10).
 */
export async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const products = await getShopProducts();
  // Sellable products only. A Featured grid is a buying prompt, and putting a
  // product nobody can order at the top of the homepage wastes the strongest
  // position on the page.
  return products.filter((product) => product.availability === 'available').slice(0, 4);
}

/**
 * A short Coming Soon preview for the homepage.
 *
 * Restrained on purpose: four products, below the sellable merchandising, so
 * the page still leads with what a customer can buy. It is honest signal —
 * "the catalogue is growing" — not a second storefront.
 */
export async function getComingSoonProducts(limit = 4): Promise<ProductCardData[]> {
  const products = await getShopProducts();
  return products.filter((product) => product.availability === 'coming-soon').slice(0, limit);
}

/** New arrivals grid. Needs a real published-at ordering; empty until then. */
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
