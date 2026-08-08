'use client';

import { Button, FieldError, Input, Label, Spinner, TextField } from '@heroui/react';
import { useState, type FormEvent } from 'react';
import { formatTaka } from '@/lib/catalogue/price';
import { checkoutErrorMessage } from '@/lib/checkout/validation';
import type { OrderConfirmation } from '@/lib/checkout/order-service';

/**
 * Order tracking — §15, §22. Both the order number and the phone on the
 * order must match before anything is shown; a wrong pairing and an unknown
 * order number produce the identical, deliberately generic result (mirrors
 * `trackOrder()` in `@/lib/checkout/order-service`, which is the actual
 * enforcement — this form only reflects whatever the server decided).
 */
type TrackApiResponse = {
  ok: boolean;
  order?: OrderConfirmation;
  code?: 'validation' | 'notFound' | 'rateLimit' | 'server';
  fieldErrors?: Record<string, string>;
};

export function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [order, setOrder] = useState<OrderConfirmation | undefined>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setFormError(undefined);
    setOrder(undefined);

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });

      const result = (await response.json().catch(() => ({ ok: false }))) as TrackApiResponse;

      if (response.ok && result.ok && result.order) {
        setOrder(result.order);
        return;
      }

      if (response.status === 429) {
        setFormError('Too many attempts just now. Please wait a few minutes and try again.');
        return;
      }

      if (result.code === 'validation' && result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        return;
      }

      // `notFound` and any other failure share one honest, generic message —
      // confirming "that order number exists but the phone is wrong" would
      // hand an attacker exactly the confirmation they are fishing for (§22).
      setFormError(
        'We could not find an order matching that order number and phone. Please check both and try again, or contact us.',
      );
    } catch {
      setFormError('Something went wrong. Please try again, or contact us.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          name="orderNumber"
          value={orderNumber}
          onChange={setOrderNumber}
          isRequired
          isInvalid={Boolean(fieldErrors.orderNumber)}
          className="w-full"
        >
          <Label>Order number</Label>
          <Input placeholder="RV-260808-A1B2C3" className="latin" />
          {fieldErrors.orderNumber ? <FieldError>{checkoutErrorMessage(fieldErrors.orderNumber)}</FieldError> : null}
        </TextField>

        <TextField
          name="phone"
          type="tel"
          value={phone}
          onChange={setPhone}
          isRequired
          isInvalid={Boolean(fieldErrors.phone)}
          autoComplete="tel"
          className="w-full"
        >
          <Label>Phone number used for the order</Label>
          <Input inputMode="tel" placeholder="01XXXXXXXXX" className="latin" />
          {fieldErrors.phone ? <FieldError>{checkoutErrorMessage(fieldErrors.phone)}</FieldError> : null}
        </TextField>

        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" isDisabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" aria-hidden="true" />
              Checking…
            </span>
          ) : (
            'Track order'
          )}
        </Button>
      </form>

      {order ? <TrackResult order={order} /> : null}
    </div>
  );
}

function TrackResult({ order }: { order: OrderConfirmation }) {
  return (
    <div role="status" className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="text-sm text-ink-muted">
        Order <span className="latin font-semibold text-ink">{order.orderNumber}</span>
      </p>
      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
        Status: <span className="text-ink">{order.status}</span>
      </p>

      <ul aria-label="Ordered items" className="mt-4 space-y-2">
        {order.items.map((item) => (
          <li key={`${item.slug}::${item.variantId ?? ''}`} className="flex items-center justify-between text-sm">
            <span className="text-ink">
              {item.name} <span className="text-ink-muted">× {item.quantity}</span>
            </span>
            <span className="latin font-semibold text-ink">{formatTaka(item.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="font-semibold text-ink">Total</span>
        <span className="latin font-bold text-ink">{formatTaka(order.totalMinor)}</span>
      </div>

      {order.courier?.trackingCode ? (
        <p className="mt-3 text-sm text-ink-muted">
          Tracking code: <span className="latin font-semibold text-ink">{order.courier.trackingCode}</span>
        </p>
      ) : null}
    </div>
  );
}
