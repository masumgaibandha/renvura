import { CATALOGUE_AVAILABILITIES, SLUG_PATTERN, type CatalogueAvailability } from '@/lib/catalogue/types';

/**
 * Catalogue discovery — query vocabulary, sanitisation and ordering.
 *
 * **Discovery state lives in the URL**, not in React state: a filtered shop must
 * survive a refresh, a back button, a shared link and a server render. This
 * module is the one place that decides what a valid query *is*, so a page never
 * has to trust `searchParams` and every surface reads the same rules.
 *
 * Everything here is pure and synchronous. No database, no React, no `next/*`.
 *
 * **The UI follows the data.** Only two facets exist because only two are backed
 * by trustworthy fields: the category a founder assigned, and the availability
 * the founder set. There is no rating, brand, material, age, gender or
 * popularity facet because none of those exists as verified data (D-12), and a
 * filter that cannot be honest is worse than no filter.
 */

/* -------------------------------------------------------------------------- */
/* Sort                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Only orderings that can be stated truthfully.
 *
 * Absent by design: "Best selling", "Most popular", "Top rated" — each needs
 * completed-order or review data that does not exist and is never seeded
 * (D-10, D-12). "Newest" is absent too: `createdAt` records when a seed script
 * wrote the row, not when Renvura started stocking the product, so surfacing it
 * as an arrival order would be a fabricated claim.
 */
export const CATALOGUE_SORTS = ['featured', 'price-asc', 'price-desc', 'name-asc'] as const;
export type CatalogueSort = (typeof CATALOGUE_SORTS)[number];

export const DEFAULT_SORT: CatalogueSort = 'featured';

export const SORT_LABELS: Record<CatalogueSort, string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'name-asc': 'Name: A–Z',
};

/* -------------------------------------------------------------------------- */
/* Query shape                                                                 */
/* -------------------------------------------------------------------------- */

export type CatalogueQuery = {
  /** Category slug. Undefined means "every category". */
  category?: string;
  availability?: CatalogueAvailability;
  sort: CatalogueSort;
  /** Free-text search terms, already normalised. Empty means "no search". */
  terms: string[];
};

/** What a page receives from Next: values may be absent, single or repeated. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Splits a raw query into normalised search terms.
 *
 * Lowercased, whitespace-collapsed, deduplicated, and capped — a query is a
 * phrase a parent typed, not an attack surface. The cap matters: each term
 * becomes a regex clause, and an unbounded list of them is a denial-of-service
 * dressed up as a search.
 */
export const MAX_SEARCH_TERMS = 6;
export const MAX_SEARCH_LENGTH = 80;

export function parseSearchTerms(raw: string | undefined): string[] {
  if (typeof raw !== 'string') return [];

  const terms = raw
    .slice(0, MAX_SEARCH_LENGTH)
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  return [...new Set(terms)].slice(0, MAX_SEARCH_TERMS);
}

/** The query as the customer typed it, trimmed for display and for the input. */
export function normaliseSearchInput(raw: string | undefined): string {
  if (typeof raw !== 'string') return '';
  return raw.slice(0, MAX_SEARCH_LENGTH).trim().replace(/\s+/g, ' ');
}

/**
 * Turns untrusted `searchParams` into a query the rest of the system can trust.
 *
 * **Unknown values fail safe to the default rather than erroring.** A stale
 * bookmark, a truncated share link or a crawler probing `?sort=cheapest` should
 * see the normal shop, not a 400 and not an empty grid. The sanitised query is
 * then what the canonical URL is rebuilt from, so a junk parameter cannot mint
 * an indexable variant of the page.
 */
export function parseCatalogueQuery(params: RawSearchParams = {}): CatalogueQuery {
  const rawCategory = first(params.category);
  const rawAvailability = first(params.availability);
  const rawSort = first(params.sort);

  return {
    // Validated against the slug shape, not against the live category list:
    // this module stays pure, and a slug that matches nothing simply returns no
    // products, which the page renders as an honest empty state.
    category:
      typeof rawCategory === 'string' && SLUG_PATTERN.test(rawCategory) ? rawCategory : undefined,
    availability: (CATALOGUE_AVAILABILITIES as readonly string[]).includes(rawAvailability ?? '')
      ? (rawAvailability as CatalogueAvailability)
      : undefined,
    sort: (CATALOGUE_SORTS as readonly string[]).includes(rawSort ?? '')
      ? (rawSort as CatalogueSort)
      : DEFAULT_SORT,
    terms: parseSearchTerms(first(params.q)),
  };
}

export function isFiltered(query: CatalogueQuery): boolean {
  return query.category !== undefined || query.availability !== undefined;
}

export function isDefaultQuery(query: CatalogueQuery): boolean {
  return !isFiltered(query) && query.sort === DEFAULT_SORT && query.terms.length === 0;
}

/**
 * Rebuilds a shop URL from a sanitised query.
 *
 * Every filter link on the page goes through this, so the URLs the site emits
 * are always a canonical, minimal representation — default values are omitted
 * rather than spelled out, and parameters always appear in the same order. That
 * is what stops `?sort=featured` and `?category=x&sort=featured` and
 * `?sort=featured&category=x` becoming three URLs for one page.
 */
export function catalogueHref(
  base: string,
  query: Partial<CatalogueQuery> & { q?: string },
): string {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.availability) params.set('availability', query.availability);
  if (query.sort && query.sort !== DEFAULT_SORT) params.set('sort', query.sort);

  const search = params.toString();
  return search === '' ? base : `${base}?${search}`;
}

/* -------------------------------------------------------------------------- */
/* Ordering                                                                    */
/* -------------------------------------------------------------------------- */

type Sortable = {
  name?: string;
  priceMinor?: number;
  availability?: string | null;
};

const isComingSoon = (product: Sortable) => product.availability === 'coming-soon';

/**
 * Applies a sort, with one rule that matters more than the rest:
 *
 * **A missing price is never treated as zero.** A Coming Soon product has no
 * price, so it cannot participate in a price ordering at all — it sorts *after*
 * every priced product in both directions rather than leading "price: low to
 * high" as if it were free (D-12). "Cheapest first" showing six unpriced
 * products first would be actively misleading.
 *
 * `featured` keeps the catalogue's own order with sellable products first, which
 * is the same grouping the grid uses everywhere else. `name-asc` is deliberately
 * a flat alphabetical list across all products: the label promises A–Z, and
 * silently grouping by availability inside it would not be A–Z.
 *
 * Pure, and sorted on a copy — the caller's array is never mutated.
 */
export function sortProducts<T extends Sortable>(products: T[], sort: CatalogueSort): T[] {
  const copy = [...products];
  const byAvailability = (a: T, b: T) => Number(isComingSoon(a)) - Number(isComingSoon(b));

  switch (sort) {
    case 'price-asc':
    case 'price-desc': {
      const direction = sort === 'price-asc' ? 1 : -1;

      return copy.sort((a, b) => {
        const grouped = byAvailability(a, b);
        if (grouped !== 0) return grouped;

        // Within the unpriced group there is nothing to compare, and within the
        // priced group a missing price would be a data error — keep both stable.
        const left = a.priceMinor;
        const right = b.priceMinor;
        if (typeof left !== 'number' || typeof right !== 'number') return 0;

        return (left - right) * direction;
      });
    }

    case 'name-asc':
      return copy.sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '', 'en', { numeric: true, sensitivity: 'base' }),
      );

    case 'featured':
    default:
      return copy.sort(byAvailability);
  }
}
