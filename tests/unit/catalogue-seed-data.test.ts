import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateAgeBandSequence } from '@/lib/catalogue/age-bands';
import { isComplianceVerified, renderableComplianceFields } from '@/lib/catalogue/compliance';
import { mayEmitProductSchema, isProductIndexable } from '@/lib/catalogue/demo';
import { readImageMetadata } from '@/lib/catalogue/image-metadata';
import { formatTaka, formatTakaOrUndefined } from '@/lib/catalogue/price';
import {
  AGE_BAND_SEEDS,
  CATEGORY_SEEDS,
  NEVER_STOREFRONT_MEDIA,
  PRODUCT_SEEDS,
} from '@/lib/catalogue/seed-data';
import { SLUG_PATTERN } from '@/lib/catalogue/types';

/**
 * Phase 2B content rules. These guard the boundary between "useful reference
 * information" and "a Renvura claim" — the distinction the whole catalogue's
 * trustworthiness rests on (D-12, D-16).
 */

const REFERENCE_ROOT = path.join(process.cwd(), 'assets', 'reference', 'products');

describe('the initial catalogue shape', () => {
  it('seeds exactly five products', () => {
    expect(PRODUCT_SEEDS).toHaveLength(5);
  });

  it('seeds one top-level category and three subcategories, and nothing empty', () => {
    const top = CATEGORY_SEEDS.filter((category) => category.parentSlug === undefined);
    const children = CATEGORY_SEEDS.filter((category) => category.parentSlug !== undefined);

    expect(top.map((category) => category.slug)).toEqual(['learning-educational']);
    expect(children.map((category) => category.slug)).toEqual([
      'activity-matching',
      'sorting-fine-motor',
      'numbers-math',
    ]);
    // No Baby Essentials / Feeding / Clothing shelves without products.
    expect(CATEGORY_SEEDS).toHaveLength(4);
  });

  it('assigns each product to the founder-confirmed category', () => {
    const bySlug = new Map(PRODUCT_SEEDS.map((seed) => [seed.folder, seed.categorySlug]));

    expect(bySlug.get('01-fruit-matching-board')).toBe('activity-matching');
    expect(bySlug.get('02-felt-learning-board')).toBe('activity-matching');
    expect(bySlug.get('03-Geometric Bead Stacking Pillars')).toBe('sorting-fine-motor');
    expect(bySlug.get('04-number-recognition-beads')).toBe('numbers-math');
    expect(bySlug.get('05-math-abacus-frame')).toBe('numbers-math');
  });

  it('points every product at a category that exists', () => {
    const slugs = new Set(CATEGORY_SEEDS.map((category) => category.slug));
    for (const seed of PRODUCT_SEEDS) expect(slugs.has(seed.categorySlug)).toBe(true);
  });
});

describe('age bands', () => {
  it('are contiguous and non-overlapping', () => {
    expect(validateAgeBandSequence(AGE_BAND_SEEDS)).toEqual({ ok: true });
  });

  it('cover every month from newborn upward with exactly one band', () => {
    // Age navigation starts at newborn, not at 2 (D-01).
    expect(AGE_BAND_SEEDS[0]?.minMonths).toBe(0);

    for (let i = 1; i < AGE_BAND_SEEDS.length; i += 1) {
      expect(AGE_BAND_SEEDS[i]!.minMonths).toBe(AGE_BAND_SEEDS[i - 1]!.maxMonths + 1);
    }
  });
});

