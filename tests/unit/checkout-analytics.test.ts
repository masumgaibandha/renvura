import { describe, expect, it } from 'vitest';
import { addToCartPayload, initiateCheckoutPayload, purchasePayload } from '@/lib/checkout/analytics';
import type { CartLine } from '@/lib/cart/types';
import type { OrderConfirmation } from '@/lib/checkout/order-service';

/**
 * §20. Nothing here fires a network call — these pin the payload *shape* and,
 * more importantly, the demo-exclusion rule: synthetic activity must never
 * produce a payload a future Phase 10 integration could accidentally send.
 */

const line: CartLine = {
  slug: 'rainbow-wooden-abacus-and-counting-stacker',
  quantity: 2,
  name: 'Rainbow Wooden Abacus & Counting Stacker',
  priceMinor: 169_000,
};

describe('addToCartPayload', () => {
  it('builds a payload in whole taka from a real, priced line', () => {
    expect(addToCartPayload(line)).toEqual({
      content_type: 'product',
      content_ids: [line.slug],
      contents: [{ id: line.slug, quantity: 2 }],
      value: 3380, // (169000 * 2) / 100
      currency: 'BDT',
    });
  });

  it('returns undefined for a demo line', () => {
    expect(addToCartPayload({ ...line, isDemo: true })).toBeUndefined();
  });

  it('returns undefined for a line with no real price', () => {
    expect(addToCartPayload({ ...line, priceMinor: 0 })).toBeUndefined();
  });
});

describe('initiateCheckoutPayload', () => {
  const secondLine: CartLine = {
    slug: 'smart-chopstick-and-clip-bead-math-set',
    quantity: 1,
    name: 'Smart Chopstick & Clip-Bead Math Set',
    priceMinor: 149_000,
  };

  it('builds a payload covering every line in the cart', () => {
    const payload = initiateCheckoutPayload([line, secondLine]);
    expect(payload).toEqual({
      content_type: 'product',
      content_ids: [line.slug, secondLine.slug],
      contents: [
        { id: line.slug, quantity: 2 },
        { id: secondLine.slug, quantity: 1 },
      ],
      value: 4870, // (169000*2 + 149000*1) / 100
      currency: 'BDT',
    });
  });

  it('returns undefined for an empty cart', () => {
    expect(initiateCheckoutPayload([])).toBeUndefined();
  });

  it('returns undefined if any line in the cart is demo — the whole attempt is synthetic', () => {
    expect(initiateCheckoutPayload([line, { ...secondLine, isDemo: true }])).toBeUndefined();
  });
});

describe('purchasePayload', () => {
  const order: OrderConfirmation = {
    orderNumber: 'RV-260808-A2B3C4',
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    customer: { name: 'Fahmida Rahman', phone: '01712345678' },
    shippingAddress: { division: 'Dhaka', district: 'Dhaka', upazila: 'Mirpur', street: 'House 12' },
    items: [
      {
        slug: line.slug,
        name: line.name,
        quantity: 2,
        unitPriceMinor: 169_000,
        lineTotalMinor: 338_000,
      },
    ],
    subtotalMinor: 338_000,
    deliveryChargeMinor: 6_000,
    discountMinor: 0,
    totalMinor: 344_000,
    codAmountMinor: 344_000,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };

  it('takes its value from the server-computed order total, not a client figure', () => {
    const payload = purchasePayload(order);
    expect(payload).toEqual({
      content_type: 'product',
      content_ids: [line.slug],
      contents: [{ id: line.slug, quantity: 2 }],
      value: 3440, // order.totalMinor / 100 — includes delivery, unlike a cart subtotal
      currency: 'BDT',
    });
  });

  it('returns undefined for a demo order', () => {
    expect(purchasePayload({ ...order, isDemo: true })).toBeUndefined();
  });
});
