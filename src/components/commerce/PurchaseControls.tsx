'use client';

import { Button, useOverlayState } from '@heroui/react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { ExpressCodModal } from '@/components/commerce/ExpressCodModal';
import { useCart } from '@/lib/cart/context';
import { MAX_QUANTITY_PER_LINE } from '@/lib/checkout/pricing';

/**
 * Add to Cart / Buy Now — product detail page, for `available` products only
 * (§2, §3). Coming Soon products keep the honest "not available yet" panel
 * this replaces (see `PurchaseArea` in the product detail page).
 */
export function PurchaseControls({
  product,
}: {
  product: { slug: string; name: string; priceMinor: number; imageUrl?: string; imageAlt?: string; isDemo?: boolean };
}) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  // Guards against a rapid double-tap adding the line twice before the toast
  // and disabled state have had a chance to render (§2 "prevent duplicate
  // accidental actions").
  const addingRef = useRef(false);
  const expressModal = useOverlayState();
  // Generated at the moment the modal opens — an event handler, not an
  // effect reacting to `isOpen` — so opening it for a second attempt (this
  // product or, after navigating, another) never risks reusing a key an
  // earlier attempt already resolved to an order (§12).
  const [expressIdempotencyKey, setExpressIdempotencyKey] = useState('');

  function openExpressModal() {
    setExpressIdempotencyKey(crypto.randomUUID());
    expressModal.open();
  }

  function handleAddToCart() {
    if (addingRef.current) return;
    addingRef.current = true;

    cart.addLine({
      slug: product.slug,
      quantity,
      name: product.name,
      priceMinor: product.priceMinor,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      isDemo: product.isDemo,
    });

    toast.success(`Added ${quantity > 1 ? `${quantity} × ` : ''}${product.name} to cart`);

    window.setTimeout(() => {
      addingRef.current = false;
    }, 600);
  }

  return (
    <div className="mt-7 space-y-4">
      <div>
        <span id="quantity-label" className="text-sm font-medium text-ink">
          Quantity
        </span>
        <div
          role="group"
          aria-labelledby="quantity-label"
          className="mt-1.5 inline-flex items-center rounded-xl border border-line"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="flex size-11 items-center justify-center text-ink disabled:cursor-not-allowed disabled:text-ink-muted/40"
          >
            <FiMinus aria-hidden="true" className="size-4" />
          </button>
          <span className="latin min-w-10 text-center text-base font-semibold text-ink" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= MAX_QUANTITY_PER_LINE}
            onClick={() => setQuantity((value) => Math.min(MAX_QUANTITY_PER_LINE, value + 1))}
            className="flex size-11 items-center justify-center text-ink disabled:cursor-not-allowed disabled:text-ink-muted/40"
          >
            <FiPlus aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" size="lg" fullWidth onPress={handleAddToCart}>
          Add to Cart
        </Button>
        <Button variant="primary" size="lg" fullWidth onPress={openExpressModal}>
          Order via Cash on Delivery
        </Button>
      </div>

      <ExpressCodModal
        state={expressModal}
        product={product}
        quantity={quantity}
        idempotencyKey={expressIdempotencyKey}
      />
    </div>
  );
}