describe('slugs', () => {
  it('are clean English for every product, category and band', () => {
    for (const seed of PRODUCT_SEEDS) expect(SLUG_PATTERN.test(seed.slug)).toBe(true);
    for (const seed of CATEGORY_SEEDS) expect(SLUG_PATTERN.test(seed.slug)).toBe(true);
    for (const seed of AGE_BAND_SEEDS) expect(SLUG_PATTERN.test(seed.slug)).toBe(true);
  });

  it('are unique', () => {
    const slugs = PRODUCT_SEEDS.map((seed) => seed.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('media selection', () => {
  it('never includes a reference-page screenshot', () => {
    for (const seed of PRODUCT_SEEDS) {
      for (const image of seed.images) {
        expect(image.file).not.toBe('reference-page.png');
        expect((NEVER_STOREFRONT_MEDIA as readonly string[]).includes(image.file)).toBe(false);
      }
    }
  });

  it('records why every excluded file was excluded', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(seed.excluded.some((entry) => entry.file === 'reference-page.png')).toBe(true);
      for (const entry of seed.excluded) expect(entry.reason.length).toBeGreaterThan(20);
    }
  });

  it('gives every product a primary image and at least two images', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(seed.images.length).toBeGreaterThanOrEqual(2);
      expect(seed.images[0]?.file).toBeTruthy();
    }
  });

  it('gives every image distinct, meaningful alt text', () => {
    for (const seed of PRODUCT_SEEDS) {
      const alts = seed.images.map((image) => image.alt);

      expect(new Set(alts).size).toBe(alts.length);
      for (const alt of alts) {
        expect(alt.length).toBeGreaterThan(30);
        expect(alt).not.toMatch(/^image of/i);
        expect(alt).not.toMatch(/image-\d+/);
      }
    }
  });

  it('references only files that actually exist on disk', () => {
    for (const seed of PRODUCT_SEEDS) {
      for (const image of seed.images) {
        expect(existsSync(path.join(REFERENCE_ROOT, seed.folder, image.file))).toBe(true);
      }
      if (seed.video) {
        expect(existsSync(path.join(REFERENCE_ROOT, seed.folder, seed.video.file))).toBe(true);
      }
    }
  });

  it('maps a demo video for every product', () => {
    for (const seed of PRODUCT_SEEDS) expect(seed.video?.file).toBe('demo.mp4');
  });

  it('reads real dimensions and format from the bytes, not the filename', () => {
    // `01/image-01.jpg` actually holds PNG data — the detector must say so.
    const buffer = readFileSync(path.join(REFERENCE_ROOT, '01-fruit-matching-board', 'image-01.jpg'));
    const meta = readImageMetadata(buffer);

    expect(meta.format).toBe('png');
    expect(meta.width).toBeGreaterThan(0);
    expect(meta.height).toBeGreaterThan(0);
  });

  it('reads every selected image successfully', () => {
    for (const seed of PRODUCT_SEEDS) {
      for (const image of seed.images) {
        const buffer = readFileSync(path.join(REFERENCE_ROOT, seed.folder, image.file));
        const meta = readImageMetadata(buffer);

        expect(['png', 'jpeg']).toContain(meta.format);
        expect(meta.width).toBeGreaterThan(100);
        expect(meta.height).toBeGreaterThan(100);
      }
    }
  });
});

describe('claims discipline', () => {
  it('invents no price, SKU or stock', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(seed).not.toHaveProperty('priceMinor');
      expect(seed).not.toHaveProperty('sku');
      expect(seed).not.toHaveProperty('stock');
    }
  });

  it('declares no product age range from unverified supplier claims', () => {
    // Browsing bands exist; product age suitability has not been assessed.
    for (const seed of PRODUCT_SEEDS) expect(seed).not.toHaveProperty('ageRange');
  });

  it('populates no developmental attributes without a founder-authored basis', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(seed).not.toHaveProperty('developmentDomains');
      expect(seed).not.toHaveProperty('expertNote');
      expect(seed).not.toHaveProperty('milestones');
      expect(seed).not.toHaveProperty('ageGuidance');
    }
  });

  it('keeps "Montessori" out of Renvura copy entirely', () => {
    for (const seed of PRODUCT_SEEDS) {
      const copy = [
        seed.name,
        seed.slug,
        seed.shortDescription,
        seed.description,
        seed.descriptionBn ?? '',
        seed.seo.metaTitle,
        seed.seo.metaDescription,
        ...seed.features,
        ...seed.searchAliases,
        ...seed.images.map((image) => image.alt),
      ].join(' ');

      expect(copy.toLowerCase()).not.toContain('montessori');
    }
  });

  it('makes no safety, certification or material claims in customer-facing copy', () => {
    const banned = [
      'non-toxic',
      'nontoxic',
      'bpa',
      'lead-free',
      'no hand injury',
      'certified',
      'certification',
      'iso',
      'ce mark',
      'guaranteed',
    ];

    for (const seed of PRODUCT_SEEDS) {
      const copy = [seed.name, seed.shortDescription, seed.description, ...seed.features]
        .join(' ')
        .toLowerCase();

      for (const phrase of banned) expect(copy).not.toContain(phrase);
    }
  });

  it('states no age suitability in customer-facing copy', () => {
    for (const seed of PRODUCT_SEEDS) {
      const copy = [seed.name, seed.shortDescription, seed.description, ...seed.features].join(' ');

      expect(copy).not.toMatch(/\b\d+\s*\+?\s*(years?|months?)\s*(old)?\b/i);
      expect(copy).not.toMatch(/suitable for ages?/i);
    }
  });

  it('exposes no supplier, marketplace or courier name', () => {
    const forbidden = ['skybuy', 'sf express', 'lazada', 'alibaba', 'aliexpress', 'smart player', 'child jupiter'];

    for (const seed of PRODUCT_SEEDS) {
      const copy = [
        seed.name,
        seed.shortDescription,
        seed.description,
        seed.seo.metaTitle,
        seed.seo.metaDescription,
        ...seed.features,
        ...seed.searchAliases,
        ...seed.images.map((image) => image.alt),
      ]
        .join(' ')
        .toLowerCase();

      for (const term of forbidden) expect(copy).not.toContain(term);
    }
  });
});

