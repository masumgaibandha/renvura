/**
 * Order pricing and purchasability — pure, unit-tested, no database.
 *
 * The one place that turns "what the customer asked for" plus "what the
 * catalogue actually says right now" into either a priced order or a specific,
 * honest rejection. `createOrder()` (`@/lib/checkout/order-service`) is the
 * only caller in application code; it does the database reads and hands the
 * plain data in here.
 *
 * **The client never supplies a price.** `RequestedItem` has no price field at
 * all — there is no key for a manipulated request to set. Every taka charged
 * comes from `AuthoritativeProduct`, which the order service reads fresh from
 * MongoDB for every item, every time (§9 money safety).
 */

export const MAX_QUANTITY_PER_LINE = 20;

export type RequestedItem = {
  slug: string;
  quantity: number;
  variantId?: string;
};

/** What the order service reads from the catalogue for one requested slug. */
export type AuthoritativeProduct = {
  /** MongoDB `_id`, as a string — `Order.items[].product` needs a real reference. */
  productId: string;
  slug: string;
  name: string;
  /** Absent or non-positive means "not purchasable", never ৳0 (D-12). */
  priceMinor?: number;
  availability: string;
  status: string;
  isDemo: boolean;
  imageUrl?: string;
  imageAlt?: string;
};

export type PricedLineItem = {
  productId: string;
  slug: string;
  name: string;
  variantId?: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  imageUrl?: string;
  imageAlt?: string;
  isDemo: boolean;
};

export type PurchaseRejectionCode =
  | 'productNotFound'
  | 'comingSoon'
  | 'notPurchasable'
  | 'invalidQuantity'
  | 'missingPrice';

export type PurchaseRejection = { slug: string; code: PurchaseRejectionCode };

export type ValidatePurchaseItemsResult =
  | { ok: true; items: PricedLineItem[]; isDemo: boolean }
  | { ok: false; rejections: PurchaseRejection[] };

/**
 * Prices and validates every requested line against the live catalogue.
 *
 * **All-or-nothing.** A request with one bad line (a Coming Soon product
 * slipped in alongside two good ones, say) is rejected whole — silently
 * dropping the bad line and charging for the rest would let a manipulated
 * request still get *something* through, and it would be surprising for a
 * customer to receive fewer items than the cart showed with no explanation.
 */
export function validatePurchaseItems(
  requested: readonly RequestedItem[],
  products: ReadonlyMap<string, AuthoritativeProduct>,
): ValidatePurchaseItemsResult {
  const rejections: PurchaseRejection[] = [];
  const items: PricedLineItem[] = [];
  let isDemo = false;

  for (const request of requested) {
    const product = products.get(request.slug);

    if (!product) {
      rejections.push({ slug: request.slug, code: 'productNotFound' });
      continue;
    }

    if (product.availability === 'coming-soon') {
      rejections.push({ slug: request.slug, code: 'comingSoon' });
      continue;
    }

    // A product must be a real, published item or a demo record with demo
    // mode already confirmed by the caller (the repository lookup that
    // produced `product` is what enforces that — see the order service).
    if (product.status !== 'active' && !product.isDemo) {
      rejections.push({ slug: request.slug, code: 'notPurchasable' });
      continue;
    }

    if (
      !Number.isInteger(request.quantity) ||
      request.quantity < 1 ||
      request.quantity > MAX_QUANTITY_PER_LINE
    ) {
      rejections.push({ slug: request.slug, code: 'invalidQuantity' });
      continue;
    }

    if (typeof product.priceMinor !== 'number' || !Number.isFinite(product.priceMinor) || product.priceMinor <= 0) {
      rejections.push({ slug: request.slug, code: 'missingPrice' });
      continue;
    }

    if (product.isDemo) isDemo = true;

    items.push({
      productId: product.productId,
      slug: product.slug,
      name: product.name,
      variantId: request.variantId,
      quantity: request.quantity,
      unitPriceMinor: product.priceMinor,
      lineTotalMinor: product.priceMinor * request.quantity,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      isDemo: product.isDemo,
    });
  }

  if (rejections.length > 0) return { ok: false, rejections };
  return { ok: true, items, isDemo };
}

export type OrderTotals = {
  subtotalMinor: number;
  deliveryChargeMinor: number;
  discountMinor: number;
  totalMinor: number;
  /** What the courier collects on delivery. Equal to the total — Phase 4 has no prepay path. */
  codAmountMinor: number;
};

/**
 * Sums priced lines into the order's money fields.
 *
 * `discountMinor` defaults to 0 — Phase 4 ships no coupon system — but the
 * parameter exists so Phase 15 slots in without reshaping this function.
 */
export function computeOrderTotals(
  items: readonly Pick<PricedLineItem, 'lineTotalMinor'>[],
  deliveryChargeMinor: number,
  discountMinor = 0,
): OrderTotals {
  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  const totalMinor = Math.max(0, subtotalMinor + deliveryChargeMinor - discountMinor);

  return {
    subtotalMinor,
    deliveryChargeMinor,
    discountMinor,
    totalMinor,
    codAmountMinor: totalMinor,
  };
}
