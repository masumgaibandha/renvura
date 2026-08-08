import { describe, expect, it } from 'vitest';
import { checkoutSchema, fieldErrorsFrom, trackOrderSchema } from '@/lib/checkout/validation';

const validCheckout = {
  customer: { name: 'Fahmida Rahman', phone: '01712345678', email: 'fahmida@example.com' },
  // A real, correctly nested triple: Savar is a genuine upazila of Dhaka
  // district, which is a genuine district of Dhaka division.
  shippingAddress: { division: 'Dhaka', district: 'Dhaka', upazila: 'Savar', street: 'House 12, Road 3' },
  items: [{ slug: 'rainbow-wooden-abacus-and-counting-stacker', quantity: 2 }],
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
};

describe('checkoutSchema', () => {
  it('accepts a complete, valid checkout', () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it('normalises the phone to 01XXXXXXXXX regardless of how it was typed', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customer: { ...validCheckout.customer, phone: '+880 17-1234-5678' },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.customer.phone).toBe('01712345678');
  });

  it('rejects an invalid Bangladeshi phone', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customer: { ...validCheckout.customer, phone: '0123456789' },
    });
    expect(result.success).toBe(false);
  });

  it('treats email as optional', () => {
    const { email, ...customerWithoutEmail } = validCheckout.customer;
    void email;
    const result = checkoutSchema.safeParse({ ...validCheckout, customer: customerWithoutEmail });
    expect(result.success).toBe(true);
  });

  it('strips a client-supplied price — the schema has no field for one', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      items: [{ slug: 'rainbow-wooden-abacus-and-counting-stacker', quantity: 1, priceMinor: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.items[0]).not.toHaveProperty('priceMinor');
  });

  it('rejects a client-controlled status/total field the same way — there is no such field to set', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, status: 'delivered', totalMinor: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('status');
      expect(result.data).not.toHaveProperty('totalMinor');
    }
  });

  it('requires at least one item', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a quantity above the per-line maximum', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      items: [{ slug: 'rainbow-wooden-abacus-and-counting-stacker', quantity: 21 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-slug-shaped item identifier', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      items: [{ slug: '../../etc/passwd', quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it.each(['division', 'district', 'upazila', 'street'])('requires shippingAddress.%s', (field) => {
    const address = { ...validCheckout.shippingAddress, [field]: '' };
    const result = checkoutSchema.safeParse({ ...validCheckout, shippingAddress: address });
    expect(result.success).toBe(false);
  });

  it('rejects a division outside the eight recognised divisions', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      shippingAddress: { ...validCheckout.shippingAddress, division: 'Atlantis' },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrorsFrom(result.error)['shippingAddress.division']).toBe('divisionInvalid');
  });

  it('rejects a real district paired with the wrong division (§6)', () => {
    // Gaibandha is a real district, but it belongs to Rangpur division, not Dhaka.
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      shippingAddress: { ...validCheckout.shippingAddress, division: 'Dhaka', district: 'Gaibandha' },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrorsFrom(result.error)['shippingAddress.district']).toBe('districtInvalid');
  });

  it('rejects a real upazila paired with the wrong district (§6)', () => {
    // Savar is a real upazila, but it belongs to Dhaka district, not Gaibandha.
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      shippingAddress: {
        division: 'Rangpur',
        district: 'Gaibandha',
        upazila: 'Savar',
        street: validCheckout.shippingAddress.street,
      },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrorsFrom(result.error)['shippingAddress.upazila']).toBe('upazilaInvalid');
  });

  it('rejects an unrecognised district or upazila name outright', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      shippingAddress: { ...validCheckout.shippingAddress, district: 'Not A Real District' },
    });
    expect(result.success).toBe(false);
  });

  it('requires a well-formed idempotency key', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, idempotencyKey: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('reports errors with dotted field paths a form can map back to its inputs', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customer: { ...validCheckout.customer, name: '' },
      shippingAddress: { ...validCheckout.shippingAddress, district: '' },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = fieldErrorsFrom(result.error);
    expect(errors).toMatchObject({
      'customer.name': 'nameRequired',
      'shippingAddress.district': 'districtRequired',
    });
  });
});

describe('trackOrderSchema', () => {
  it('accepts a valid order number and phone', () => {
    const result = trackOrderSchema.safeParse({ orderNumber: 'RV-260808-A2B3C4', phone: '01712345678' });
    expect(result.success).toBe(true);
  });

  it('uppercases the order number for a case-insensitive lookup', () => {
    const result = trackOrderSchema.safeParse({ orderNumber: 'rv-260808-a2b3c4', phone: '01712345678' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.orderNumber).toBe('RV-260808-A2B3C4');
  });

  it('normalises the phone the same way checkout does', () => {
    const result = trackOrderSchema.safeParse({ orderNumber: 'RV-260808-A2B3C4', phone: '+8801712345678' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe('01712345678');
  });

  it('rejects a missing order number or an invalid phone', () => {
    expect(trackOrderSchema.safeParse({ orderNumber: '', phone: '01712345678' }).success).toBe(false);
    expect(trackOrderSchema.safeParse({ orderNumber: 'RV-260808-A2B3C4', phone: 'bad' }).success).toBe(false);
  });
});
