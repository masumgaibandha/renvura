import { mayEmitProductSchema } from '@/lib/catalogue/demo';

/**
 * Commerce event payloads — shape only. **Nothing here fires anything.**
 *
 * Phase 10 adds GA4 and Meta Pixel + CAPI with browser/server `event_id`
 * deduplication (§8, D-13). This module exists so that phase has one definition
 * of "what a product event carries" instead of rebuilding it per call site, and
 * — more importantly — so the rule that **demo products emit no analytics** is
 * encoded as data rather than remembered.
 *
 * Deliberately minimal: one builder for the one event this phase could plausibly
 * fire. `AddToCart`, `InitiateCheckout` and `Purchase` arrive with the flows
 * that produce them (Phase 4/7), not speculatively now.
 */

export type ProductEventPayload = {
  content_type: 'product';
  /** Stable identifier — the slug, until real SKUs exist. */
  content_ids: string[];
  content_name: string;
  content_category?: string;
  /** Whole taka, matching what the customer is shown. */
  value: number;
  currency: 'BDT';
};

export type ProductEventInput = {
  slug?: string;
  name?: string;
  categoryLabel?: string;
  priceMinor?: number;
  status?: string;
  isDemo?: boolean;
  availability?: string;
};

/**
 * A `ViewContent` payload, or `undefined` when no event may be sent.
 *
 * Returns `undefined` for a demo product in **any** environment, for anything
 * not `active`, and for anything without a real price — the same conditions
 * that gate `Product`/`Offer` structured data (D-08). A conversion event
 * carrying a synthetic product would poison real campaign data, so the guard is
 * the same one, reused rather than re-implemented.
 */
export function productViewPayload(
  product: ProductEventInput,
): ProductEventPayload | undefined {
  if (!mayEmitProductSchema(product)) return undefined;


  return {
    content_type: 'product',
    content_ids: [product.slug ?? ''],
    content_name: product.name ?? '',
    content_category: product.categoryLabel,
    value: Math.round((product.priceMinor ?? 0) / 100),
    currency: 'BDT',
  };
}

/**
 * Meta's `Search` event payload — shape only. **Nothing here fires anything.**
 *
 * Added in Phase 3 because search now exists and Phase 10 will want to attribute
 * it. Deliberately minimal, and deliberately careful about two things:
 *
 *  - **The query is customer input.** It is trimmed and length-capped here, so
 *    the day this is wired to a network call there is no path by which an
 *    unbounded string leaves the server.
 *  - **Demo results emit nothing.** A search that returned only synthetic
 *    products is not a real search event, and sending one would seed a
 *    retargeting audience with people who looked at products that do not exist
 *    (D-08). The guard is on the results, not on the query.
 */
export type SearchEventPayload = {
  search_string: string;
  content_type: 'product';
  /** Slugs of the results, so a future audience can be built from them. */
  content_ids: string[];
  /** Truthful count of what matched. */
  results: number;
};

export const MAX_TRACKED_QUERY_LENGTH = 80;

export function searchEventPayload(
  query: string,
  results: { slug?: string; isDemo?: boolean }[],
): SearchEventPayload | undefined {
  const search_string = query.trim().slice(0, MAX_TRACKED_QUERY_LENGTH);
  if (search_string === '') return undefined;

  // Any demo product in the results makes the whole event synthetic.
  if (results.some((result) => result.isDemo === true)) return undefined;

  return {
    search_string,
    content_type: 'product',
    content_ids: results.map((result) => result.slug ?? '').filter((slug) => slug !== ''),
    results: results.length,
  };
}
