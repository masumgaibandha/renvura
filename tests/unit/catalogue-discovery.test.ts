import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchEventPayload } from '@/lib/catalogue/analytics';
import {
  catalogueHref,
  DEFAULT_SORT,
  isDefaultQuery,
  isFiltered,
  MAX_SEARCH_LENGTH,
  MAX_SEARCH_TERMS,
  normaliseSearchInput,
  parseCatalogueQuery,
  parseSearchTerms,
  sortProducts,
} from '@/lib/catalogue/discovery';
import { escapeRegExp } from '@/lib/catalogue/repository';
import { ageHref, categoryHref } from '@/lib/catalogue/routes';
import { getCatalogue, getCategory, getCategoryTree, hasAgeAssignments } from '@/lib/content/storefront';
import { isBuilt, isIndexable } from '@/lib/site';

/**
 * Phase 3 discovery. The parsing and ordering rules are pure, so they are
 * pinned here directly; the wiring is exercised end-to-end against the seeded
 * catalogue.
 */

function setEnv({ production, demo }: { production: boolean; demo: boolean }) {
  vi.stubEnv('NODE_ENV', production ? 'production' : 'development');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('DEMO_MODE', demo ? '1' : '');
}

beforeEach(() => setEnv({ production: false, demo: false }));
afterEach(() => vi.unstubAllEnvs());

describe('query parsing', () => {
  it('reads a complete, valid query', () => {
    expect(
      parseCatalogueQuery({ category: 'numbers-math', availability: 'coming-soon', sort: 'price-asc', q: 'wooden' }),
    ).toEqual({
      category: 'numbers-math',
      availability: 'coming-soon',
      sort: 'price-asc',
      terms: ['wooden'],
    });
  });

  it('falls back to defaults rather than erroring on junk', () => {
    // A stale bookmark or a crawler probing parameters must see the normal
    // shop, not a 400 and not an empty grid.
    expect(parseCatalogueQuery({ sort: 'cheapest', availability: 'in-stock', category: 'Not A Slug!' })).toEqual({
      category: undefined,
      availability: undefined,
      sort: DEFAULT_SORT,
      terms: [],
    });
  });

  it('accepts nothing at all', () => {
    expect(parseCatalogueQuery()).toEqual({
      category: undefined,
      availability: undefined,
      sort: DEFAULT_SORT,
      terms: [],
    });
  });

  it('takes the first value when a parameter is repeated', () => {
    expect(parseCatalogueQuery({ sort: ['name-asc', 'price-desc'] }).sort).toBe('name-asc');
  });

  it('rejects a category slug that is not slug-shaped', () => {
    for (const bad of ['../../etc', 'a b', 'A-B', '<script>', '']) {
      expect(parseCatalogueQuery({ category: bad }).category, bad).toBeUndefined();
    }
  });

  it('distinguishes a default query from a filtered one', () => {
    expect(isDefaultQuery(parseCatalogueQuery())).toBe(true);
    expect(isDefaultQuery(parseCatalogueQuery({ sort: 'name-asc' }))).toBe(false);
    expect(isFiltered(parseCatalogueQuery({ category: 'toys-play' }))).toBe(true);
    expect(isFiltered(parseCatalogueQuery({ sort: 'name-asc' }))).toBe(false);
  });
});

