import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateAgeBandSequence } from '@/lib/catalogue/age-bands';
import { isComplianceVerified, renderableComplianceFields } from '@/lib/catalogue/compliance';
import { mayEmitProductSchema, isProductIndexable } from '@/lib/catalogue/demo';
import { readImageMetadata } from '@/lib/catalogue/image-metadata';
import {
  formatTaka,
  formatTakaOrUndefined,
  savingsMinor,
  savingsPercent,
  takaToMinorUnits,
  validatePricing,
} from '@/lib/catalogue/price';
import {
  AGE_BAND_SEEDS,
  assertSeedPricingIntegrity,
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
  it('seeds exactly eleven products — five priced, six coming soon', () => {
    expect(PRODUCT_SEEDS).toHaveLength(11);

    const byAvailability = PRODUCT_SEEDS.reduce<Record<string, number>>((counts, seed) => {
      counts[seed.availability] = (counts[seed.availability] ?? 0) + 1;
      return counts;
    }, {});

    expect(byAvailability).toEqual({ available: 5, 'coming-soon': 6 });
  });

  it('has unique slugs and unique source folders across all eleven', () => {
    expect(new Set(PRODUCT_SEEDS.map((seed) => seed.slug)).size).toBe(11);
    expect(new Set(PRODUCT_SEEDS.map((seed) => seed.folder)).size).toBe(11);
  });

  it('seeds two top-level categories and three subcategories, and nothing empty', () => {
    const top = CATEGORY_SEEDS.filter((category) => category.parentSlug === undefined);
    const children = CATEGORY_SEEDS.filter((category) => category.parentSlug !== undefined);

    // Toys & Play exists because a remote-control battle toy is not a learning
    // product; filing it under Learning & Educational would be a dishonest
    // classification (D-01: categories are data, none is privileged).
    expect(top.map((category) => category.slug)).toEqual(['learning-educational', 'toys-play']);
    expect(children.map((category) => category.slug)).toEqual([
      'activity-matching',
      'sorting-fine-motor',
      'numbers-math',
    ]);
    // Still no Baby Essentials / Feeding / Clothing shelves without products.
    expect(CATEGORY_SEEDS).toHaveLength(5);
  });

  it('assigns each product to the founder-confirmed category', () => {
    const bySlug = new Map(PRODUCT_SEEDS.map((seed) => [seed.folder, seed.categorySlug]));

    expect(bySlug.get('01-fruit-matching-board')).toBe('activity-matching');
    expect(bySlug.get('02-felt-learning-board')).toBe('activity-matching');
    expect(bySlug.get('03-Geometric Bead Stacking Pillars')).toBe('sorting-fine-motor');
    expect(bySlug.get('04-number-recognition-beads')).toBe('numbers-math');
    expect(bySlug.get('05-remote-control-battle-bumper-cars')).toBe('toys-play');

    // The six Coming Soon products, classified on what they are rather than
    // swept into Learning & Educational (D-01).
    expect(bySlug.get('09-children-enlightenment-telescope')).toBe('toys-play');
    expect(bySlug.get('11-shape-number-awareness-board')).toBe('activity-matching');
    expect(bySlug.get('10-shape-building-blocks-string-rope')).toBe('sorting-fine-motor');
    expect(bySlug.get('08-greedy-caterpillar-string-game')).toBe('sorting-fine-motor');
    expect(bySlug.get('07-Ten-level-calculation-rack-set')).toBe('numbers-math');
    expect(bySlug.get('06-digital-stick')).toBe('numbers-math');
  });

  it('needs no new category for the six additions', () => {
    // Every new product fits the existing taxonomy, so none is created for its
    // own sake — an empty or single-purpose shelf is worse than a broad one.
    expect(CATEGORY_SEEDS).toHaveLength(5);

    const used = new Set(PRODUCT_SEEDS.map((seed) => seed.categorySlug));
    // And no category is left holding nothing but its own name.
    for (const category of CATEGORY_SEEDS) {
      const isParent = CATEGORY_SEEDS.some((child) => child.parentSlug === category.slug);
      expect(isParent || used.has(category.slug), `${category.slug} holds no products`).toBe(true);
    }
  });

  it('has replaced the retired abacus product with the battle cars', () => {
    const slugs = PRODUCT_SEEDS.map((seed) => seed.slug);
    const folders = PRODUCT_SEEDS.map((seed) => seed.folder);

    // The guard is on the retired slug and its source folder, not on the word
    // "abacus" — which now legitimately appears in product 3's founder-approved
    // name, "Rainbow Wooden Abacus & Counting Stacker".
    expect(slugs).not.toContain('ten-row-wooden-abacus-with-number-cards');
    expect(folders).not.toContain('05-math-abacus-frame');
    expect(slugs).toContain('interactive-rc-ejection-battle-cars');
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

  it('gives every product a primary image', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(seed.images.length).toBeGreaterThanOrEqual(1);
      expect(seed.images[0]?.file).toBeTruthy();
    }
  });

  it('selects the single unique bumper-car image and excludes its duplicate', () => {
    const cars = PRODUCT_SEEDS.find((seed) => seed.slug === 'interactive-rc-ejection-battle-cars');

    expect(cars?.images.map((image) => image.file)).toEqual(['image-01.png']);
    // image-02.png is byte-identical to image-01.png; a gallery repeating the
    // same photograph reads as broken.
    expect(cars?.excluded.some((entry) => entry.file === 'image-02.png')).toBe(true);
    expect(cars?.video?.file).toBe('demo.mp4');
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

  it('maps a demo video for every product whose folder ships one', () => {
    for (const seed of PRODUCT_SEEDS) {
      const onDisk = existsSync(path.join(REFERENCE_ROOT, seed.folder, 'demo.mp4'));
      // Ten of the eleven folders ship a clip; the threading beads set does
      // not, and the gallery renders no video tile for it rather than an
      // empty one.
      expect(seed.video?.file, `${seed.slug}`).toBe(onDisk ? 'demo.mp4' : undefined);
    }
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

describe('founder-approved prices', () => {
  /** Exactly as supplied by the founder, in whole taka. */
  const APPROVED: Record<string, { display: number; selling: number }> = {
    '7-in-1-wooden-montessori-learning-board': { display: 2990, selling: 2490 },
    'toddler-montessori-busy-book-and-travel-bag': { display: 2790, selling: 2090 },
    'rainbow-wooden-abacus-and-counting-stacker': { display: 2290, selling: 1690 },
    'smart-chopstick-and-clip-bead-math-set': { display: 1990, selling: 1490 },
    'interactive-rc-ejection-battle-cars': { display: 3490, selling: 2890 },
  };

  const priced = PRODUCT_SEEDS.filter((seed) => seed.availability === 'available');

  it('still carries the exact approved pair for the five priced products', () => {
    // Unchanged by the eleven-product expansion: these are founder-approved
    // business data and nothing in this phase may touch them.
    expect(priced).toHaveLength(5);

    for (const seed of priced) {
      expect(seed.price, `${seed.slug} has no price`).toEqual(APPROVED[seed.slug]);
    }
  });

  it('gives a price to every available product and to no other', () => {
    for (const seed of PRODUCT_SEEDS) {
      if (seed.availability === 'available') {
        expect(seed.price, `${seed.slug} is available but unpriced`).toBeDefined();
      } else {
        expect(seed.price, `${seed.slug} is coming soon but priced`).toBeUndefined();
      }
    }
  });

  it('never prices the display below the selling price', () => {
    for (const seed of priced) {
      expect(seed.price!.display).toBeGreaterThanOrEqual(seed.price!.selling);
      expect(seed.price!.selling).toBeGreaterThan(0);
    }
  });

  it('converts to integer poisha with no floating-point error', () => {
    for (const seed of priced) {
      const selling = takaToMinorUnits(seed.price!.selling);
      const display = takaToMinorUnits(seed.price!.display);

      expect(Number.isInteger(selling)).toBe(true);
      expect(Number.isInteger(display)).toBe(true);
      expect(validatePricing({ priceMinor: selling, comparePriceMinor: display })).toEqual({
        ok: true,
      });
    }
  });

  it('formats each approved price the way a customer sees it', () => {
    expect(formatTaka(takaToMinorUnits(2490))).toBe('৳2,490');
    expect(formatTaka(takaToMinorUnits(2890))).toBe('৳2,890');
    expect(formatTaka(takaToMinorUnits(1490))).toBe('৳1,490');
  });
});

describe('Coming Soon products', () => {
  const comingSoon = PRODUCT_SEEDS.filter((seed) => seed.availability === 'coming-soon');

  it('are the six founder-selected additions', () => {
    expect(comingSoon.map((seed) => seed.slug)).toEqual([
      'kids-explorer-binoculars-outdoor-nature',
      '3-in-1-wooden-shape-number-and-symbol-puzzle-board',
      'wooden-shape-threading-and-lacing-beads-set',
      'greedy-caterpillar-wooden-lacing-and-threading-toy',
      '10-row-wooden-abacus-and-math-learning-frame',
      'wooden-counting-sticks-and-number-cards-set',
    ]);
  });

  it('carry no price of any kind — not a placeholder, not a sourcing cost', () => {
    for (const seed of comingSoon) {
      expect(seed.price, `${seed.slug}`).toBeUndefined();
      expect(seed).not.toHaveProperty('comparePriceMinor');
      expect(seed).not.toHaveProperty('priceMinor');
    }
  });

  it('never quote a supplier price in customer-facing copy', () => {
    // The reference pages carry supplier unit prices (৳34, ৳137, ৳485, ৳2520).
    // None of them is an approved storefront price, and none may leak into copy.
    for (const seed of PRODUCT_SEEDS) {
      const copy = [seed.name, seed.shortDescription, seed.description, ...seed.features].join(' ');
      expect(copy, `${seed.slug}`).not.toMatch(/৳/);
    }
  });

  it('promise no arrival date, waiting list or reservation', () => {
    for (const seed of comingSoon) {
      const copy = [seed.name, seed.shortDescription, seed.description, ...seed.features]
        .join(' ')
        .toLowerCase();

      for (const phrase of ['pre-order', 'preorder', 'reserve', 'waiting list', 'launching', 'next week', 'next month']) {
        expect(copy, `${seed.slug} promises "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it('are described from their own media, with real alt text and a primary image', () => {
    for (const seed of comingSoon) {
      expect(seed.images.length, `${seed.slug} has no image`).toBeGreaterThan(0);
      for (const image of seed.images) {
        expect(image.alt.trim().length, `${seed.slug}/${image.file}`).toBeGreaterThan(0);
      }
    }
  });

  it('record why every rejected file was rejected', () => {
    for (const seed of comingSoon) {
      expect(seed.excluded.length, `${seed.slug}`).toBeGreaterThan(0);
      for (const entry of seed.excluded) {
        expect(entry.reason.trim().length, `${seed.slug}/${entry.file}`).toBeGreaterThan(10);
      }
    }
  });

  it('keep the retail-packaging shots out of the gallery', () => {
    // Every retail box in these folders carries an age marking, a choking
    // warning, or both. Republishing one presents an unverified age and safety
    // claim as Renvura's own (D-12, D-16), so the rule is applied uniformly.
    const packagingShots: Record<string, string[]> = {
      'kids-explorer-binoculars-outdoor-nature': ['image-01.jpg', 'image-04.jpg'],
      'greedy-caterpillar-wooden-lacing-and-threading-toy': ['image-05.jpg', 'image-06.jpg'],
      'wooden-counting-sticks-and-number-cards-set': ['image-03.jpg', 'image-04.jpg', 'image-07.jpg'],
    };

    for (const [slug, files] of Object.entries(packagingShots)) {
      const seed = PRODUCT_SEEDS.find((candidate) => candidate.slug === slug);
      const used = new Set(seed?.images.map((image) => image.file));
      const excluded = new Set(seed?.excluded.map((entry) => entry.file));

      for (const file of files) {
        expect(used.has(file), `${slug}/${file} must not be gallery media`).toBe(false);
        expect(excluded.has(file), `${slug}/${file} must be recorded as excluded`).toBe(true);
      }
    }
  });

  it('keep the wrong-variant images out of the gallery', () => {
    // Three of the six folders are multi-variant listings. The variant chosen
    // on the reference page is the only one that may be shown.
    const wrongVariants: Record<string, string[]> = {
      '3-in-1-wooden-shape-number-and-symbol-puzzle-board': ['image-04.jpg', 'image-05.jpg'],
      'greedy-caterpillar-wooden-lacing-and-threading-toy': ['image-03.jpg'],
      '10-row-wooden-abacus-and-math-learning-frame': ['image-04.jpg'],
    };

    for (const [slug, files] of Object.entries(wrongVariants)) {
      const seed = PRODUCT_SEEDS.find((candidate) => candidate.slug === slug);
      const used = new Set(seed?.images.map((image) => image.file));
      for (const file of files) {
        expect(used.has(file), `${slug}/${file} is a different variant`).toBe(false);
      }
    }
  });
});

describe('the seed pricing invariant', () => {
  it('holds for the shipped seed set', () => {
    expect(() => assertSeedPricingIntegrity()).not.toThrow();
  });

  it('rejects a Coming Soon product that has been given a price', () => {
    const seed = { ...PRODUCT_SEEDS[5]!, availability: 'coming-soon' as const, price: { display: 100, selling: 90 } };
    expect(() => assertSeedPricingIntegrity([seed])).toThrow(/coming-soon/);
  });

  it('rejects an available product with no price', () => {
    const seed = { ...PRODUCT_SEEDS[0]!, availability: 'available' as const, price: undefined };
    expect(() => assertSeedPricingIntegrity([seed])).toThrow(/no price/);
  });
});

describe('claims discipline', () => {
  it('invents no SKU or stock', () => {
    for (const seed of PRODUCT_SEEDS) {
      expect(seed).not.toHaveProperty('sku');
      expect(seed).not.toHaveProperty('stock');
    }
  });

  it('states no discount, percentage or saving in customer-facing copy', () => {
    // Two prices do not authorise promotional messaging (founder decision).
    for (const seed of PRODUCT_SEEDS) {
      const copy = [seed.name, seed.shortDescription, seed.description, ...seed.features]
        .join(' ')
        .toLowerCase();

      for (const phrase of ['% off', 'save ৳', 'discount', 'sale', 'offer', 'deal']) {
        expect(copy).not.toContain(phrase);
      }
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

  it('confines "Montessori" to the two founder-approved product names', () => {
    /**
     * The founder approved "Montessori" in product names 1 and 2, reversing an
     * earlier instruction to keep the term out of names entirely.
     *
     * The guard is narrowed rather than deleted: as a name it is a label the
     * founder owns, but in a description, feature list or search alias it drifts
     * into an unverified pedagogical claim about the product's method (D-12).
     * This test stops that drift.
     */
    for (const seed of PRODUCT_SEEDS) {
      const beyondTheName = [
        seed.shortDescription,
        seed.description,
        seed.descriptionBn ?? '',
        seed.seo.metaDescription,
        ...seed.features,
        ...seed.searchAliases,
        ...seed.images.map((image) => image.alt),
      ]
        .join(' ')
        .toLowerCase();

      expect(beyondTheName).not.toContain('montessori');
    }

    const named = PRODUCT_SEEDS.filter((seed) => seed.name.toLowerCase().includes('montessori'));
    expect(named).toHaveLength(2);
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
    // A product awaiting a founder price must fail safely, not read as free.
    expect(formatTakaOrUndefined(undefined)).toBeUndefined();
    expect(formatTakaOrUndefined(0)).toBeUndefined();
    expect(formatTakaOrUndefined(125000)).toBe('৳1,250');
  });

  it('refuses fractional taka rather than storing a float amount', () => {
    expect(() => takaToMinorUnits(2490.5)).toThrow(RangeError);
    expect(() => takaToMinorUnits(-10)).toThrow(RangeError);
  });
});

describe('price validation', () => {
  it('rejects a missing, zero or negative selling price', () => {
    for (const priceMinor of [undefined, 0, -100]) {
      expect(validatePricing({ priceMinor }).ok).toBe(false);
    }
  });

  it('rejects a reference price below the selling price', () => {
    const result = validatePricing({ priceMinor: 249000, comparePriceMinor: 199000 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe('comparePriceBelowPrice');
  });

  it('rejects a float amount', () => {
    expect(validatePricing({ priceMinor: 249000.5 }).ok).toBe(false);
  });

  it('accepts a selling price with no reference price', () => {
    expect(validatePricing({ priceMinor: 249000 })).toEqual({ ok: true });
  });
});

describe('savings', () => {
  it('are computed but never rendered — the founder has not approved a claim', () => {
    // Available so a future merchandising decision costs a line of JSX.
    expect(savingsMinor({ priceMinor: 249000, comparePriceMinor: 299000 })).toBe(50000);
    expect(savingsPercent({ priceMinor: 249000, comparePriceMinor: 299000 })).toBe(16);
  });

  it('report nothing when there is no genuine reduction', () => {
    expect(savingsMinor({ priceMinor: 249000, comparePriceMinor: 249000 })).toBeUndefined();
    expect(savingsMinor({ priceMinor: 249000 })).toBeUndefined();
  });

  it('round down so a saving can never be overstated', () => {
    // 16.72% must present as 16, never 17.
    expect(savingsPercent({ priceMinor: 249000, comparePriceMinor: 299000 })).toBe(16);
  });
});
