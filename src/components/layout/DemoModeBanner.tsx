import { Container } from '@/components/ui/Container';

/**
 * The persistent demo-mode banner required by D-08.
 *
 * "Demo mode is visibly labelled (persistent banner plus per-product marker)
 * and the site emits `noindex, nofollow` and is excluded from the sitemap while
 * it is on."
 *
 * This is the banner half; `ProductCard` carries the per-product marker, and
 * `buildMetadata`/`sitemap.ts` handle the indexing half. The banner deliberately
 * sits above the announcement bar — it is a statement about the whole site, not
 * a piece of storefront chrome, and it must be the first thing seen.
 *
 * Rendered only when `demoModeEnabled()` is true, which is impossible on the
 * production site.
 */
export function DemoModeBanner() {
  return (
    <div className="bg-soft-blush text-brand-navy">
      <Container className="flex min-h-9 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 py-1.5 text-center">
        <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-brand-cream">
          Demo data
        </span>
        <p className="text-xs">
          Products shown here are synthetic development records. Nothing is for sale, and no price
          or detail is real.
        </p>
      </Container>
    </div>
  );
}
