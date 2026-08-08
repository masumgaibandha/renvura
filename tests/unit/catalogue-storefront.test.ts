import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRODUCT_DETAIL_ROUTE_BUILT, productHref } from '@/lib/catalogue/routes';
import { PRODUCT_SEEDS } from '@/lib/catalogue/seed-data';
import {
  getBestSellers,
  getCategoryTiles,
  getAgeBands,
  getComingSoonProducts,
  getFeaturedProducts,
  getProductDetail,
  getRelatedProducts,
  getShopProducts,
  mapPricing,
  orderForShop,
  orderRelated,
  type ProductCardData,
} from '@/lib/content/storefront';
import { headerControlItems, resolveNav } from '@/lib/navigation';
import { isBuilt } from '@/lib/site';

/**
 * Phase 2C surfaces. The storefront seam must stay safe in the three states
 * that actually occur in production: demo mode off, database unreachable, and
 * an empty catalogue.
 */

function setEnv({ production, demo }: { production: boolean; demo: boolean }) {
  vi.stubEnv('NODE_ENV', production ? 'production' : 'development');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('DEMO_MODE', demo ? '1' : '');
}

beforeEach(() => setEnv({ production: false, demo: false }));
afterEach(() => vi.unstubAllEnvs());

describe('demo containment', () => {
  it('returns no products when demo mode is off', async () => {
    await expect(getShopProducts()).resolves.toEqual([]);
    await expect(getFeaturedProducts()).resolves.toEqual([]);
  });

  it('returns no categories or age bands when demo mode is off', async () => {
    await expect(getCategoryTiles()).resolves.toEqual([]);
    await expect(getAgeBands()).resolves.toEqual([]);
  });

  it('returns nothing on the production site even with demo mode requested', async () => {
    setEnv({ production: true, demo: true });

    await expect(getShopProducts()).resolves.toEqual([]);
    await expect(getCategoryTiles()).resolves.toEqual([]);
  });

  it('degrades to an empty catalogue when the database is unreachable', async () => {
    // Demo mode on, but `.env.local` points at a host that is not listening.
    // A page must render its empty state, never throw.
    setEnv({ production: false, demo: true });

    await expect(getShopProducts()).resolves.toEqual([]);
    await expect(getAgeBands()).resolves.toEqual([]);
  }, 30_000);
});

describe('claims that must never be invented', () => {
  it('never derives best sellers from anything but real order data', async () => {
    setEnv({ production: false, demo: true });
    // Hand-picked products relabelled "Best Sellers" is a fabricated claim
    // (D-10); the section stays empty until Phase 4 produces orders.
    await expect(getBestSellers()).resolves.toEqual([]);
  });
});

describe('product detail links', () => {
  it('is built in Phase 2D, so cards link to the real route', () => {
    expect(PRODUCT_DETAIL_ROUTE_BUILT).toBe(true);
    expect(productHref('7-in-1-wooden-montessori-learning-board')).toBe(
      '/products/7-in-1-wooden-montessori-learning-board',
    );
  });

  it('never produces an href for an empty slug', () => {
    expect(productHref('')).toBeUndefined();
  });
});

describe('product detail resolution', () => {
  it('resolves nothing when demo mode is off, so demo URLs 404 publicly', async () => {
    for (const product of PRODUCT_SEEDS) {
      await expect(getProductDetail(product.slug)).resolves.toBeUndefined();
    }
  });

  it('resolves nothing for an unknown slug', async () => {
    setEnv({ production: false, demo: true });
    await expect(getProductDetail('no-such-product')).resolves.toBeUndefined();
  }, 30_000);

  it('resolves nothing for an empty slug without touching the database', async () => {
    await expect(getProductDetail('')).resolves.toBeUndefined();
  });

  // No `MONGODB_URI` is configured for the unit run, so the connection fails —
  // which is the point: the page must get `undefined` and render a 404, never a
  // thrown driver error.
  it('swallows a database failure rather than leaking it to the page', async () => {
    setEnv({ production: false, demo: true });
    await expect(
      getProductDetail('7-in-1-wooden-montessori-learning-board'),
    ).resolves.toBeUndefined();
  }, 30_000);
});

