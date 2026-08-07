import { describe, expect, it } from 'vitest';
import {
  isPurchasable,
  publishErrorMessage,
  validateForPublish,
  validateStockForPublish,
  type PublishableProduct,
} from '@/lib/catalogue/publish';

/**
 * §7.3: validation gates the transition to `active`, never the write. These
 * tests pin both halves — that a draft may be almost empty, and that publishing
 * reports a per-field checklist rather than one flat rejection.
 */

/** The minimum a valid, publishable product needs. */
function publishable(overrides: Partial<PublishableProduct> = {}): PublishableProduct {
  return {
    status: 'draft',
    name: 'Wooden stacking rings',
    slug: 'wooden-stacking-rings',
    description: 'A stacking toy.',
    priceMinor: 89000,
    sku: 'RV-STACK-01',
    category: 'cat-1',
    images: [{ url: '/x.jpg', alt: 'Wooden stacking rings on a plain background', width: 800, height: 800 }],
    stockPolicy: 'track',
    stock: 12,
    ...overrides,
  };
}

const codesOf = (result: ReturnType<typeof validateForPublish>) =>
  result.ok ? [] : result.issues.map((issue) => issue.code);

const fieldsOf = (result: ReturnType<typeof validateForPublish>) =>
  result.ok ? [] : result.issues.map((issue) => issue.field);

describe('publishing a complete product', () => {
  it('passes', () => {
    expect(validateForPublish(publishable())).toEqual({ ok: true });
  });

  it('passes without any developmental fields', () => {
    // A pack of feeding bibs carries none of them and must publish perfectly
    // (D-01, §3.4).
    expect(validateForPublish(publishable()).ok).toBe(true);
  });
});

describe('an incomplete draft', () => {
  it('is never blocked from being saved — publishing is the only gate', () => {
    // The empty product below is a legitimate draft. `validateForPublish` is
    // called at the transition to `active`, not on write, so nothing here
    // prevents the founder saving partial work (§7.3, §12.1).
    const result = validateForPublish({ status: 'draft', stockPolicy: 'track' });
    expect(result.ok).toBe(false);
  });

  it('reports every missing field at once, as a checklist', () => {
    const result = validateForPublish({ status: 'draft', stockPolicy: 'track' });
    const fields = fieldsOf(result);

    // Not a single generic failure — the admin needs the whole list.
    expect(fields.length).toBeGreaterThan(5);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'slug', 'description', 'priceMinor', 'sku', 'category', 'images', 'stock']),
    );
  });

  it('gives every issue a translatable code and a human message', () => {
    const result = validateForPublish({ status: 'draft', stockPolicy: 'track' });
    if (result.ok) throw new Error('expected failure');

    for (const issue of result.issues) {
      expect(issue.code).toBeTruthy();
      expect(publishErrorMessage(issue.code)).toBeTruthy();
      expect(publishErrorMessage(issue.code)).not.toBe('Check this field');
    }
  });
});

describe('required fields', () => {
  it.each([
    ['name', { name: undefined }, 'nameRequired'],
    ['description', { description: undefined }, 'descriptionRequired'],
    ['sku', { sku: undefined }, 'skuRequired'],
    ['category', { category: undefined }, 'categoryRequired'],
    ['slug', { slug: undefined }, 'slugRequired'],
  ])('rejects a missing %s', (_label, override, code) => {
    expect(codesOf(validateForPublish(publishable(override)))).toContain(code);
  });

  it('rejects a slug that is not URL-clean English', () => {
    expect(codesOf(validateForPublish(publishable({ slug: 'Wooden Rings!' })))).toContain('slugInvalid');
  });

  it('rejects a malformed SKU', () => {
    expect(codesOf(validateForPublish(publishable({ sku: 'rv stack 01' })))).toContain('skuInvalid');
  });
});

describe('price', () => {
  it('requires a real founder-supplied price', () => {
    expect(codesOf(validateForPublish(publishable({ priceMinor: undefined })))).toContain('priceRequired');
  });

  it('rejects zero — a free product is a data error, not an offer', () => {
    expect(codesOf(validateForPublish(publishable({ priceMinor: 0 })))).toContain('priceMustBePositive');
  });

  it('rejects a rupee float passed where poisha were expected', () => {
    expect(codesOf(validateForPublish(publishable({ priceMinor: 890.5 })))).toContain('priceNotMinorUnits');
  });
});

describe('images', () => {
  it('requires at least one', () => {
    expect(codesOf(validateForPublish(publishable({ images: [] })))).toContain('imageRequired');
  });

  it('requires alt text on every image', () => {
    const result = validateForPublish(
      publishable({ images: [{ url: '/x.jpg', alt: '', width: 600, height: 600 }] }),
    );
    expect(codesOf(result)).toContain('imageAltRequired');
  });

  it('requires intrinsic dimensions, because CLS is a launch gate', () => {
    const result = validateForPublish(publishable({ images: [{ url: '/x.jpg', alt: 'A toy' }] }));
    expect(codesOf(result)).toContain('imageDimensionsRequired');
  });

  it('reports the offending image by index', () => {
    const result = validateForPublish(
      publishable({
        images: [
          { url: '/a.jpg', alt: 'Fine', width: 600, height: 600 },
          { url: '/b.jpg', alt: '', width: 600, height: 600 },
        ],
      }),
    );
    expect(fieldsOf(result)).toContain('images.1.alt');
    expect(fieldsOf(result)).not.toContain('images.0.alt');
  });
});

describe('stock policy', () => {
  it('requires a quantity when stock is tracked', () => {
    const issues = validateStockForPublish({ stockPolicy: 'track' });
    expect(issues.map((issue) => issue.code)).toContain('stockRequiredWhenTracked');
  });

  it('accepts zero as a real tracked quantity', () => {
    expect(validateStockForPublish({ stockPolicy: 'track', stock: 0 })).toEqual([]);
  });

  it.each(['always-in-stock', 'made-to-order'] as const)(
    'does not require a quantity for %s',
    (policy) => {
      expect(validateStockForPublish({ stockPolicy: policy })).toEqual([]);
    },
  );

  it.each(['always-in-stock', 'made-to-order'] as const)(
    'flags a meaningless quantity supplied for %s',
    (policy) => {
      const issues = validateStockForPublish({ stockPolicy: policy, stock: 5 });
      expect(issues.map((issue) => issue.code)).toContain('stockNotApplicable');
    },
  );

  it('requires a stock policy at all', () => {
    const issues = validateStockForPublish({});
    expect(issues.map((issue) => issue.code)).toContain('stockPolicyRequired');
  });
});

describe('purchasability', () => {
  it('is false for anything not active', () => {
    expect(isPurchasable(publishable({ status: 'draft' }))).toBe(false);
    expect(isPurchasable(publishable({ status: 'archived' }))).toBe(false);
  });

  it('follows the quantity only when the policy tracks it', () => {
    expect(isPurchasable(publishable({ status: 'active', stockPolicy: 'track', stock: 0 }))).toBe(false);
    expect(isPurchasable(publishable({ status: 'active', stockPolicy: 'track', stock: 3 }))).toBe(true);
  });

  it('is true for non-tracked policies regardless of quantity', () => {
    expect(
      isPurchasable({ status: 'active', stockPolicy: 'always-in-stock' }),
    ).toBe(true);
    expect(isPurchasable({ status: 'active', stockPolicy: 'made-to-order' })).toBe(true);
  });
});
