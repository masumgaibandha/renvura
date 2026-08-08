import { connectToDatabase } from '@/lib/db/mongoose';
import { findDemoProductBySlug, findProductBySlug } from '@/lib/catalogue/repository';
import { resolveDeliveryCharge } from '@/lib/checkout/delivery';
import { generateOrderNumber } from '@/lib/checkout/order-number';
import {
  computeOrderTotals,
  validatePurchaseItems,
  type AuthoritativeProduct,
  type OrderTotals,
  type PricedLineItem,
  type PurchaseRejection,
} from '@/lib/checkout/pricing';
import {
  checkoutSchema,
  fieldErrorsFrom,
  trackOrderSchema,
  type CheckoutInput,
} from '@/lib/checkout/validation';
import { Order, type OrderDoc } from '@/lib/models/Order';

/**
 * The one centralised order-creation path — §11, §30.
 *
 * Every purchase surface Phase 4 has (full checkout, the express COD modal)
 * calls this same function with the same input shape. There is deliberately
 * no second order-writing code path: `/api/orders` is a thin wrapper that adds
 * rate limiting and reads the client's IP, and everything that decides whether
 * an order is legitimate and what it costs lives here.
 *
 * Order of operations matters for safety, not just readability:
 *   1. validate the *shape and hierarchy* of the input (Zod) — cheap, no
 *      database; a manipulated Division/District/Upazila triple is rejected
 *      here, before either the catalogue or the delivery charge is touched
 *   2. price every line against the live catalogue (§9) — this is also where
 *      Coming Soon, unknown, and mispriced products are rejected (§18)
 *   3. resolve the delivery charge from the validated address via
 *      `resolveDeliveryCharge()` (`@/lib/checkout/delivery`) — the same
 *      function the checkout UI calls to *display* a fee; only the server's
 *      call ever reaches an order (§3)
 *   4. persist, with idempotency handled at the write itself (§12)
 */

/** No `productId` or `isDemo` — a confirmation page shows customer-facing detail only. */
export type OrderConfirmationItem = Omit<PricedLineItem, 'isDemo' | 'productId'>;

export type OrderConfirmation = {
  orderNumber: string;
  status: OrderDoc['status'];
  paymentMethod: OrderDoc['paymentMethod'];
  paymentStatus: OrderDoc['paymentStatus'];
  customer: { name: string; phone: string; email?: string };
  shippingAddress: OrderDoc['shippingAddress'];
  items: OrderConfirmationItem[];
  subtotalMinor: number;
  deliveryChargeMinor: number;
  discountMinor: number;
  totalMinor: number;
  codAmountMinor: number;
  notes?: string;
  isDemo: boolean;
  createdAt: string;
  /** Empty until Phase 8. Present now so `/track` and the confirmation page need no rework then. */
  courier?: { provider?: string; consignmentId?: string; trackingCode?: string };
};

export type CreateOrderResult =
  | { ok: true; order: OrderConfirmation }
  | { ok: false; code: 'validation'; fieldErrors: Record<string, string> }
  | { ok: false; code: 'itemsRejected'; rejections: PurchaseRejection[] }
  | { ok: false; code: 'server' };

const MAX_ORDER_NUMBER_ATTEMPTS = 5;

function toAuthoritativeProduct(product: {
  _id: unknown;
  slug?: string | null;
  name?: string | null;
  priceMinor?: number | null;
  availability?: string | null;
  status?: string | null;
  isDemo?: boolean | null;
  images?: { url?: string | null; alt?: string | null; isPrimary?: boolean | null }[] | null;
}): AuthoritativeProduct {
  const images = product.images ?? [];
  const primary = images.find((image) => image.isPrimary) ?? images[0];

  return {
    productId: String(product._id),
    slug: product.slug ?? '',
    name: product.name ?? 'Untitled product',
    priceMinor: product.priceMinor ?? undefined,
    availability: product.availability ?? 'available',
    status: product.status ?? 'draft',
    isDemo: product.isDemo === true,
    imageUrl: primary?.url ?? undefined,
    imageAlt: primary?.alt ?? undefined,
  };
}

/**
 * One requested slug → the live product, checking the real catalogue first
 * and falling back to the demo catalogue — the exact resolution order
 * `getProductDetail` uses, so purchasability can never diverge from what the
 * product page just showed the customer (and, in production, the demo
 * fallback always resolves to nothing — D-08).
 */
async function loadAuthoritativeProducts(
  slugs: readonly string[],
): Promise<Map<string, AuthoritativeProduct>> {
  const uniqueSlugs = [...new Set(slugs)];

  const entries = await Promise.all(
    uniqueSlugs.map(async (slug) => {
      const product = (await findProductBySlug(slug)) ?? (await findDemoProductBySlug(slug));
      return product ? ([slug, toAuthoritativeProduct(product)] as const) : undefined;
    }),
  );

  return new Map(entries.filter((entry): entry is readonly [string, AuthoritativeProduct] => entry !== undefined));
}

type MongoDuplicateKeyError = { code?: number; keyPattern?: Record<string, unknown> };

function isDuplicateKeyOn(error: unknown, field: string): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as MongoDuplicateKeyError;
  return candidate.code === 11000 && Boolean(candidate.keyPattern && field in candidate.keyPattern);
}

