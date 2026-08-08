import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { DIVISION_NAMES } from '@/lib/checkout/address';

/**
 * Order — docs/PROJECT_SPECIFICATION.md §7.7, §8; Phase 4 (COD only).
 *
 * **Every money field is server-computed and server-trusted, never client
 * input.** `createOrder()` (`@/lib/checkout/order-service`) is the only writer.
 * The schema itself carries no default that could silently stand in for a real
 * value — `subtotalMinor`/`totalMinor`/etc. are all `required`, so a bug that
 * forgot to compute one fails the write loudly instead of shipping a ৳0 order.
 *
 * `items[].unitPriceMinor` and the product snapshot fields are recorded at the
 * moment of purchase, deliberately duplicating what `Product` already holds —
 * order history must keep reading the price and name a customer actually paid
 * and saw, even after the catalogue changes around it.
 *
 * `idempotencyKey` is unique: a double-submitted "Place Order" click resolves
 * to the same order rather than creating two (§12).
 */

const PAYMENT_METHODS = ['cod'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * COD has no payment gateway callback, so `paymentStatus` stays `pending`
 * through the whole Phase 4 lifecycle — it exists now so Phase 7 (SSLCOMMERZ)
 * and the COD-collected-at-delivery reconciliation both have a field to write
 * to without a schema change.
 */
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** §8: pending → confirmed → processing → shipped → delivered, plus cancelled/returned. */
const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    slug: { type: String, required: true, trim: true },
    /** Product name at purchase time — order history must not depend on the live catalogue. */
    name: { type: String, required: true, trim: true, maxlength: 250 },
    /** Optional: variants exist in the Product schema but none of the seeded catalogue uses one yet. */
    variantId: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    imageAlt: { type: String, trim: true, maxlength: 300 },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    /** Minor units (poisha) — the authoritative price read from the catalogue at order time. */
    unitPriceMinor: { type: Number, required: true, min: 1 },
    lineTotalMinor: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    /** Normalised `01XXXXXXXXX` form — see `@/lib/validation/phone`. */
    phone: { type: String, required: true, trim: true, maxlength: 11 },
    email: { type: String, trim: true, maxlength: 254 },
  },
  { _id: false },
);

/**
 * Division, district and upazila — a real, government-recognised
 * administrative hierarchy, not three free-text fields (§6, §7.7). Only
 * `division` gets a Mongoose `enum` (eight values, cheap); district (64) and
 * upazila (494) are validated against the same canonical dataset at the Zod
 * layer instead (`@/lib/checkout/validation`), which is the boundary every
 * write already passes through via `createOrder()` — an enum this large in
 * the schema itself would just be the same list carried twice.
 */
const shippingAddressSchema = new Schema(
  {
    division: { type: String, required: true, enum: DIVISION_NAMES },
    district: { type: String, required: true, trim: true, maxlength: 100 },
    upazila: { type: String, required: true, trim: true, maxlength: 150 },
    street: { type: String, required: true, trim: true, maxlength: 400 },
  },
  { _id: false },
);

/**
 * Placeholder shape only — Phase 8 fills these in. Present now so an order
 * document's structure does not change when courier integration arrives.
 */
const courierSchema = new Schema(
  {
    provider: { type: String, trim: true },
    consignmentId: { type: String, trim: true },
    trackingCode: { type: String, trim: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    /** Customer-facing reference — never the raw `_id` (§13). `RV-YYMMDD-XXXXXX`. */
    orderNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    /** One request = one order, however many times "Place Order" is tapped (§12). */
    idempotencyKey: { type: String, required: true, unique: true },

    customer: { type: customerSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: 'An order must contain at least one item.',
      },
    },

    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true, default: 'cod' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true, default: 'pending' },

    subtotalMinor: { type: Number, required: true, min: 0 },
    deliveryChargeMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, required: true, min: 0, default: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    /** What the courier collects on delivery. Equal to `totalMinor` — Phase 4 has no prepay path. */
    codAmountMinor: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ORDER_STATUSES, required: true, default: 'pending' },
    courier: { type: courierSchema, default: undefined },

    /** Customer-supplied delivery note, e.g. "call before arriving". Optional, short. */
    notes: { type: String, trim: true, maxlength: 500 },

    /**
     * D-08: an order placed against a demo product is itself demo data. It
     * carries no external side effect today (Phase 4 has none to gate), and
     * later phases (payment capture, courier consignment, SMS, Pixel/CAPI)
     * must each check this before acting, the same way `isDemo` gates every
     * other external effect in the catalogue.
     */
    isDemo: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: 'orders' },
);

// Order lookups happen by orderNumber+phone (/track) or orderNumber alone
// (/order/confirm) — never by listing, so no createdAt-sorted index is needed
// yet. `customer.phone` supports the tracking lookup without a table scan.
orderSchema.index({ 'customer.phone': 1, orderNumber: 1 });
orderSchema.index({ isDemo: 1, status: 1 }, { partialFilterExpression: { isDemo: true } });

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc> | undefined) ??
  mongoose.model<OrderDoc>('Order', orderSchema);
