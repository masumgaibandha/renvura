import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrder, getOrderConfirmation, trackOrder } from '@/lib/checkout/order-service';
import { DHAKA_CITY_DELIVERY_CHARGE_MINOR, STANDARD_DELIVERY_CHARGE_MINOR } from '@/lib/checkout/delivery';

/**
 * Integration-style coverage for `createOrder()`/`trackOrder()`/
 * `getOrderConfirmation()` — the one orchestrator every purchase path calls
 * (§11, §30). The database layer is mocked (an in-memory fake for `Order`,
 * stubbed product lookups) because this project's Vitest suite runs without
 * live Atlas credentials (`catalogue-discovery.test.ts` exploits the same
 * absence to test its own fail-safe path) — but the *behaviour* under test
 * here is real: idempotency, order-number uniqueness handling, money totals
 * (including the founder-approved delivery pricing), demo propagation and
 * Coming Soon rejection all run through the actual `createOrder()`
 * implementation, not a re-description of it.
 */

vi.mock('@/lib/db/mongoose', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

const findProductBySlug = vi.fn();
const findDemoProductBySlug = vi.fn();
vi.mock('@/lib/catalogue/repository', () => ({
  findProductBySlug: (...args: unknown[]) => findProductBySlug(...args),
  findDemoProductBySlug: (...args: unknown[]) => findDemoProductBySlug(...args),
}));

type FakeOrder = {
  orderNumber: string;
  idempotencyKey: string;
  customer: { phone: string };
  createdAt: Date;
  [key: string]: unknown;
};

let store: FakeOrder[] = [];

function duplicateKeyError(field: string) {
  const error = new Error(`duplicate key: ${field}`) as Error & { code: number; keyPattern: Record<string, 1> };
  error.code = 11000;
  error.keyPattern = { [field]: 1 };
  return error;
}

vi.mock('@/lib/models/Order', () => ({
  Order: {
    create: vi.fn(async (doc: Record<string, unknown>) => {
      const idempotencyKey = doc.idempotencyKey as string;
      const orderNumber = doc.orderNumber as string;
      if (store.some((o) => o.idempotencyKey === idempotencyKey)) throw duplicateKeyError('idempotencyKey');
      if (store.some((o) => o.orderNumber === orderNumber)) throw duplicateKeyError('orderNumber');
      const created = { ...doc, createdAt: new Date() } as FakeOrder;
      store.push(created);
      return created;
    }),
    findOne: vi.fn((query: Record<string, unknown>) => ({
      lean: vi.fn(async () => {
        if (typeof query.idempotencyKey === 'string') {
          return store.find((o) => o.idempotencyKey === query.idempotencyKey) ?? null;
        }
        if (typeof query.orderNumber === 'string' && typeof query['customer.phone'] === 'string') {
          return (
            store.find(
              (o) => o.orderNumber === query.orderNumber && o.customer.phone === query['customer.phone'],
            ) ?? null
          );
        }
        if (typeof query.orderNumber === 'string') {
          return store.find((o) => o.orderNumber === query.orderNumber) ?? null;
        }
        return null;
      }),
    })),
  },
}));

const availableProduct = {
  _id: '507f1f77bcf86cd799439011',
  slug: 'rainbow-wooden-abacus-and-counting-stacker',
  name: 'Rainbow Wooden Abacus & Counting Stacker',
  priceMinor: 169_000,
  availability: 'available',
  status: 'draft',
  isDemo: true,
  images: [{ url: 'https://example.com/a.jpg', alt: 'Abacus', isPrimary: true }],
};

/** Dhaka City — the ৳80 tier. */
const dhakaCityAddress = { division: 'Dhaka', district: 'Dhaka', upazila: 'Dhaka City', street: 'House 12, Road 3' };
/** Dhaka district but not the city — the ৳150 tier, same as everywhere else. */
const outsideDhakaCityAddress = { division: 'Dhaka', district: 'Dhaka', upazila: 'Savar', street: 'House 4' };

const validInput = {
  customer: { name: 'Fahmida Rahman', phone: '01712345678' },
  shippingAddress: dhakaCityAddress,
  items: [{ slug: availableProduct.slug, quantity: 2 }],
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
};

beforeEach(() => {
  store = [];
  findProductBySlug.mockReset().mockResolvedValue(null);
  findDemoProductBySlug.mockReset().mockResolvedValue(availableProduct);
});

describe('createOrder', () => {
  it('creates a pending COD order with server-computed totals for Dhaka City', async () => {
    const result = await createOrder(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.status).toBe('pending');
    expect(result.order.paymentMethod).toBe('cod');
    expect(result.order.paymentStatus).toBe('pending');
    expect(result.order.subtotalMinor).toBe(338_000);
    expect(result.order.deliveryChargeMinor).toBe(DHAKA_CITY_DELIVERY_CHARGE_MINOR);
    expect(result.order.totalMinor).toBe(338_000 + DHAKA_CITY_DELIVERY_CHARGE_MINOR);
    expect(result.order.codAmountMinor).toBe(result.order.totalMinor);
    expect(result.order.discountMinor).toBe(0);
  });

  it('creates a correctly priced order outside Dhaka City, at the standard rate', async () => {
    const result = await createOrder({ ...validInput, shippingAddress: outsideDhakaCityAddress });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.subtotalMinor).toBe(338_000);
    expect(result.order.deliveryChargeMinor).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
    expect(result.order.totalMinor).toBe(338_000 + STANDARD_DELIVERY_CHARGE_MINOR);
    expect(result.order.codAmountMinor).toBe(result.order.totalMinor);
  });

  it('charges the standard rate for a Dhaka-division district that is not Dhaka City — Gazipur cannot get city pricing', async () => {
    const result = await createOrder({
      ...validInput,
      shippingAddress: { division: 'Dhaka', district: 'Gazipur', upazila: 'Gazipur Sadar', street: 'House 1' },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.deliveryChargeMinor).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
  });

  it('computes total as subtotal + deliveryCharge - discount, with discount currently always zero', async () => {
    const result = await createOrder(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.totalMinor).toBe(
      result.order.subtotalMinor + result.order.deliveryChargeMinor - result.order.discountMinor,
    );
  });

  it('stores the normalised division, district and upazila on the order snapshot', async () => {
    const result = await createOrder(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.shippingAddress).toEqual(dhakaCityAddress);
  });

  it('generates a well-formed, unique order number', async () => {
    const result = await createOrder(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.orderNumber).toMatch(/^RV-\d{6}-[A-Z0-9]{6}$/);
  });

  it('snapshots the product name/price at order time — an order does not read the catalogue live', async () => {
    const result = await createOrder(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.items[0]?.name).toBe(availableProduct.name);
    expect(result.order.items[0]?.unitPriceMinor).toBe(169_000);

    // Prove it really is a snapshot: change what the catalogue would now
    // return, and confirm the already-created order is unaffected — the
    // totals are never recalculated when an existing order is viewed again.
    findDemoProductBySlug.mockResolvedValue({ ...availableProduct, name: 'Renamed', priceMinor: 999_000 });
    const again = await getOrderConfirmation(result.order.orderNumber);
    expect(again?.items[0]?.name).toBe(availableProduct.name);
    expect(again?.items[0]?.unitPriceMinor).toBe(169_000);
    expect(again?.subtotalMinor).toBe(result.order.subtotalMinor);
    expect(again?.totalMinor).toBe(result.order.totalMinor);
  });

  it('rejects a manipulated unit price — only the catalogue price is ever charged', async () => {
    const manipulated = {
      ...validInput,
      items: [{ slug: availableProduct.slug, quantity: 1, unitPriceMinor: 1 }],
    };
    const result = await createOrder(manipulated);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The fake ৳0.01 price never reaches the order — the real ৳1,690 does.
    expect(result.order.items[0]?.unitPriceMinor).toBe(169_000);
  });

  it('ignores a manipulated deliveryCharge/subtotal/totalMinor/codAmountMinor in the request — the schema has no such fields', async () => {
    const manipulated = {
      ...validInput,
      deliveryChargeMinor: 1,
      subtotalMinor: 1,
      totalMinor: 1,
      codAmountMinor: 1,
    };
    const result = await createOrder(manipulated);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.subtotalMinor).toBe(338_000);
    expect(result.order.deliveryChargeMinor).toBe(DHAKA_CITY_DELIVERY_CHARGE_MINOR);
    expect(result.order.totalMinor).toBe(338_000 + DHAKA_CITY_DELIVERY_CHARGE_MINOR);
    expect(result.order.codAmountMinor).toBe(result.order.totalMinor);
  });

  it('rejects a Coming Soon product', async () => {
    findDemoProductBySlug.mockResolvedValue({ ...availableProduct, availability: 'coming-soon', priceMinor: undefined });
    const result = await createOrder(validInput);
    expect(result).toMatchObject({
      ok: false,
      code: 'itemsRejected',
      rejections: [{ slug: availableProduct.slug, code: 'comingSoon' }],
    });
  });

  it('rejects an unknown product', async () => {
    findDemoProductBySlug.mockResolvedValue(null);
    const result = await createOrder(validInput);
    expect(result).toMatchObject({
      ok: false,
      code: 'itemsRejected',
      rejections: [{ slug: availableProduct.slug, code: 'productNotFound' }],
    });
  });

  it('rejects malformed input before touching the database', async () => {
    const result = await createOrder({ ...validInput, customer: { name: '', phone: 'bad' } });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
    expect(findDemoProductBySlug).not.toHaveBeenCalled();
  });

  it('rejects a real district paired with the wrong division before pricing is ever calculated', async () => {
    const result = await createOrder({
      ...validInput,
      shippingAddress: { division: 'Rangpur', district: 'Dhaka', upazila: 'Dhaka City', street: 'House 1' },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
    expect(findDemoProductBySlug).not.toHaveBeenCalled();
  });

  it('rejects a real upazila paired with the wrong district', async () => {
    const result = await createOrder({
      ...validInput,
      shippingAddress: { division: 'Rangpur', district: 'Gaibandha', upazila: 'Savar', street: 'House 1' },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
  });

  it('marks the order demo when the product resolved is demo data', async () => {
    const result = await createOrder(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.order.isDemo).toBe(true);
  });

  it('marks the order real when every product resolved is a real, published product', async () => {
    findDemoProductBySlug.mockResolvedValue(null);
    findProductBySlug.mockResolvedValue({ ...availableProduct, isDemo: false, status: 'active' });
    const result = await createOrder(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.order.isDemo).toBe(false);
  });

  describe('idempotency (§12)', () => {
    it('a duplicate submission with the same key resolves to the same order, not a second one — totals unchanged', async () => {
      const first = await createOrder(validInput);
      const second = await createOrder(validInput);

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (!first.ok || !second.ok) return;
      expect(second.order.orderNumber).toBe(first.order.orderNumber);
      expect(second.order.totalMinor).toBe(first.order.totalMinor);
      expect(second.order.deliveryChargeMinor).toBe(first.order.deliveryChargeMinor);
      expect(store).toHaveLength(1);
    });

    it('a genuinely new attempt (a fresh idempotency key) creates a genuinely new order', async () => {
      const first = await createOrder(validInput);
      const second = await createOrder({ ...validInput, idempotencyKey: '650e8400-e29b-41d4-a716-446655440001' });

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (!first.ok || !second.ok) return;
      expect(second.order.orderNumber).not.toBe(first.order.orderNumber);
      expect(store).toHaveLength(2);
    });
  });
});

describe('trackOrder', () => {
  it('returns the order — including its server-calculated total — when the order number and phone both match', async () => {
    const created = await createOrder(validInput);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await trackOrder({ orderNumber: created.order.orderNumber, phone: validInput.customer.phone });
    expect(result).toMatchObject({
      ok: true,
      order: { orderNumber: created.order.orderNumber, totalMinor: created.order.totalMinor },
    });
  });

  it('rejects a correct order number with the wrong phone — the same as an unknown order', async () => {
    const created = await createOrder(validInput);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const wrongPhone = await trackOrder({ orderNumber: created.order.orderNumber, phone: '01999999999' });
    const unknownOrder = await trackOrder({ orderNumber: 'RV-000101-ZZZZZZ', phone: '01999999999' });

    expect(wrongPhone).toEqual({ ok: false, code: 'notFound' });
    expect(unknownOrder).toEqual({ ok: false, code: 'notFound' });
  });

  it('never leaks internal fields — no idempotency key or Mongo id in the result', async () => {
    const created = await createOrder(validInput);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await trackOrder({ orderNumber: created.order.orderNumber, phone: validInput.customer.phone });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order).not.toHaveProperty('idempotencyKey');
    expect(result.order).not.toHaveProperty('_id');
  });
});

describe('getOrderConfirmation', () => {
  it('returns the order, with its server-calculated totals, by its customer-facing reference alone', async () => {
    const created = await createOrder(validInput);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const order = await getOrderConfirmation(created.order.orderNumber);
    expect(order?.orderNumber).toBe(created.order.orderNumber);
    expect(order?.subtotalMinor).toBe(created.order.subtotalMinor);
    expect(order?.deliveryChargeMinor).toBe(created.order.deliveryChargeMinor);
    expect(order?.totalMinor).toBe(created.order.totalMinor);
    expect(order?.codAmountMinor).toBe(created.order.codAmountMinor);
  });

  it('returns undefined for an unknown reference, never throws', async () => {
    await expect(getOrderConfirmation('RV-000101-ZZZZZZ')).resolves.toBeUndefined();
  });
});