function toConfirmation(doc: {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customer: { name: string; phone: string; email?: string | null };
  shippingAddress: OrderDoc['shippingAddress'];
  items: OrderDoc['items'];
  subtotalMinor: number;
  deliveryChargeMinor: number;
  discountMinor: number;
  totalMinor: number;
  codAmountMinor: number;
  notes?: string | null;
  isDemo: boolean;
  createdAt?: Date | null;
  courier?: { provider?: string | null; consignmentId?: string | null; trackingCode?: string | null } | null;
}): OrderConfirmation {
  return {
    orderNumber: doc.orderNumber,
    status: doc.status as OrderDoc['status'],
    paymentMethod: doc.paymentMethod as OrderDoc['paymentMethod'],
    paymentStatus: doc.paymentStatus as OrderDoc['paymentStatus'],
    customer: {
      name: doc.customer.name,
      phone: doc.customer.phone,
      email: doc.customer.email ?? undefined,
    },
    shippingAddress: doc.shippingAddress,
    items: doc.items.map((item) => ({
      slug: item.slug,
      name: item.name,
      variantId: item.variantId ?? undefined,
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      lineTotalMinor: item.lineTotalMinor,
      imageUrl: item.imageUrl ?? undefined,
      imageAlt: item.imageAlt ?? undefined,
    })),
    subtotalMinor: doc.subtotalMinor,
    deliveryChargeMinor: doc.deliveryChargeMinor,
    discountMinor: doc.discountMinor,
    totalMinor: doc.totalMinor,
    codAmountMinor: doc.codAmountMinor,
    notes: doc.notes ?? undefined,
    isDemo: doc.isDemo,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
    courier: doc.courier
      ? {
          provider: doc.courier.provider ?? undefined,
          consignmentId: doc.courier.consignmentId ?? undefined,
          trackingCode: doc.courier.trackingCode ?? undefined,
        }
      : undefined,
  };
}

export async function createOrder(rawInput: unknown): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, code: 'validation', fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const input: CheckoutInput = parsed.data;

  try {
    await connectToDatabase();

    const products = await loadAuthoritativeProducts(input.items.map((item) => item.slug));
    const priced = validatePurchaseItems(input.items, products);
    if (!priced.ok) {
      return { ok: false, code: 'itemsRejected', rejections: priced.rejections };
    }

    // The address hierarchy is already known valid (`checkoutSchema`'s
    // `superRefine` checked it above), so `resolveDeliveryCharge` always
    // resolves to a real, founder-approved rate here — never a client value.
    const deliveryChargeMinor = resolveDeliveryCharge(
      input.shippingAddress.district,
      input.shippingAddress.upazila,
    );
    const totals: OrderTotals = computeOrderTotals(priced.items, deliveryChargeMinor);

    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      const orderNumber = generateOrderNumber();

      try {
        const created = await Order.create({
          orderNumber,
          idempotencyKey: input.idempotencyKey,
          customer: input.customer,
          shippingAddress: input.shippingAddress,
          items: priced.items.map((item) => ({
            product: item.productId,
            slug: item.slug,
            name: item.name,
            variantId: item.variantId,
            imageUrl: item.imageUrl,
            imageAlt: item.imageAlt,
            quantity: item.quantity,
            unitPriceMinor: item.unitPriceMinor,
            lineTotalMinor: item.lineTotalMinor,
          })),
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          ...totals,
          status: 'pending',
          notes: input.notes,
          isDemo: priced.isDemo,
        });

        return { ok: true, order: toConfirmation(created) };
      } catch (error) {
        if (isDuplicateKeyOn(error, 'idempotencyKey')) {
          const existing = await Order.findOne({ idempotencyKey: input.idempotencyKey }).lean();
          if (existing) return { ok: true, order: toConfirmation(existing) };
          throw error;
        }

        if (isDuplicateKeyOn(error, 'orderNumber')) {
          continue; // A one-in-a-billion collision — try a fresh number.
        }

        throw error;
      }
    }

    return { ok: false, code: 'server' };
  } catch (error) {
    console.error('[order-service] order creation failed', error);
    return { ok: false, code: 'server' };
  }
}

export type TrackOrderResult =
  | { ok: true; order: OrderConfirmation }
  | { ok: false; code: 'validation'; fieldErrors: Record<string, string> }
  | { ok: false; code: 'notFound' }
  | { ok: false; code: 'server' };

/**
 * Order tracking — §15, §22. **Both** the order number and the phone on the
 * order must match; a correct order number alone is not proof of anything,
 * because unlike `/order/confirm`, `/track` is a page anyone can type an order
 * number into, not a link only the purchaser was ever sent (§22 "brute-force
 * tracking", "no enumerating orders").
 *
 * A wrong phone and an unknown order number get the *same* `notFound` result,
 * deliberately — telling an attacker "that order number is real but the phone
 * is wrong" is a bigger leak than a generic "not found" costs in UX.
 */
export async function trackOrder(rawInput: unknown): Promise<TrackOrderResult> {
  const parsed = trackOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, code: 'validation', fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await connectToDatabase();

    const order = await Order.findOne({
      orderNumber: parsed.data.orderNumber,
      'customer.phone': parsed.data.phone,
    }).lean();

    if (!order) return { ok: false, code: 'notFound' };

    return { ok: true, order: toConfirmation(order) };
  } catch (error) {
    console.error('[order-service] tracking lookup failed', error);
    return { ok: false, code: 'server' };
  }
}

/**
 * One order by its customer-facing reference alone — `/order/confirm/[ref]`.
 *
 * Safe without a phone check because, unlike `/track`, this reference is never
 * typed in: it exists only as the redirect target right after an order is
 * placed, and the six-character suffix (`@/lib/checkout/order-number`) is
 * high-entropy enough that finding one by guessing is not a practical attack
 * for a store this size — the same trust model as an unlisted checkout-session
 * link.
 */
export async function getOrderConfirmation(orderNumber: string): Promise<OrderConfirmation | undefined> {
  try {
    await connectToDatabase();
    const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();
    return order ? toConfirmation(order) : undefined;
  } catch (error) {
    console.error('[order-service] confirmation lookup failed', error);
    return undefined;
  }
}
