import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { AccentToken, AgeBandPill } from '@/lib/content/storefront';

const ACCENT_CLASS: Record<AccentToken, string> = {
  'soft-sky': 'bg-soft-sky',
  'soft-mint': 'bg-soft-mint',
  'soft-blush': 'bg-soft-blush',
  'soft-lavender': 'bg-soft-lavender',
  'soft-sunshine': 'bg-soft-sunshine',
};

/**
 * "Shop by age" — design direction §8.2.
 *
 * Wide, soft-cornered pills, one pastel per band, in a single scrolling row.
 * Deliberately not brush strokes: that is the reference theme's signature (D-11).
 *
 * Age bands are data (§3.3) — the component does not know how many there are
 * and must not hardcode a set. With an empty dataset it renders nothing, which
 * is the correct Phase 1 state (§11.1.2).
 */
export function AgeRail({ bands }: { bands: AgeBandPill[] }) {
  if (bands.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <SectionHeading eyebrow="By age" title="Shop by age" />
      </Container>

      <div className="mt-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex snap-x snap-mandatory gap-3 px-5 sm:px-8 lg:mx-auto lg:w-full lg:max-w-5xl">
          {bands.map((band) => (
            <li key={band.slug} className="snap-start">
              <AppLink
                href={band.href}
                className={`flex min-h-20 w-36 flex-col justify-center rounded-2xl px-4 py-3 transition-opacity hover:opacity-90 sm:w-40 ${
                  ACCENT_CLASS[band.accentToken]
                }`}
              >
                <span className="text-base font-semibold leading-snug text-brand-navy">
                  {band.label}
                </span>
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
