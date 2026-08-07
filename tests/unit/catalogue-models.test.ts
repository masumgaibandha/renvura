import type { Error as MongooseError } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { AgeBand } from '@/lib/models/AgeBand';
import { Category } from '@/lib/models/Category';
import { Collection } from '@/lib/models/Collection';
import { Product } from '@/lib/models/Product';
import { ageBandInputSchema, productDraftSchema } from '@/lib/validation/catalogue';

/**
 * Schema-level behaviour, checked with Mongoose's own validation — no database
 * connection is opened, which is also what keeps the build independent of Atlas.
 *
 * The point of these tests is the §7.3 rule: **the database must not be the
 * thing that blocks partial admin work.** If someone later adds `required: true`
 * to `name` or `price`, these fail.
 */

type ValidationErrors = MongooseError.ValidationError['errors'] | undefined;

/** `undefined` when the document is valid, otherwise the per-path errors. */
async function validationErrors(doc: { validate: () => Promise<unknown> }): Promise<ValidationErrors> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return (error as MongooseError.ValidationError).errors;
  }
}

describe('a draft product', () => {
  it('saves with nothing supplied at all', async () => {
    // The founder can create a product now and fill it in over the next week.
    expect(await validationErrors(new Product({}))).toBeUndefined();
  });

  it('defaults to draft, tracked stock, a single product, and not demo', () => {
    const product = new Product({});

    expect(product.status).toBe('draft');
    expect(product.stockPolicy).toBe('track');
    expect(product.productType).toBe('single');
    expect(product.isDemo).toBe(false);
  });

  it('does not require a name, price, SKU, category or image', async () => {
    expect(await validationErrors(new Product({ status: 'draft' }))).toBeUndefined();
  });

  it('saves a partially filled product — a name today, images next week', async () => {
    const product = new Product({ name: 'Wooden stacking rings' });

    expect(await validationErrors(product)).toBeUndefined();
    expect(product.priceMinor).toBeUndefined();
  });
});

describe('optional blocks are absent, not empty', () => {
  it('leaves the child-development block undefined by default', () => {
    const product = new Product({ name: 'Feeding bibs, pack of three' });

    // A non-learning product must work perfectly without any of these (D-01).
    expect(product.ageRange).toBeUndefined();
    expect(product.developmentDomains).toBeUndefined();
    expect(product.expertNote).toBeUndefined();
    expect(product.milestones).toBeUndefined();
    expect(product.ageGuidance).toBeUndefined();
  });

  it('leaves the compliance block undefined by default', () => {
    expect(new Product({}).compliance).toBeUndefined();
  });

  it('leaves optional arrays undefined rather than empty', () => {
    // `[]` would render as an empty section; absent is the documented state.
    const product = new Product({});

    expect(product.images).toBeUndefined();
    expect(product.variants).toBeUndefined();
    expect(product.videos).toBeUndefined();
    expect(product.searchAliases).toBeUndefined();
  });
});

describe('enumerated fields still hold the line', () => {
  it('rejects an unknown status', async () => {
    expect((await validationErrors(new Product({ status: 'published' })))?.status).toBeDefined();
  });

  it('rejects an unknown stock policy', async () => {
    expect((await validationErrors(new Product({ stockPolicy: 'backorder' })))?.stockPolicy).toBeDefined();
  });

  it('rejects a negative price', async () => {
    expect((await validationErrors(new Product({ priceMinor: -1 })))?.priceMinor).toBeDefined();
  });
});

describe('media', () => {
  it('stores real per-image dimensions and format', async () => {
    // The five reference products mix 600×600, 552×542, 1024×1024 and
    // 1059×1008 within one product, and one file named `.jpg` holds PNG data —
    // so neither size nor format may be inferred.
    const product = new Product({
      images: [
        { url: '/a.jpg', alt: 'Front', width: 600, height: 600, format: 'jpeg', isPrimary: true },
        { url: '/b.jpg', alt: 'Detail', width: 1059, height: 1008, format: 'png' },
      ],
    });

    expect(await validationErrors(product)).toBeUndefined();
    expect(product.images?.[1]?.width).toBe(1059);
    expect(product.images?.[1]?.format).toBe('png');
  });

  it('supports an optional product video', async () => {
    const product = new Product({ videos: [{ url: '/demo.mp4', title: 'How it works' }] });
    expect(await validationErrors(product)).toBeUndefined();
  });
});

