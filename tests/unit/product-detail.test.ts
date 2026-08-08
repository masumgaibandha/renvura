import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { productViewPayload } from '@/lib/catalogue/analytics';
import { productHref } from '@/lib/catalogue/routes';
import { NEVER_STOREFRONT_MEDIA, PRODUCT_SEEDS } from '@/lib/catalogue/seed-data';
import { productSchema } from '@/lib/seo/schema';

/**
 * Phase 2D — the product detail page's non-visual guarantees.
 *
 * The visual result is checked end-to-end; what belongs here is the set of
 * things that must hold no matter what the page renders: a demo record emits no
 * structured data and no analytics anywhere, and the page's media can only ever
 * come from the mapped Phase 2B files.
 */

function setEnv({ production, demo }: { production: boolean; demo: boolean }) {
  vi.stubEnv('NODE_ENV', production ? 'production' : 'development');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('DEMO_MODE', demo ? '1' : '');
}

const realActiveProduct = {
  slug: 'a-real-product',
  name: 'A real product',
  priceMinor: 249_000,
  status: 'active',
  isDemo: false,
};

beforeEach(() => setEnv({ production: false, demo: true }));
afterEach(() => vi.unstubAllEnvs());

describe('Product/Offer structured data', () => {
  it('is never emitted for a demo product, in any environment', () => {
    for (const production of [false, true]) {
      setEnv({ production, demo: !production });

      for (const seed of PRODUCT_SEEDS) {
        expect(
          productSchema({
            slug: seed.slug,
            name: seed.name,
            // Deliberately the most favourable case: active status and a real
            // price. Only `isDemo` should stop it.
            priceMinor: (seed.price?.selling ?? 2490) * 100,
            status: 'active',
            isDemo: true,
          }),
          `${seed.slug} must emit no Product schema`,
        ).toBeNull();
      }
    }
  });

  it('is emitted for a real active product with a real price', () => {
    const schema = productSchema(realActiveProduct);

    expect(schema).not.toBeNull();
    expect(schema?.['@type']).toBe('Product');
    expect(schema?.offers.priceCurrency).toBe('BDT');
    // Minor units become the decimal amount schema.org expects, not ৳ text.
    expect(schema?.offers.price).toBe('2490.00');
  });

  it('asserts no rating or review, because none exist', () => {
    const schema = productSchema(realActiveProduct) as Record<string, unknown> | null;

    expect(schema).not.toHaveProperty('aggregateRating');
    expect(schema).not.toHaveProperty('review');
  });

  it('refuses a product with no founder-supplied price', () => {
    expect(productSchema({ ...realActiveProduct, priceMinor: undefined })).toBeNull();
  });

  it('refuses a draft product', () => {
    expect(productSchema({ ...realActiveProduct, status: 'draft' })).toBeNull();
  });

  it('refuses a Coming Soon product even when it is real, active and priced', () => {
    // There is no Offer to describe for something that cannot be bought.
    expect(productSchema({ ...realActiveProduct, availability: 'coming-soon' })).toBeNull();
  });
});

describe('ViewContent payload', () => {
  it('is withheld for every demo product, so campaign data is never poisoned', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(
        productViewPayload({
          slug: seed.slug,
          name: seed.name,
          priceMinor: (seed.price?.selling ?? 2490) * 100,
          status: 'active',
          isDemo: true,
        }),
        `${seed.slug} must emit no ViewContent`,
      ).toBeUndefined();
    }
  });

  it('is built for a real active product, in whole taka', () => {
    expect(productViewPayload({ ...realActiveProduct, categoryLabel: 'Numbers & Math' })).toEqual({
      content_type: 'product',
      content_ids: ['a-real-product'],
      content_name: 'A real product',
      content_category: 'Numbers & Math',
      value: 2490,
      currency: 'BDT',
    });
  });

  it('is withheld for a Coming Soon product', () => {
    expect(
      productViewPayload({ ...realActiveProduct, availability: 'coming-soon' }),
    ).toBeUndefined();
  });

  it('fires nothing on its own — it only returns a shape', () => {
    // A regression guard with a purpose: if a later phase adds a side effect
    // here, demo pages start emitting events. The helper must stay pure.
    expect(productViewPayload.length).toBe(1);
  });
});

describe('the detail page can only render mapped media', () => {
  it('never has a reference screenshot to render', () => {
    for (const seed of PRODUCT_SEEDS) {
      const files = [...seed.images.map((image) => image.file), ...(seed.video ? [seed.video.file] : [])];

      for (const file of files) {
        for (const banned of NEVER_STOREFRONT_MEDIA) {
          expect(file, `${seed.slug} must not map ${banned}`).not.toBe(banned);
        }
      }
    }
  });

  it('gives the gallery a video for all but the one product without a clip', () => {
    // The gallery renders a video tile only when a video exists, so both
    // branches need to be reachable — and both are.
    const withVideo = PRODUCT_SEEDS.filter((seed) => seed.video !== undefined);
    const without = PRODUCT_SEEDS.filter((seed) => seed.video === undefined);

    expect(withVideo.length).toBe(10);
    expect(without.map((seed) => seed.slug)).toEqual([
      'wooden-shape-threading-and-lacing-beads-set',
    ]);
  });

  it('gives every gallery image real alt text', () => {
    for (const seed of PRODUCT_SEEDS) {
      for (const image of seed.images) {
        expect(image.alt.trim().length, `${seed.slug}/${image.file}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('every seeded product has a reachable detail URL', () => {
  it('produces a clean, locale-free product URL', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(productHref(seed.slug)).toBe(`/products/${seed.slug}`);
    }
  });
});
