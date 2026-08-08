import { describe, expect, it } from 'vitest';
import {
  MAX_QUANTITY_PER_LINE,
  computeOrderTotals,
  validatePurchaseItems,
  type AuthoritativeProduct,
} from '@/lib/checkout/pricing';

/**
 * §9 money safety, §18 Coming Soon exclusion. These pin the rule the whole
 * order path depends on: the client supplies a slug and a quantity, nothing
 * else, and every taka charged comes from `AuthoritativeProduct` — data the
 * order service reads fresh from MongoDB, never from the request body.
 */

const available: AuthoritativeProduct = {
  productId: '507f1f77bcf86cd799439011',
  slug: 'rainbow-wooden-abacus-and-counting-stacker',
  name: 'Rainbow Wooden Abacus & Counting Stacker',
  priceMinor: 169_000,
  availability: 'available',
  status: 'draft',
  isDemo: true,
};

const comingSoon: AuthoritativeProduct = {
  productId: '507f1f77bcf86cd799439012',
  slug: 'kids-explorer-binoculars-outdoor-nature',
  name: 'Kids Explorer Binoculars',
  priceMinor: undefined,
  availability: 'coming-soon',
  status: 'draft',
  isDemo: true,
};

const missingPrice: AuthoritativeProduct = {
  ...available,
  productId: '507f1f77bcf86cd799439013',
  slug: 'unpriced-available-product',
  priceMinor: undefined,
};

const draftNonDemo: AuthoritativeProduct = {
  ...available,
  productId: '507f1f77bcf86cd799439014',
  slug: 'draft-real-product',
  status: 'draft',
  isDemo: false,
};

function productMap(...products: AuthoritativeProduct[]): Map<string, AuthoritativeProduct> {
  return new Map(products.map((product) => [product.slug, product]));
}

describe('validatePurchaseItems', () => {
  it('prices a valid line from the authoritative product, never from the request', () => {
    const result = validatePurchaseItems(
      [{ slug: available.slug, quantity: 2 }],
      productMap(available),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([
      {
        productId: available.productId,
        slug: available.slug,
        name: available.name,
        variantId: undefined,
        quantity: 2,
        unitPriceMinor: 169_000,
        lineTotalMinor: 338_000,
        imageUrl: undefined,
        imageAlt: undefined,
        isDemo: true,
      },
    ]);
    expect(result.isDemo).toBe(true);
  });

  it('ignores a unit price if the request body somehow includes one', () => {
    // `RequestedItem` has no price field at all — this proves the point at
    // the type level too: TypeScript would reject `price` here if the type
    // accepted it. Casting through `unknown` simulates a manipulated request
    // that adds an extra key Zod would already have stripped.
    const manipulated = { slug: available.slug, quantity: 1, price: 1 } as unknown as {
      slug: string;
      quantity: number;
    };

    const result = validatePurchaseItems([manipulated], productMap(available));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items[0]?.unitPriceMinor).toBe(169_000);
  });

  it('rejects a Coming Soon product (§18) — never enters an order', () => {
    const result = validatePurchaseItems([{ slug: comingSoon.slug, quantity: 1 }], productMap(comingSoon));
    expect(result).toEqual({ ok: false, rejections: [{ slug: comingSoon.slug, code: 'comingSoon' }] });
  });

  it('rejects an unknown slug', () => {
    const result = validatePurchaseItems([{ slug: 'does-not-exist', quantity: 1 }], productMap());
    expect(result).toEqual({ ok: false, rejections: [{ slug: 'does-not-exist', code: 'productNotFound' }] });
  });

  it('rejects a product with no real price', () => {
    const result = validatePurchaseItems(
      [{ slug: missingPrice.slug, quantity: 1 }],
      productMap(missingPrice),
    );
    expect(result).toEqual({ ok: false, rejections: [{ slug: missingPrice.slug, code: 'missingPrice' }] });
  });

  it('rejects a draft product that is not demo data', () => {
    const result = validatePurchaseItems(
      [{ slug: draftNonDemo.slug, quantity: 1 }],
      productMap(draftNonDemo),
    );
    expect(result).toEqual({ ok: false, rejections: [{ slug: draftNonDemo.slug, code: 'notPurchasable' }] });
  });

  it.each([0, -1, 1.5, MAX_QUANTITY_PER_LINE + 1, Number.NaN])(
    'rejects an invalid quantity: %s',
    (quantity) => {
      const result = validatePurchaseItems([{ slug: available.slug, quantity }], productMap(available));
      expect(result).toEqual({ ok: false, rejections: [{ slug: available.slug, code: 'invalidQuantity' }] });
    },
  );

  it('accepts the maximum allowed quantity', () => {
    const result = validatePurchaseItems(
      [{ slug: available.slug, quantity: MAX_QUANTITY_PER_LINE }],
      productMap(available),
    );
    expect(result.ok).toBe(true);
  });

  it('is all-or-nothing: one bad line rejects the whole request', () => {
    const result = validatePurchaseItems(
      [
        { slug: available.slug, quantity: 1 },
        { slug: comingSoon.slug, quantity: 1 },
      ],
      productMap(available, comingSoon),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // The good line is not silently dropped and charged anyway.
    expect(result.rejections).toEqual([{ slug: comingSoon.slug, code: 'comingSoon' }]);
  });

  it('marks the whole order demo when any line is demo', () => {
    const result = validatePurchaseItems([{ slug: available.slug, quantity: 1 }], productMap(available));
    expect(result.ok && result.isDemo).toBe(true);
  });
});

describe('computeOrderTotals', () => {
  it('sums line totals, adds delivery, and mirrors the total as the COD amount', () => {
    const totals = computeOrderTotals(
      [{ lineTotalMinor: 169_000 }, { lineTotalMinor: 249_000 }],
      6_000,
    );

    expect(totals).toEqual({
      subtotalMinor: 418_000,
      deliveryChargeMinor: 6_000,
      discountMinor: 0,
      totalMinor: 424_000,
      codAmountMinor: 424_000,
    });
  });

  it('subtracts a discount, defaulting to zero when none is given', () => {
    const totals = computeOrderTotals([{ lineTotalMinor: 100_000 }], 5_000, 20_000);
    expect(totals.totalMinor).toBe(85_000);
    expect(totals.codAmountMinor).toBe(85_000);
  });

  it('never produces a negative total even if a discount exceeds the order value', () => {
    const totals = computeOrderTotals([{ lineTotalMinor: 10_000 }], 0, 999_999);
    expect(totals.totalMinor).toBe(0);
    expect(totals.codAmountMinor).toBe(0);
  });
});