describe('variants', () => {
  it('carries open option name/value pairs, not hardcoded axes', async () => {
    // Size, colour, style and pack quantity are data — none is named in the
    // schema.
    const product = new Product({
      variants: [
        { name: 'Large', options: [{ name: 'Size', value: 'Large' }], priceMinor: 99000, stock: 3 },
        { name: '6-pack', options: [{ name: 'Pack', value: '6' }] },
      ],
    });

    expect(await validationErrors(product)).toBeUndefined();
    expect(product.variants?.[0]?.options?.[0]?.name).toBe('Size');
  });

  it('lets a variant inherit the parent price by leaving it unset', () => {
    const product = new Product({ priceMinor: 50000, variants: [{ name: 'Blue' }] });
    expect(product.variants?.[0]?.priceMinor).toBeUndefined();
  });
});

describe('supporting models', () => {
  it('requires a category to have a name and slug', async () => {
    const errors = await validationErrors(new Category({}));

    expect(errors?.name).toBeDefined();
    expect(errors?.slug).toBeDefined();
  });

  it('treats a top-level category as having no parent', () => {
    expect(new Category({ name: 'Toys', slug: 'toys' }).parent).toBeNull();
  });

  it('lets a category declare a compliance profile', async () => {
    const category = new Category({
      name: 'Feeding',
      slug: 'feeding',
      complianceProfile: { requiredFields: ['manufacturer', 'materials'], requiresVerification: true },
    });

    expect(await validationErrors(category)).toBeUndefined();
    expect(category.complianceProfile?.requiresVerification).toBe(true);
  });

  it('rejects a compliance field outside the known set', async () => {
    const category = new Category({
      name: 'X',
      slug: 'x',
      complianceProfile: { requiredFields: ['vibes'] },
    });

    expect(await validationErrors(category)).toBeDefined();
  });

  it('requires an age band to declare both bounds', async () => {
    const errors = await validationErrors(new AgeBand({ label: 'Babies', slug: 'babies' }));

    expect(errors?.minMonths).toBeDefined();
    expect(errors?.maxMonths).toBeDefined();
  });

  it('requires a collection to have a name and slug', async () => {
    const errors = await validationErrors(new Collection({}));

    expect(errors?.name).toBeDefined();
    expect(errors?.slug).toBeDefined();
  });
});

describe('input validation', () => {
  it('accepts a completely empty product draft', () => {
    const result = productDraftSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('draft');
  });

  it('does not encode publish requirements — that would break drafting', () => {
    expect(productDraftSchema.safeParse({ name: undefined, priceMinor: undefined }).success).toBe(true);
  });

  it('normalises a slug and rejects a non-URL-clean one', () => {
    expect(productDraftSchema.safeParse({ slug: 'Wooden-Rings' }).success).toBe(true);
    expect(productDraftSchema.safeParse({ slug: 'wooden rings' }).success).toBe(false);
    // Slugs are always English, even for a Bangla-named product (§4.4).
    expect(productDraftSchema.safeParse({ slug: 'কাঠের-রিং' }).success).toBe(false);
  });

  it('rejects a rupee float where poisha are expected', () => {
    expect(productDraftSchema.safeParse({ priceMinor: 890.5 }).success).toBe(false);
    expect(productDraftSchema.safeParse({ priceMinor: 89000 }).success).toBe(true);
  });

  it('rejects an inverted age range', () => {
    expect(productDraftSchema.safeParse({ ageRange: { minMonths: 36, maxMonths: 12 } }).success).toBe(
      false,
    );
  });

  it('requires a source reference on every piece of evidence', () => {
    const result = productDraftSchema.safeParse({
      compliance: { evidence: [{ field: 'materials', sourceType: 'lab-report', sourceRef: '' }] },
    });

    expect(result.success).toBe(false);
  });

  it('rejects an age band whose maximum is below its minimum', () => {
    expect(
      ageBandInputSchema.safeParse({ label: 'X', slug: 'x', minMonths: 24, maxMonths: 12 }).success,
    ).toBe(false);
  });
});
