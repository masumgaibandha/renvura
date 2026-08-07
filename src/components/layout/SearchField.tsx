import { FiSearch } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';

/**
 * Header search — design direction §5.2.
 *
 * Search is the widest element in the desktop header by design: it is the
 * primary discovery path, and the categories menu is the secondary one.
 *
 * Phase 1 builds no search engine. The field is a plain `GET` form pointed at
 * `/search?q=`, which is exactly what Phase 3 needs — that phase adds the route,
 * the English + Bangla `searchAliases` matching and the suggestions dropdown
 * without touching this component's shape. Until `/search` is in the registry as
 * `built`, nothing renders: a search box that cannot search is the dead control
 * §11.1.1 forbids.
 *
 * `preview` renders the disabled representation permitted for non-public
 * development review only.
 */

const PLACEHOLDER = 'Search products…';

export function DesktopSearchField({
  available,
  preview = false,
}: {
  available: boolean;
  preview?: boolean;
}) {
  if (!available && !preview) return null;

  const shell =
    'flex h-11 w-full items-center gap-2 rounded-xl border border-line bg-surface px-3.5';

  if (!available) {
    return (
      <div className="hidden min-w-0 flex-1 md:block">
        <div aria-disabled="true" className={`${shell} opacity-55`}>
          <FiSearch aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
          <span className="truncate text-sm text-ink-muted">{PLACEHOLDER}</span>
          <span className="sr-only">Search is coming soon</span>
        </div>
      </div>
    );
  }

  return (
    <form action="/search" method="get" role="search" className="hidden min-w-0 flex-1 md:block">
      <div className={shell}>
        <FiSearch aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          id="site-search"
          type="search"
          name="q"
          placeholder={PLACEHOLDER}
          autoComplete="off"
          className="h-full w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
    </form>
  );
}

/** Mobile header search — an icon that opens the full search route on tap. */
export function MobileSearchButton({
  available,
  preview = false,
}: {
  available: boolean;
  preview?: boolean;
}) {
  if (!available && !preview) return null;

  const base = 'inline-flex size-11 items-center justify-center rounded-xl md:hidden';

  if (!available) {
    return (
      <span aria-disabled="true" className={`${base} cursor-default text-ink-muted/50`}>
        <FiSearch aria-hidden="true" className="size-5" />
        <span className="sr-only">Search (coming soon)</span>
      </span>
    );
  }

  return (
    <AppLink href="/search" aria-label="Search products" className={`${base} text-ink`}>
      <FiSearch aria-hidden="true" className="size-5" />
    </AppLink>
  );
}
