import Image from 'next/image';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { AccentToken, CategoryTile } from '@/lib/content/storefront';

/** Pastel surface per category, assigned as data so a category's colour is stable. */
const ACCENT_CLASS: Record<AccentToken, string> = {
  'soft-sky': 'bg-soft-sky',
  'soft-mint': 'bg-soft-mint',
  'soft-blush': 'bg-soft-blush',
  'soft-lavender': 'bg-soft-lavender',
  'soft-sunshine': 'bg-soft-sunshine',
};

/**
 * "Shop by category" — design direction §8.1.
 *
 * Rounded pastel tiles in a single horizontally scrolling row (scroll-snap, no
 * carousel library — D-14). Renders **nothing** when there are no categories:
 * Phase 1 has an empty dataset by design and must not invent sample categories
 * (§11.1.2).
 */
export function CategoryRail({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <SectionHeading eyebrow="Browse" title="Shop by category" />
      </Container>

      <div className="mt-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex snap-x snap-mandatory gap-4 px-5 sm:px-8 lg:mx-auto lg:w-full lg:max-w-5xl">
          {categories.map((category) => (
            <li key={category.slug} className="snap-start">
              <AppLink
                href={category.href}
                className="flex w-24 flex-col items-center gap-2.5 rounded-xl p-1 text-center sm:w-28"
              >
                <span
                  className={`flex size-24 items-center justify-center overflow-hidden rounded-full sm:size-28 ${
                    ACCENT_CLASS[category.accentToken]
                  }`}
                >
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      width={112}
                      height={112}
                      className="size-full object-cover"
                    />
                  ) : null}
                </span>
                <span className="text-sm font-semibold leading-snug text-ink">
                  {category.name}
                </span>
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