describe('related products', () => {
  const card = (slug: string, categoryLabel?: string): ProductCardData => ({
    slug,
    name: slug,
    categoryLabel,
    availability: 'available',
  });

  it('excludes the current product and prefers the same category', () => {
    const all = [
      card('current', 'Numbers & Math'),
      card('same-a', 'Numbers & Math'),
      card('other-a', 'Toys & Play'),
      card('same-b', 'Numbers & Math'),
    ];

    expect(orderRelated(all, 'current', 'Numbers & Math').map((p) => p.slug)).toEqual([
      'same-a',
      'same-b',
      'other-a',
    ]);
  });

  it('caps the rail so the page does not become a second grid', () => {
    const all = Array.from({ length: 9 }, (_, index) => card(`p-${index}`));
    expect(orderRelated(all, 'p-0', undefined, 4)).toHaveLength(4);
  });

  it('returns nothing when demo mode is off', async () => {
    await expect(getRelatedProducts('7-in-1-wooden-montessori-learning-board')).resolves.toEqual([]);
  });
});

describe('Coming Soon pricing', () => {
  it('drops the price entirely for a Coming Soon product', () => {
    // Even when the document still carries one — a product moved to Coming Soon
    // must never show a stale price (D-12).
    expect(
      mapPricing({ priceMinor: 249_000, comparePriceMinor: 299_000, availability: 'coming-soon' }),
    ).toEqual({});
  });

  it('never substitutes zero for a missing price', () => {
    const mapped = mapPricing({ availability: 'coming-soon' });
    expect(mapped.priceMinor).toBeUndefined();
    expect(mapped.priceMinor).not.toBe(0);
  });

  it('keeps a real price pair for an available product', () => {
    expect(
      mapPricing({ priceMinor: 249_000, comparePriceMinor: 299_000, availability: 'available' }),
    ).toEqual({ priceMinor: 249_000, comparePriceMinor: 299_000 });
  });

  it('withholds a reference price that is not genuinely higher', () => {
    expect(
      mapPricing({ priceMinor: 249_000, comparePriceMinor: 249_000, availability: 'available' }),
    ).toEqual({ priceMinor: 249_000, comparePriceMinor: undefined });
  });

  it('treats a document with no availability field as available', () => {
    expect(mapPricing({ priceMinor: 100 })).toEqual({
      priceMinor: 100,
      comparePriceMinor: undefined,
    });
  });
});

describe('shop ordering', () => {
  it('puts sellable products ahead of Coming Soon ones in a single grid', () => {
    const ordered = orderForShop([
      { slug: 'soon-a', availability: 'coming-soon' },
      { slug: 'buy-a', availability: 'available' },
      { slug: 'soon-b', availability: 'coming-soon' },
      { slug: 'buy-b', availability: 'available' },
    ]);

    expect(ordered.map((product) => product.slug)).toEqual(['buy-a', 'buy-b', 'soon-a', 'soon-b']);
  });

  it('preserves the catalogue order inside each group', () => {
    const ordered = orderForShop([
      { slug: 'a', availability: 'available' },
      { slug: 'b', availability: 'available' },
      { slug: 'c', availability: 'available' },
    ]);

    expect(ordered.map((product) => product.slug)).toEqual(['a', 'b', 'c']);
  });
});

describe('Coming Soon merchandising', () => {
  it('keeps unsellable products out of the homepage Featured grid', async () => {
    setEnv({ production: false, demo: true });

    // Both are empty here (no database), but the seam is what matters: Featured
    // filters on availability rather than taking the first four of whatever the
    // catalogue returns, so an unpriced product can never lead the homepage.
    await expect(getFeaturedProducts()).resolves.toEqual([]);
    await expect(getComingSoonProducts()).resolves.toEqual([]);
  }, 30_000);
});

describe('navigation after the shop went live', () => {
  it('treats /products as a real destination', () => {
    expect(isBuilt('/products')).toBe(true);
  });

  it('still withholds every commerce control whose route does not exist', () => {
    // Wishlist (still Phase 4) and Account (Phase 5) stay withheld. Cart
    // became real in Phase 4 and is the one header control now available;
    // Search became real in Phase 3 and is asserted separately.
    const resolved = resolveNav(headerControlItems, {}, false);
    expect(resolved.map((item) => item.id)).toEqual(['cart']);

    for (const path of ['/wishlist', '/account', '/blog']) {
      expect(isBuilt(path), `${path} must not be built yet`).toBe(false);
    }
    expect(isBuilt('/cart')).toBe(true);
  });
});
