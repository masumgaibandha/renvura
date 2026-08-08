'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

/**
 * The one order-submission flow — shared by the full checkout form and the
 * express COD modal, so the request, its error handling and its
 * double-submit guard exist exactly once (§11, §16, §30).
 *
 * **Double-submit protection is a `useRef`, not `useState`.** A second tap
 * that lands before a re-render has committed would read a stale `submitting`
 * value out of state; a ref is read and written synchronously within the same
 * call, so the very first `submit()` call to run wins the race regardless of
 * render timing. The disabled submit button is the second, client-visible
 * layer — the server's `idempotencyKey` uniqueness is the layer that holds
 * even if both of these are somehow bypassed (§12).
 */

export type OrderSubmissionItem = { slug: string; quantity: number; variantId?: string };

export type OrderSubmissionInput = {
  customer: { name: string; phone: string; email?: string };
  shippingAddress: { division: string; district: string; upazila: string; street: string };
  items: OrderSubmissionItem[];
  notes?: string;
  idempotencyKey: string;
};

type OrderApiResponse = {
  ok: boolean;
  orderNumber?: string;
  code?: 'validation' | 'itemsRejected' | 'rateLimit' | 'server';
  fieldErrors?: Record<string, string>;
};

export function useOrderSubmission(onSuccess?: (orderNumber: string) => void) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();

  const resetErrors = useCallback(() => {
    setFieldErrors({});
    setFormError(undefined);
  }, []);

  const submit = useCallback(
    async (input: OrderSubmissionInput) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setFieldErrors({});
      setFormError(undefined);

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        });

        const result = (await response.json().catch(() => ({ ok: false }))) as OrderApiResponse;

        if (response.ok && result.ok && result.orderNumber) {
          onSuccess?.(result.orderNumber);
          router.push(`/order/confirm/${result.orderNumber}`);
          return;
        }

        if (response.status === 429) {
          setFormError('Too many attempts just now. Please wait a few minutes and try again.');
          return;
        }

        if (result.code === 'validation' && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          setFormError('Please check the highlighted fields.');
          return;
        }

        if (result.code === 'itemsRejected') {
          setFormError(
            'One or more items are no longer available at the price shown. Please refresh your cart and try again.',
          );
          return;
        }

        setFormError('Your order could not be placed. Please try again, or call us.');
      } catch {
        setFormError('Your order could not be placed. Please try again, or call us.');
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [router, onSuccess],
  );

  return { submit, submitting, fieldErrors, formError, resetErrors };
}
