import { AppLink } from '@/components/ui/AppLink';
import {
  catalogueHref,
  CATALOGUE_SORTS,
  SORT_LABELS,
  type CatalogueQuery,
} from '@/lib/catalogue/discovery';
import type { CategoryNode } from '@/lib/content/storefront';

/**
 * Shop filters and sort — design direction §8.3.
 *
 * A **server component**: every filter is a link, so the whole control surface
 * works with no JavaScript, is keyboard operable for free, gives each state a
 * real URL, and ships no client bundle. Only the sort `<select>` is a client
 * component, because a select genuinely needs one.
 *
 * Two facets, and only two, because only two are backed by trustworthy data:
 * the category a founder assigned and the availability a founder set. There is
 * no price facet — five priced products spanning ৳1,490–2,890 is not a range a
 * customer needs help narrowing, and a slider over five values is decoration.
 * There is no rating, brand, material, age or gender facet because none of those
 * exists as verified data (D-12) and inventing one to fill the sidebar is
 * exactly the failure §21 warns about.
 *
 * Selected state is a filled chip **and** `aria-current`, never colour alone
 * (§3.4). Chips scroll horizontally on a phone rather than stacking, so filters
 * never take a screenful of vertical space before the products start.
 */

type Chip = { key: string; label: string; href: string; selected: boolean; indent?: boolean };

export function CatalogueToolbar({
  query,
  categories,
  total,
  basePath = '/products',
}: {
  query: CatalogueQuery;
  categories: CategoryNode[];
  total: number;
  basePath?: string;
}) {
  const href = (patch: Partial<CatalogueQuery>) =>
    catalogueHref(basePath, { ...query, ...patch });

  const categoryChips: Chip[] = [
    {
      key: 'all',
      label: 'All',
      href: href({ category: undefined }),
      selected: query.category === undefined,
    },
    ...categories.flatMap((category) => [
      {
        key: category.slug,
        label: category.name,
        href: href({ category: category.slug }),
        selected: query.category === category.slug,
      },
      ...category.children.map((child) => ({
        key: child.slug,
        label: child.name,
        href: href({ category: child.slug }),
        selected: query.category === child.slug,
        indent: true,
      })),
    ]),
  ];

  const availabilityChips: Chip[] = [
    {
      key: 'any',
      label: 'All',
      href: href({ availability: undefined }),
      selected: query.availability === undefined,
    },
    {
      key: 'available',
      label: 'Available now',
      href: href({ availability: 'available' }),
      selected: query.availability === 'available',
    },
    {
      key: 'coming-soon',
      label: 'Coming soon',
      href: href({ availability: 'coming-soon' }),
      selected: query.availability === 'coming-soon',
    },
  ];

  return (
    <section aria-label="Filter and sort" className="border-y border-line py-4">
      <ChipRow label="Category" chips={categoryChips} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <ChipRow label="Availability" chips={availabilityChips} />

        <div className="flex items-center gap-4">
          {/* A count of what the query actually matched — never padded, and
              never shown as "1 products". */}
          <p aria-live="polite" className="text-xs text-ink-muted">
            {total === 1 ? '1 product' : `${total} products`}
          </p>

          <SortMenu query={query} basePath={basePath} />
        </div>
      </div>
    </section>
  );
}

/**
 * Sort — a native `<details>` disclosure containing one link per ordering.
 *
 * This started as a `<select>` and became links, for a reason worth recording:
 * React 19 intercepts `<form>` submission to support Server Actions, so neither
 * a programmatic `router.push` nor `form.requestSubmit()` from a change handler
 * actually navigated. Rather than fight the framework for a control with four
 * options, sort now works exactly like every other control in this toolbar —
 * a real link to a real URL.
 *
 * What that buys, beyond working: no client component in the discovery UI at
 * all, no hydration cost, keyboard and screen-reader support from the native
 * disclosure, and a shareable URL for every ordering.
 */
function SortMenu({ query, basePath }: { query: CatalogueQuery; basePath: string }) {
  return (
    <details className="relative">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink marker:hidden">
        <span className="text-ink-muted">Sort</span>
        <span className="font-medium">{SORT_LABELS[query.sort]}</span>
        <span aria-hidden="true" className="text-ink-muted">
          ▾
        </span>
      </summary>

      <ul className="absolute right-0 z-30 mt-1 w-max min-w-48 rounded-xl border border-line bg-surface p-1 shadow-lg">
        {CATALOGUE_SORTS.map((sort) => {
          const selected = sort === query.sort;

          return (
            <li key={sort}>
              {/**
               * A plain anchor, not `AppLink`.
               *
               * Inside an open `<details>`, a client-side `next/link`
               * navigation to the same pathname proved unreliable — the panel
               * unmounts as the disclosure re-renders and the navigation is
               * dropped. A full navigation is reliable, and costs nothing here:
               * the page is `force-dynamic`, so the server renders it either
               * way. The filter chips outside the panel keep client navigation.
               */}
              <a
                href={catalogueHref(basePath, { ...query, sort })}
                aria-current={selected ? 'true' : undefined}
                className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  selected ? 'bg-surface-2 font-semibold text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {SORT_LABELS[sort]}
                {selected ? <span className="sr-only"> (selected)</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function ChipRow({ label, chips }: { label: string; chips: Chip[] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <p className="shrink-0 text-xs font-medium text-ink-muted">{label}</p>

      {/* `-mx-1 px-1` keeps the focus ring of the first and last chip from
          being clipped by the scroll container. */}
      <ul className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 py-0.5">
        {chips.map((chip) => (
          <li key={chip.key} className="shrink-0">
            <AppLink
              href={chip.href}
              aria-current={chip.selected ? 'true' : undefined}
              /**
               * `relative` is load-bearing, not decoration.
               *
               * `sr-only` is `position: absolute`. Without a positioned
               * ancestor its containing block is the page, so the hidden
               * "(selected)" text is laid out at the chip's x-offset —
               * *outside* the scroll container that clips the chips — and drags
               * the whole document's scroll width out to it. The page then
               * scrolls sideways, but only when the selected chip happens to be
               * far along the row.
               */
              className={`relative inline-flex min-h-9 items-center rounded-full border px-3.5 text-[0.8125rem] transition-colors ${
                chip.selected
                  ? 'border-brand-navy bg-brand-navy font-semibold text-brand-cream'
                  : 'border-line bg-surface font-medium text-ink-muted hover:border-ink-muted hover:text-ink'
              } ${chip.indent ? 'ml-1' : ''}`}
            >
              {chip.indent ? <span aria-hidden="true" className="mr-1.5 text-ink-muted/60">└</span> : null}
              {chip.label}
              {chip.selected ? <span className="sr-only"> (selected)</span> : null}
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