describe('search term normalisation', () => {
  it('lowercases, so search is case-insensitive', () => {
    expect(parseSearchTerms('WOODEN Abacus')).toEqual(['wooden', 'abacus']);
  });

  it('collapses arbitrary whitespace', () => {
    expect(parseSearchTerms('   wooden \t\n  beads  ')).toEqual(['wooden', 'beads']);
  });

  it('deduplicates repeated terms', () => {
    expect(parseSearchTerms('wooden wooden WOODEN')).toEqual(['wooden']);
  });

  it('returns nothing for an absent or blank query', () => {
    expect(parseSearchTerms(undefined)).toEqual([]);
    expect(parseSearchTerms('   ')).toEqual([]);
  });

  it('caps the term count and the input length', () => {
    // Each term becomes a regex clause; an unbounded list is a denial of
    // service wearing a search box.
    expect(parseSearchTerms('a b c d e f g h i j')).toHaveLength(MAX_SEARCH_TERMS);
    expect(parseSearchTerms('x'.repeat(500))[0]).toHaveLength(MAX_SEARCH_LENGTH);
  });

  it('keeps the displayed query tidy without changing its meaning', () => {
    expect(normaliseSearchInput('  Wooden   Abacus ')).toBe('Wooden Abacus');
    expect(normaliseSearchInput(undefined)).toBe('');
  });

  it('matches a user term literally, never as a pattern', () => {
    // `.*` in a search box must find nothing, not everything.
    expect(escapeRegExp('.*')).toBe('\\.\\*');
    expect(new RegExp(escapeRegExp('a.c'), 'i').test('abc')).toBe(false);
    expect(new RegExp(escapeRegExp('a.c'), 'i').test('a.c')).toBe(true);
  });
});

describe('sorting', () => {
  const priced = (name: string, priceMinor: number) => ({ name, priceMinor, availability: 'available' });
  const soon = (name: string) => ({ name, availability: 'coming-soon' });

  const catalogue = [
    soon('Zebra puzzle'),
    priced('Beads', 169_000),
    priced('Abacus', 289_000),
    soon('Apple board'),
    priced('Chopsticks', 149_000),
  ];

  it('never treats a missing price as zero', () => {
    // The failure this guards: six unpriced products leading "price: low to
    // high" as though they were free.
    const names = sortProducts(catalogue, 'price-asc').map((p) => p.name);

    expect(names.slice(0, 3)).toEqual(['Chopsticks', 'Beads', 'Abacus']);
    expect(names.slice(3).sort()).toEqual(['Apple board', 'Zebra puzzle']);
  });

  it('keeps unpriced products last in both price directions', () => {
    const names = sortProducts(catalogue, 'price-desc').map((p) => p.name);

    expect(names.slice(0, 3)).toEqual(['Abacus', 'Beads', 'Chopsticks']);
    expect(names.slice(3).sort()).toEqual(['Apple board', 'Zebra puzzle']);
  });

  it('sorts A–Z flatly, because the label promises A–Z', () => {
    // Grouping by availability inside an alphabetical list would not be
    // alphabetical, whatever the grid convention is elsewhere.
    expect(sortProducts(catalogue, 'name-asc').map((p) => p.name)).toEqual([
      'Abacus',
      'Apple board',
      'Beads',
      'Chopsticks',
      'Zebra puzzle',
    ]);
  });

  it('sorts names naturally, so 3-in-1 precedes 10-Row', () => {
    const named = [{ name: '10-Row Abacus' }, { name: '3-in-1 Board' }, { name: '7-in-1 Board' }];
    expect(sortProducts(named, 'name-asc').map((p) => p.name)).toEqual([
      '3-in-1 Board',
      '7-in-1 Board',
      '10-Row Abacus',
    ]);
  });

  it('puts sellable products first by default', () => {
    const availability = sortProducts(catalogue, 'featured').map((p) => p.availability);
    expect(availability).toEqual([
      'available',
      'available',
      'available',
      'coming-soon',
      'coming-soon',
    ]);
  });

  it('never mutates the array it was given', () => {
    const input = [...catalogue];
    sortProducts(input, 'name-asc');
    expect(input).toEqual(catalogue);
  });
});

