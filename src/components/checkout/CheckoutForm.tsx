'use client';

import { Button, FieldError, Input, Label, Spinner, TextArea, TextField } from '@heroui/react';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { AddressFields, type AddressValues } from '@/components/checkout/AddressFields';
import { AppLink } from '@/components/ui/AppLink';
import { formatTaka } from '@/lib/catalogue/price';
import { useCart } from '@/lib/cart/context';
import type { CartLine } from '@/lib/cart/types';
import { resolveDeliveryCharge } from '@/lib/checkout/delivery';
import { checkoutErrorMessage } from '@/lib/checkout/validation';
import { useOrderSubmission } from '@/lib/checkout/useOrderSubmission';

/**
 * Full checkout — design direction §17. One page, no wizard: name, phone,
 * optional email, shipping address, an optional delivery note, and the order
 * summary, all visible at once (§5 "keep checkout concise").
 *
 * Guest by default — there is no login step anywhere in this component (§5
 * "guest checkout is allowed and should be the primary Phase 4 path").
 *
 * The delivery fee shown here is a **preview**: `resolveDeliveryCharge()` is
 * the exact same pure function `createOrder()` calls to actually charge the
 * order, so the number displayed and the number billed can never disagree —
 * but only the server's own call ever reaches an order (§3).
 */
const emptyAddress: AddressValues = { division: '', district: '', upazila: '', street: '' };

export function CheckoutForm() {
  const cart = useCart();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const { submit, submitting, fieldErrors, formError } = useOrderSubmission(() => cart.clear());

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<AddressValues>(emptyAddress);
  const [notes, setNotes] = useState('');

  if (!cart.isReady) {
    return (
      <div role="status" aria-live="polite" className="py-10 text-sm text-ink-muted">
        <span className="sr-only">Loading your cart</span>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-soft-sunshine/45 p-6 sm:p-8">
        <h2 className="max-w-2xl font-display text-[1.375rem] leading-tight text-ink sm:text-2xl">
          Your cart is empty.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          Add a product before checking out.
        </p>
        <AppLink
          href="/products"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
        >
          Browse products
        </AppLink>
      </div>
    );
  }

  // A location is "valid enough to price" once every level is chosen — the
  // dependent selects (`AddressFields`) already guarantee district/upazila
  // can only be non-empty once their parent is, so this is equivalent to
  // checking the whole triple.
  const hasValidLocation = address.division !== '' && address.district !== '' && address.upazila !== '';
  const deliveryChargeMinor = hasValidLocation
    ? resolveDeliveryCharge(address.district, address.upazila)
    : undefined;

  const canSubmit =
    name.trim() !== '' && phone.trim() !== '' && hasValidLocation && address.street.trim() !== '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    await submit({
      customer: { name, phone, email: email || undefined },
      shippingAddress: address,
      items: cart.lines.map((line) => ({ slug: line.slug, quantity: line.quantity, variantId: line.variantId })),
      notes: notes || undefined,
      idempotencyKey,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <section>
          <h2 className="font-display text-lg text-ink">Your details</h2>
          <div className="mt-4 space-y-5">
            <TextField
              name="name"
              value={name}
              onChange={setName}
              isRequired
              isInvalid={Boolean(fieldErrors['customer.name'])}
              autoComplete="name"
              className="w-full"
            >
              <Label>Your name</Label>
              <Input placeholder="Your full name" />
              {fieldErrors['customer.name'] ? (
                <FieldError>{checkoutErrorMessage(fieldErrors['customer.name'])}</FieldError>
              ) : null}
            </TextField>

            <TextField
              name="phone"
              type="tel"
              value={phone}
              onChange={setPhone}
              isRequired
              isInvalid={Boolean(fieldErrors['customer.phone'])}
              autoComplete="tel"
              className="w-full"
            >
              <Label>Phone number</Label>
              <Input inputMode="tel" placeholder="01XXXXXXXXX" className="latin" />
              {fieldErrors['customer.phone'] ? (
                <FieldError>{checkoutErrorMessage(fieldErrors['customer.phone'])}</FieldError>
              ) : null}
            </TextField>

            <TextField
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
              isInvalid={Boolean(fieldErrors['customer.email'])}
              autoComplete="email"
              className="w-full"
            >
              <Label>Email (optional)</Label>
              <Input inputMode="email" placeholder="you@example.com" className="latin" />
              {fieldErrors['customer.email'] ? (
                <FieldError>{checkoutErrorMessage(fieldErrors['customer.email'])}</FieldError>
              ) : null}
            </TextField>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">Shipping address</h2>
          <div className="mt-4">
            <AddressFields
              idPrefix="checkout"
              values={address}
              onChange={setAddress}
              errors={{
                division: fieldErrors['shippingAddress.division'],
                district: fieldErrors['shippingAddress.district'],
                upazila: fieldErrors['shippingAddress.upazila'],
                street: fieldErrors['shippingAddress.street'],
              }}
            />
          </div>
        </section>

        <TextField
          name="notes"
          value={notes}
          onChange={setNotes}
          isInvalid={Boolean(fieldErrors.notes)}
          className="w-full"
        >
          <Label>Delivery note (optional)</Label>
          <TextArea rows={2} placeholder="e.g. call before arriving" />
          {fieldErrors.notes ? <FieldError>{checkoutErrorMessage(fieldErrors.notes)}</FieldError> : null}
        </TextField>

        <Button type="submit" variant="primary" size="lg" fullWidth isDisabled={submitting || !canSubmit}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" aria-hidden="true" />
              Placing order…
            </span>
          ) : (
            'Place order'
          )}
        </Button>
      </form>

      <OrderSummary lines={cart.lines} subtotalMinor={cart.subtotalMinor} deliveryChargeMinor={deliveryChargeMinor} />
    </div>
  );
}

function OrderSummary({
  lines,
  subtotalMinor,
  deliveryChargeMinor,
}: {
  lines: CartLine[];
  subtotalMinor: number;
  /** Undefined until the shipping address is valid enough to price (§4) — never guessed. */
  deliveryChargeMinor: number | undefined;
}) {
  const totalMinor = deliveryChargeMinor !== undefined ? subtotalMinor + deliveryChargeMinor : undefined;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
      <h2 className="font-display text-lg text-ink">Order summary</h2>

      <ul aria-label="Items in your order" className="mt-4 space-y-3">
        {lines.map((line) => (
          <li key={`${line.slug}::${line.variantId ?? ''}`} className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              {line.imageUrl ? (
                <Image
                  src={line.imageUrl}
                  alt={line.imageAlt ?? ''}
                  fill
                  sizes="48px"
                  className="object-contain object-center"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-ink">{line.name}</p>
              <p className="text-xs text-ink-muted">Qty {line.quantity}</p>
            </div>
            <p className="latin shrink-0 text-sm font-semibold text-ink">
              {formatTaka(line.priceMinor * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="latin font-semibold text-ink">{formatTaka(subtotalMinor)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-muted">Delivery</dt>
          <dd className={deliveryChargeMinor === undefined ? 'text-ink-muted' : 'latin font-semibold text-ink'}>
            {deliveryChargeMinor === undefined ? 'Select your delivery location' : formatTaka(deliveryChargeMinor)}
          </dd>
        </div>
        {totalMinor !== undefined ? (
          <div className="flex items-center justify-between border-t border-line pt-2 text-base">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="latin font-bold text-ink">{formatTaka(totalMinor)}</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs font-medium text-ink-muted">
        Payment: Cash on Delivery
      </p>
    </div>
  );
}