describe('supplier evidence', () => {
  it('is recorded, so the source of every observation is traceable', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(seed.evidence.length).toBeGreaterThan(0);
      for (const entry of seed.evidence) expect(entry.sourceRef.length).toBeGreaterThan(10);
    }
  });

  it('is marked non-probative, so it can never carry a claim to verified', () => {
    for (const seed of PRODUCT_SEEDS) {
      for (const entry of seed.evidence) {
        expect(entry.sourceType).toBe('marketplace-listing');
      }
    }
  });

  it('never becomes storefront-renderable', () => {
    // What the seed writes: evidence present, verification explicitly unverified.
    const compliance = {
      evidence: PRODUCT_SEEDS[0]!.evidence,
      countryOfOrigin: 'Mainland China',
      verification: { status: 'unverified' as const },
    };

    expect(isComplianceVerified(compliance)).toBe(false);
    expect(renderableComplianceFields(compliance, ['countryOfOrigin', 'materials'])).toEqual([]);
  });
});

describe('demo protection', () => {
  const seeded = { status: 'draft' as const, isDemo: true };

  it('leaves seeded products non-indexable', () => {
    expect(isProductIndexable(seeded)).toBe(false);
  });

  it('forbids Product/Offer structured data for them', () => {
    expect(mayEmitProductSchema(seeded)).toBe(false);
    // Still forbidden even if someone later activates them while demo.
    expect(mayEmitProductSchema({ status: 'active', isDemo: true, priceMinor: 5000 })).toBe(false);
  });
});

describe('currency', () => {
  it('formats taka with a prefix, separators and no decimals', () => {
    expect(formatTaka(125000)).toBe('৳1,250');
    expect(formatTaka(89000)).toBe('৳890');
  });

  it('returns nothing rather than ৳0 when no price exists', () => {
    // None of the Phase 2B products has a founder-supplied price.
    expect(formatTakaOrUndefined(undefined)).toBeUndefined();
    expect(formatTakaOrUndefined(0)).toBeUndefined();
    expect(formatTakaOrUndefined(125000)).toBe('৳1,250');
  });
});
