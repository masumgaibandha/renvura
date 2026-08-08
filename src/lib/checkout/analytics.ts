import type { CartLine } from '@/lib/cart/types';
import type { OrderConfirmation } from '@/lib/checkout/order-service';

/**
 * Commerce event payloads — shape only. **Nothing here fires anything.**
 *
 * Continues `@/lib/catalogue/analytics`'s pattern (`productViewPayload`,
 * `searchEventPayload`) for the three events Phase 4's flow can now produce:
 * `AddToCart`, `InitiateCheckout` and `Purchase`. Phase 10 wires these to GA4
 * and Meta Pixel + CAPI with `event_id` deduplication; this module exists so
 * that phase has one definition per event instead of rebuilding one per call
 * site, and so "demo activity emits no analytics" is encoded as data rather
 * than remembered at each of the several places these events could fire from.
 *
 * **`purchasePayload` takes the server-created `OrderConfirmation`, never a
 * client-side cart total.** The order is what actually charged the customer
 * (or will, on delivery); a client total is only ever a preview of it (§9,
 * §20).
 */

export type CommerceEventPayload = {
  content_type: 'product';
  content_ids: string[];
  contents: { id: string; quantity: number }[];
  /** Whole taka, matching what the customer is shown — never minor units. */
  value: number;
  currency: 'BDT';
};

function toContents(lines: readonly { slug: string; quantity: number }[]) {
  return lines.map((line) => ({ id: line.slug, quantity: line.quantity }));
}

/**
 * `AddToCart`, for one line at the moment it enters the cart.
 *
 * Guards on the same shape `mayEmitProductSchema` does — a real price, not
 * demo — without importing it directly, because a cart line does not carry
 * `status`/`availability`; `isDemo` and a positive cached price are what a
 * cart line has, and that is enough to make the same call.
 */
export function addToCartPayload(line: Pick<CartLine, 'slug' | 'quantity' | 'priceMinor' | 'isDemo'>): CommerceEventPayload | undefined {
  if (line.isDemo === true) return undefined;
  if (!(line.priceMinor > 0)) return undefined;

  return {
    content_type: 'product',
    content_ids: [line.slug],
    contents: toContents([line]),
    value: Math.round((line.priceMinor * line.quantity) / 100),
    currency: 'BDT',
  };
}

/** `InitiateCheckout`, for the whole cart once checkout begins. */
export function initiateCheckoutPayload(lines: readonly CartLine[]): CommerceEventPayload | undefined {
  if (lines.length === 0) return undefined;
  // Any demo line makes the whole checkout attempt synthetic (D-08) — the
  // same all-or-nothing rule `searchEventPayload` applies to search results.
  if (lines.some((line) => line.isDemo === true)) return undefined;

  const value = lines.reduce((sum, line) => sum + line.priceMinor * line.quantity, 0);

  return {
    content_type: 'product',
    content_ids: lines.map((line) => line.slug),
    contents: toContents(lines),
    value: Math.round(value / 100),
    currency: 'BDT',
  };
}

/**
 * `Purchase`, from the order the server actually created.
 *
 * `order.isDemo` is authoritative here — it is set by `createOrder()` from
 * the real catalogue read, not from anything the client claimed.
 */
export function purchasePayload(order: OrderConfirmation): CommerceEventPayload | undefined {
  if (order.isDemo) return undefined;

  return {
    content_type: 'product',
    content_ids: order.items.map((item) => item.slug),
    contents: toContents(order.items),
    value: Math.round(order.totalMinor / 100),
    currency: 'BDT',
  };
}
