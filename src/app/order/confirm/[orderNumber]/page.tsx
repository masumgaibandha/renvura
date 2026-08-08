import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { formatTaka } from '@/lib/catalogue/price';
import { getOrderConfirmation, type OrderConfirmation } from '@/lib/checkout/order-service';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * `/order/confirm/[orderNumber]` — §14. Never indexable (§24) and never
 * listed anywhere — reached only by the redirect right after a successful
 * order, or a customer's own bookmark of that link (see the trust-model note
 * in `getOrderConfirmation`).
 *
 * A pure read: this page creates nothing, so refreshing it is always safe —
 * `createOrder()` is the only place an order is ever written (§14 "refresh
 * should not create another order").
 */
type Params = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { orderNumber } = await params;
  return buildMetadata({ path: `/order/confirm/${orderNumber}`, title: 'Order confirmed', noindex: true });
}

export default async function OrderConfirmationPage({ params }: Params) {
  const { orderNumber } = await params;
  const order = await getOrderConfirmation(orderNumber);

  if (!order) notFound();

  return (
    <div className="py-10 sm:py-14">
      <Container className="max-w-2xl">
        {order.isDemo ? (
          <span className="mb-4 inline-flex items-center rounded-full bg-brand-navy px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-cream">
            Demo order — not a real purchase
          </span>
        ) : null}

        <h1 className="font-display text-[1.75rem] leading-[1.15] text-ink sm:text-[2.25rem]">
          Thank you — your order is placed.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Order <span className="latin font-semibold text-ink">{order.orderNumber}</span>
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <StatusRow order={order} />
        </div>

        <section className="mt-8">
          <h2 className="font-display text-lg text-ink">Items</h2>
          <ul aria-label="Ordered items" className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={`${item.slug}::${item.variantId ?? ''}`} className="flex items-center justify-between gap-4 py-3.5 text-sm">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-ink-muted">Qty {item.quantity}</p>
                </div>
                <p className="latin shrink-0 font-semibold text-ink">{formatTaka(item.lineTotalMinor)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="latin font-semibold text-ink">{formatTaka(order.subtotalMinor)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Delivery</dt>
              <dd className="latin font-semibold text-ink">{formatTaka(order.deliveryChargeMinor)}</dd>
            </div>
            {order.discountMinor > 0 ? (
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Discount</dt>
                <dd className="latin font-semibold text-ink">−{formatTaka(order.discountMinor)}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-line pt-2 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="latin font-bold text-ink">{formatTaka(order.totalMinor)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm font-medium text-ink">Payment method: Cash on Delivery</p>
          <p className="mt-1 text-xs text-ink-muted">
            Pay <span className="latin font-semibold">{formatTaka(order.codAmountMinor)}</span> when your order
            arrives.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg text-ink">Delivery to</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {order.customer.name} · <span className="latin">{order.customer.phone}</span>
            <br />
            {order.shippingAddress.street}, {order.shippingAddress.upazila}
            <br />
            {order.shippingAddress.district}, {order.shippingAddress.division}
          </p>
          {order.notes ? <p className="mt-2 text-sm text-ink-muted">Note: {order.notes}</p> : null}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <AppLink
            href="/track"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
          >
            Track this order
          </AppLink>
          <AppLink
            href="/products"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-navy/25 bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Continue shopping
          </AppLink>
        </div>
      </Container>
    </div>
  );
}

const STATUS_COPY: Record<string, string> = {
  pending: 'We have received your order and will confirm it shortly.',
  confirmed: 'Your order is confirmed and being prepared.',
  processing: 'Your order is being packed.',
  shipped: 'Your order is on its way.',
  delivered: 'Your order has been delivered.',
  cancelled: 'This order has been cancelled.',
  returned: 'This order has been returned.',
};

function StatusRow({ order }: { order: OrderConfirmation }) {
  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
        Status: <span className="text-ink">{order.status}</span>
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        {STATUS_COPY[order.status] ?? 'We have received your order.'}
      </p>
    </>
  );
}
