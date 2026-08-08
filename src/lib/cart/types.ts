/**
 * Cart line — client-side only, §4.
 *
 * `slug` (plus `variantId` once variants exist) is what the order service
 * re-reads from MongoDB to price an order; everything else here is a display
 * cache the storefront had on hand when the line was added, shown in the cart
 * for convenience and **never** trusted for money (§9). `createOrder()` never
 * reads `priceMinor` or `name` off a cart line — only `slug`/`variantId`/`quantity`
 * leave the browser as the purchase request (`@/lib/checkout/validation`).
 */
export type CartLine = {
  slug: string;
  variantId?: string;
  quantity: number;
  /** Display cache, captured when added. */
  name: string;
  /** Display cache, minor units (poisha). Not authoritative. */
  priceMinor: number;
  imageUrl?: string;
  imageAlt?: string;
  /** D-08: drives the cart's own demo marker, and keeps demo lines out of any future analytics event. */
  isDemo?: boolean;
};
