import { isProductionSite } from '@/lib/env';

/**
 * Demo-data containment — docs/LOCKED_DECISIONS.md D-08, §3.5, §12.1.
 *
 * Phase 2 may build against synthetic demo products. The whole permission rests
 * on demo data never being presented as real, and D-08 is explicit that
 * **`isDemo` is a label, not a safety mechanism** — "a flag can be flipped or
 * forgotten; a guard cannot be ignored".
 *
 * So containment is layered, and this module owns three of the layers:
 *
 *   1. Environment separation — demo records live in a separate development
 *      database (`MONGODB_DB_NAME`), never the production cluster.
 *   2. **A runtime guard that fails loudly** if demo mode is on, or any demo
 *      document is active, on the real production site.
 *   3. A query filter that excludes demo records wherever demo mode is off.
 *
 * The remaining layers belong to later phases and are deliberately not built
 * here: the visible demo banner and per-product marker, and the disabling of all
 * external side effects for demo orders (Phase 4/7/8/10).
 */

export class DemoDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoDataError';
  }
}

/**
 * Whether synthetic demo products may exist and be shown.
 *
 * Opt-in via `DEMO_MODE=1`, and **impossible on the real production site**
 * regardless of the flag. Deliberately not a `NEXT_PUBLIC_` variable: it is read
 * on the server only, so it can never be flipped from a browser.
 */
export function demoModeEnabled(): boolean {
  if (isProductionSite()) return false;
  return process.env.DEMO_MODE === '1';
}

/**
 * Fails loudly when demo mode is requested on the production site.
 *
 * Call at the boundary where demo data would be created or served. Throwing is
 * the point: a silent fallback to "demo off" would let a misconfigured
 * production deployment quietly serve fake products, which §12.1 rates as the
 * highest-impact catalogue risk — "fake products shown as real; trust
 * destroyed".
 */
export function assertDemoModeAllowed(): void {
  if (isProductionSite() && process.env.DEMO_MODE === '1') {
    throw new DemoDataError(
      'DEMO_MODE is enabled on the production site. Demo products must never reach production (D-08). Unset DEMO_MODE and purge demo records before deploying.',
    );
  }
}

/**
 * Fails loudly when active demo documents are found on the production site.
 *
 * Complements `assertDemoModeAllowed`: that catches the flag, this catches the
 * data — a record that arrived from a restored dump or a mis-pointed
 * `MONGODB_URI` carries no flag with it.
 */
export function assertNoActiveDemoData(activeDemoCount: number): void {
  if (isProductionSite() && activeDemoCount > 0) {
    throw new DemoDataError(
      `${activeDemoCount} active demo product(s) found on the production site. Demo data must be purged before launch and is a launch-gate check (D-08, §11.2).`,
    );
  }
}

/**
 * Mongo filter fragment that hides demo records unless demo mode is on.
 *
 * Spread into every storefront query. `{ $ne: true }` rather than
 * `{ isDemo: false }` so a legacy document written before the field existed is
 * still treated as real rather than silently disappearing.
 */
export function demoVisibilityFilter(): Record<string, unknown> {
  return demoModeEnabled() ? {} : { isDemo: { $ne: true } };
}

/**
 * Whether a product may be indexed and appear in the sitemap.
 *
 * Demo products are `noindex, nofollow` and excluded from the sitemap for as
 * long as demo mode is on (D-08). Drafts and archived products are never
 * indexed either (§7.1).
 */
export function isProductIndexable(product: {
  status?: string;
  isDemo?: boolean;
}): boolean {
  if (product.isDemo === true) return false;
  return product.status === 'active';
}

/**
 * Whether `Product` / `Offer` structured data may be emitted.
 *
 * Stricter than indexability, and deliberately so: D-08 says the markup is
 * **never** emitted for a demo product **in any environment**, including local
 * development. Support is built and tested in Phase 2 against real sample data,
 * and ships only for real, published, qualifying products (§5.5).
 */
export function mayEmitProductSchema(product: {
  status?: string;
  isDemo?: boolean;
  priceMinor?: number;
}): boolean {
  if (product.isDemo === true) return false;
  if (product.status !== 'active') return false;
  // An Offer needs a real price; there is no such thing as a priceless offer.
  return typeof product.priceMinor === 'number' && product.priceMinor > 0;
}
