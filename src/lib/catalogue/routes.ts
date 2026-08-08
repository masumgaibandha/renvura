/**
 * Catalogue route availability.
 *
 * `/products/[slug]` is a dynamic route, so it cannot live in the flat path
 * registry in `@/lib/site`. This is its equivalent: one flag, one helper, so
 * "is the product detail page real yet?" is answered in a single place rather
 * than re-decided by every card that wants to link somewhere.
 *
 * While the flag is off, `productHref()` returns `undefined` and `ProductCard`
 * renders a non-interactive card rather than a link to a route that would 404
 * (D-15, §11.1.1). Phase 2D turned it on, so cards are links again.
 */

/** Built in Phase 2D — see `src/app/products/[slug]/page.tsx`. */
export const PRODUCT_DETAIL_ROUTE_BUILT = true;

export function productHref(slug: string): string | undefined {
  if (!PRODUCT_DETAIL_ROUTE_BUILT) return undefined;
  return slug === '' ? undefined : `/products/${slug}`;
}

/** Built in Phase 3 — see `src/app/category/[slug]/page.tsx`. */
export const CATEGORY_ROUTE_BUILT = true;

export function categoryHref(slug: string): string | undefined {
  if (!CATEGORY_ROUTE_BUILT) return undefined;
  return slug === '' ? undefined : `/category/${slug}`;
}

/**
 * Built in Phase 3, but **deliberately not linked from navigation**.
 *
 * The route resolves a real band and renders honestly, so the architecture is
 * ready. What is missing is the *data*: no product carries a founder-approved
 * age range, so every band page is currently empty. A "Shop by Age" menu of
 * five links to five empty pages is a dead control wearing a useful label
 * (D-15, §11.1.1), so the navigation stays gated on real assignments —
 * `hasAgeAssignments()` — not on the existence of bands.
 */
export const AGE_ROUTE_BUILT = true;

export function ageHref(slug: string): string | undefined {
  if (!AGE_ROUTE_BUILT) return undefined;
  return slug === '' ? undefined : `/age/${slug}`;
}
