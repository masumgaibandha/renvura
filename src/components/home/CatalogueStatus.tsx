import { Bn } from '@/components/ui/Bn';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';

/**
 * Honest catalogue status.
 *
 * Shown only while there is nothing to merchandise. The product, category and
 * age sections above all render nothing on an empty dataset, so without this
 * the homepage would jump from the hero straight to trust content with no
 * explanation. Rather than fill the gap with invented products (D-12) or a
 * fake "coming soon" grid, the page says plainly where things stand.
 *
 * This disappears on its own the moment real products exist — no flag to
 * remember, no copy to remove.
 */
export function CatalogueStatus() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="rounded-2xl border border-line bg-soft-sunshine/45 p-6 sm:p-8">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Where we are
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[1.375rem] leading-tight text-ink sm:text-3xl">
            The shop is being built. Nothing here is a live product offer yet.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Products, prices, delivery and ordering are still being prepared. When they open,
            they will appear here with real details — not estimates.
          </p>
          <Bn as="p" className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            পণ্য, দাম ও ডেলিভারির তথ্য এখনো প্রস্তুত হচ্ছে। প্রস্তুত হলে সঠিক তথ্যসহ এখানেই
            পাওয়া যাবে।
          </Bn>

          <AppLink
            href="/contact"
            // Outline rather than gold: the hero CTA is directly above, and two
            // filled gold buttons in one scroll would compete (design §3.3).
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-navy/25 bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Ask what is coming
          </AppLink>
        </div>
      </Container>
    </section>
  );
}
