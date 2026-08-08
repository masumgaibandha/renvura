import { z } from 'zod';
import { DIVISIONS, districtsForDivision, isValidLocationHierarchy } from '@/lib/checkout/address';
import { MAX_QUANTITY_PER_LINE } from '@/lib/checkout/pricing';
import { SLUG_PATTERN } from '@/lib/catalogue/types';
import { normalizeBangladeshiMobile } from '@/lib/validation/phone';

/**
 * Validates and normalises in one step, so every consumer of `parsed.data`
 * gets the canonical `01XXXXXXXXX` form — never the raw string a customer
 * typed with a `+88` prefix or a stray space (§6, §7.7).
 */
function phoneField() {
  return z
    .string()
    .trim()
    .min(1, 'phoneRequired')
    .transform((value, ctx) => {
      const normalized = normalizeBangladeshiMobile(value);
      if (!normalized) {
        ctx.addIssue({ code: 'custom', message: 'phoneInvalid' });
        return z.NEVER;
      }
      return normalized;
    });
}

/**
 * Checkout input — shared by the full checkout form and the express COD
 * modal, and the only shape `/api/orders` accepts (§5, §16, §22).
 *
 * **There is no price field anywhere in this schema.** A requested item is
 * `{ slug, quantity, variantId? }` — nothing else — so a manipulated request
 * body has no key to set a unit price with; Zod strips anything it does not
 * recognise. Same reasoning for `status`, `paymentStatus`, `total` and every
 * other server-computed field: they are not inputs, so they cannot be
 * supplied as one (§9, §22 "no client-controlled totals/status").
 */

const requestedItemSchema = z.object({
  slug: z.string().trim().regex(SLUG_PATTERN, 'itemInvalid'),
  quantity: z.number().int().min(1, 'quantityInvalid').max(MAX_QUANTITY_PER_LINE, 'quantityInvalid'),
  variantId: z.string().trim().max(60).optional(),
});

const customerSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(100, 'nameTooLong'),
  phone: phoneField(),
  email: z
    .union([z.literal(''), z.email('emailInvalid').max(254, 'emailInvalid')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

/**
 * Division, district and upazila are a dependent hierarchy, not three
 * independent free-text fields (§6): the client only ever offers a district
 * that belongs to the chosen division, and an upazila that belongs to the
 * chosen district (`@/lib/checkout/address`), so a well-formed submission is
 * always a real, correctly nested triple. `superRefine` checks that same
 * nesting again here — the server-side half of the guarantee — and reports
 * the error against whichever level actually broke, not a blanket message.
 */
const shippingAddressSchema = z
  .object({
    division: z.string().trim().min(1, 'divisionRequired'),
    district: z.string().trim().min(1, 'districtRequired'),
    upazila: z.string().trim().min(1, 'upazilaRequired'),
    street: z.string().trim().min(1, 'streetRequired').max(400, 'streetTooLong'),
  })
  .superRefine((value, ctx) => {
    if (isValidLocationHierarchy(value.division, value.district, value.upazila)) return;

    // Walk the hierarchy again to find exactly which level is the problem,
    // so a manipulated "Division: Rangpur, District: Dhaka" request reports
    // on `district`, not a generic address error.
    if (!DIVISIONS.some((division) => division.name === value.division)) {
      ctx.addIssue({ code: 'custom', path: ['division'], message: 'divisionInvalid' });
      return;
    }
    if (!districtsForDivision(value.division).some((district) => district.name === value.district)) {
      ctx.addIssue({ code: 'custom', path: ['district'], message: 'districtInvalid' });
      return;
    }
    ctx.addIssue({ code: 'custom', path: ['upazila'], message: 'upazilaInvalid' });
  });

export const checkoutSchema = z.object({
  customer: customerSchema,
  shippingAddress: shippingAddressSchema,
  items: z.array(requestedItemSchema).min(1, 'itemsRequired').max(30, 'itemsTooMany'),
  /** Client-generated once per checkout attempt — the idempotency key (§12). */
  idempotencyKey: z.uuid('idempotencyKeyInvalid'),
  notes: z.string().trim().max(500, 'notesTooLong').optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, 'orderNumberRequired')
    .max(40, 'orderNumberInvalid')
    .transform((value) => value.toUpperCase()),
  phone: phoneField(),
});

export type TrackOrderInput = z.infer<typeof trackOrderSchema>;

/** Human wording for each validation code. English — the UI language (D-02). */
export const CHECKOUT_ERRORS: Record<string, string> = {
  itemInvalid: 'That item could not be recognised',
  quantityInvalid: 'Please choose a valid quantity',
  itemsRequired: 'Your cart is empty',
  itemsTooMany: 'Please check out in smaller batches',
  nameRequired: 'Please enter your name',
  nameTooLong: 'That name is too long',
  phoneRequired: 'Please enter your phone number',
  phoneInvalid: 'Please enter a valid Bangladeshi mobile number',
  emailInvalid: 'Please enter a valid email address',
  divisionRequired: 'Please choose your division',
  divisionInvalid: 'Please choose a valid division',
  districtRequired: 'Please choose your district',
  districtInvalid: 'Please choose a district that belongs to the selected division',
  upazilaRequired: 'Please choose your upazila',
  upazilaInvalid: 'Please choose an upazila that belongs to the selected district',
  streetRequired: 'Please enter your street address',
  streetTooLong: 'That address is too long',
  notesTooLong: 'That note is too long',
  idempotencyKeyInvalid: 'Something went wrong preparing your order. Please refresh and try again.',
  orderNumberRequired: 'Please enter your order number',
  orderNumberInvalid: 'Please enter a valid order number',
};

export function checkoutErrorMessage(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return CHECKOUT_ERRORS[code] ?? 'Please check this field';
}

/** Maps a Zod error onto `{ field: code }` for the client to translate. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (path !== '' && !(path in errors)) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
