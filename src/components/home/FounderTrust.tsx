import Image from 'next/image';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';

/**
 * The small founder trust row — D-09, design direction §11.
 *
 * Hard limits, deliberately enforced by this component's shape:
 *   photo · name · one credential line · one sentence · one link to /about.
 *
 * It is one row, not full-bleed, never the hero, and always below the product
 * and discovery sections. The full story lives on `/about`.
 *
 * The only person named anywhere on the site is Abdullah Al Masum, with his
 * real credentials. No other named curator exists (the "Farah Karim" figure in
 * the historical design PDF is a mockup placeholder and is not used).
 */
export function FounderTrust() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <Image
            src="/brand/profile-light.png"
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="size-20 shrink-0 rounded-full sm:size-24"
          />

          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Who chooses the products
            </p>
            <p className="latin mt-1.5 text-lg font-semibold text-ink">Abdullah Al Masum</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              M.Ed., Institute of Education and Research, University of Dhaka — early childhood
              care and development, inclusive education.
            </p>
            <AppLink
              href="/about"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-ink-muted"
            >
              Read the founder&rsquo;s story
            </AppLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
