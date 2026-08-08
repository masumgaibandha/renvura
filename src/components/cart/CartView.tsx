'use client';

import Image from 'next/image';
import { FiMinus, FiPlus, FiX } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import { formatTaka } from '@/lib/catalogue/price';
import { useCart } from '@/lib/cart/context';
import { MAX_QUANTITY_PER_LINE } from '@/lib/checkout/pricing';
import type { CartLine } from '@/lib/cart/types';

/**
 * The cart — design direction §17. One column on mobile, summary card
 * alongside lines on larger screens. Prices shown here are the display cache
 * `@/lib/cart/context` keeps (§4) — the same figures the product page showed
 * when each line was added; the order the customer actually pays is always
 * repriced from the live catalogue at checkout (§9).
 */
export function CartView() {
  const { lines, isReady, subtotalMinor, updateQuantity, removeLine, clear } = useCart();

  if (!isReady) {
    return (
      <div role="status" aria-live="polite" className="py-10 text-sm text-ink-muted">
        <span className="sr-only">Loading your cart</span>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-soft-sunshine/45 p-6 sm:p-8">
        <h2 className="max-w-2xl font-display text-[1.375rem] leading-tight text-ink sm:text-2xl">
          Your cart is empty.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          Products you add will appear here, ready for checkout.
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

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
      <div>
        <ul aria-label="Cart items" className="divide-y divide-line border-y border-line">
          {lines.map((line) => (
            <CartLineRow
              key={`${line.slug}::${line.variantId ?? ''}`}
              line={line}
              onQuantityChange={(quantity) => updateQuantity(line.slug, quantity, line.variantId)}
              onRemove={() => removeLine(line.slug, line.variantId)}
            />
          ))}
        </ul>

        <button
          type="button"
          onClick={clear}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Empty cart
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg text-ink">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="latin font-semibold text-ink">{formatTaka(subtotalMinor)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">Delivery</dt>
            <dd className="text-ink-muted">Calculated at checkout</dd>
          </div>
        </dl>
        <AppLink
          href="/checkout"
          className="mt-5 flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
        >
          Proceed to checkout
        </AppLink>
      </div>
    </div>
  );
}

function CartLineRow({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = formatTaka(line.priceMinor * line.quantity);

  return (
    <li className="flex gap-4 py-5">
      <AppLink
        href={`/products/${line.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:size-24"
      >
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt={line.imageAlt ?? ''}
            fill
            sizes="96px"
            className="object-contain object-center"
          />
        ) : null}
      </AppLink>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <AppLink
              href={`/products/${line.slug}`}
              className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-navy sm:text-base"
            >
              {line.name}
            </AppLink>
            {line.isDemo ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-brand-navy/85 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-cream">
                Demo
              </span>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={`Remove ${line.name} from cart`}
            onClick={onRemove}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink"
          >
            <FiX aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <div
            role="group"
            aria-label={`Quantity for ${line.name}`}
            className="inline-flex items-center rounded-xl border border-line"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onQuantityChange(line.quantity - 1)}
              className="flex size-10 items-center justify-center text-ink"
            >
              <FiMinus aria-hidden="true" className="size-3.5" />
            </button>
            <span className="latin min-w-8 text-center text-sm font-semibold text-ink" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={line.quantity >= MAX_QUANTITY_PER_LINE}
              onClick={() => onQuantityChange(line.quantity + 1)}
              className="flex size-10 items-center justify-center text-ink disabled:cursor-not-allowed disabled:text-ink-muted/40"
            >
              <FiPlus aria-hidden="true" className="size-3.5" />
            </button>
          </div>

          <p className="latin text-sm font-semibold text-ink sm:text-base">{lineTotal}</p>
        </div>
      </div>
    </li>
  );
}