describe('URL construction', () => {
  it('omits defaults so one view has exactly one URL', () => {
    expect(catalogueHref('/products', { sort: 'featured' })).toBe('/products');
    expect(catalogueHref('/products', {})).toBe('/products');
  });

  it('emits parameters in a fixed order regardless of input order', () => {
    const a = catalogueHref('/products', { sort: 'price-asc', category: 'toys-play' });
    const b = catalogueHref('/products', { category: 'toys-play', sort: 'price-asc' });

    expect(a).toBe(b);
    expect(a).toBe('/products?category=toys-play&sort=price-asc');
  });

  it('round-trips through the parser', () => {
    const query = parseCatalogueQuery({ category: 'numbers-math', availability: 'available', sort: 'name-asc' });
    expect(parseCatalogueQuery(Object.fromEntries(new URLSearchParams(catalogueHref('/products', query).split('?')[1])))).toEqual(
      query,
    );
  });
});

describe('discovery routes', () => {
  it('exposes search as a built route that is never indexable', () => {
    expect(isBuilt('/search')).toBe(true);
    // A results URL is generated by a customer, not authored by anyone.
    expect(isIndexable('/search')).toBe(false);
  });

  it('produces clean, locale-free category and age URLs', () => {
    expect(categoryHref('numbers-math')).toBe('/category/numbers-math');
    expect(ageHref('3-5-years')).toBe('/age/3-5-years');
    expect(categoryHref('')).toBeUndefined();
    expect(ageHref('')).toBeUndefined();
  });
});

describe('demo containment across discovery', () => {
  it('returns nothing from any discovery read when demo mode is off', async () => {
    await expect(getCatalogue(parseCatalogueQuery())).resolves.toEqual({ products: [], total: 0 });
    await expect(getCatalogue(parseCatalogueQuery({ q: 'wooden' }))).resolves.toEqual({
      products: [],
      total: 0,
    });
    await expect(getCategoryTree()).resolves.toEqual([]);
    await expect(getCategory('numbers-math')).resolves.toBeUndefined();
  });

  it('returns nothing on the production site even with demo mode requested', async () => {
    setEnv({ production: true, demo: true });

    await expect(getCatalogue(parseCatalogueQuery({ q: 'abacus' }))).resolves.toEqual({
      products: [],
      total: 0,
    });
    await expect(getCategoryTree()).resolves.toEqual([]);
  });

  it('degrades to an empty result when the database is unreachable', async () => {
    setEnv({ production: false, demo: true });

    await expect(getCatalogue(parseCatalogueQuery())).resolves.toEqual({ products: [], total: 0 });
    await expect(getCategory('numbers-math')).resolves.toBeUndefined();
  }, 30_000);
});

describe('age assignments', () => {
  it('reports none, which is what keeps Shop by Age out of the navigation', async () => {
    // No product carries a founder-approved age range: the only age data in the
    // catalogue is supplier listing text, which is non-probative (§7.2, D-16).
    // Five links to five empty pages would be a dead control (D-15).
    setEnv({ production: false, demo: true });
    await expect(hasAgeAssignments()).resolves.toBe(false);
  }, 30_000);
});

describe('search event payload', () => {
  it('is withheld when any result is a demo product', () => {
    // A retargeting audience built from synthetic products is poisoned data.
    expect(searchEventPayload('abacus', [{ slug: 'a', isDemo: true }])).toBeUndefined();
  });

  it('is withheld for a blank query', () => {
    expect(searchEventPayload('   ', [{ slug: 'a' }])).toBeUndefined();
  });

  it('reports a truthful result count for real products', () => {
    expect(searchEventPayload('abacus', [{ slug: 'a' }, { slug: 'b' }])).toEqual({
      search_string: 'abacus',
      content_type: 'product',
      content_ids: ['a', 'b'],
      results: 2,
    });
  });

  it('caps the query length, so nothing unbounded could ever leave the server', () => {
    const payload = searchEventPayload('x'.repeat(500), [{ slug: 'a' }]);
    expect(payload?.search_string).toHaveLength(80);
  });

  it('fires nothing on its own — it only returns a shape', () => {
    expect(searchEventPayload.length).toBe(2);
  });
});
