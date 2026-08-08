'use client';

import { usePathname } from 'next/navigation';
import { FiChevronDown } from 'react-icons/fi';
import { CategoryMenu } from '@/components/layout/CategoryMenu';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import type { CategoryNode } from '@/lib/content/storefront';
import type { ResolvedNavItem } from '@/lib/navigation';

/**
 * Desktop primary navigation row — design direction §5.2.
 *
 * Sits below the main header bar: Shop · Categories · Shop by Age · Blog ·
 * About. Items arrive already filtered by `resolveNav`, so this component never
 * decides availability itself.
 *
 * Phase 3 turned the `Categories` trigger into a real disclosure panel. Other
 * `hasDropdown` items still render only the chevron and the ARIA a disclosure
 * needs — "Shop by Age" has no product assignments behind it yet, so it is
 * filtered out upstream rather than opened onto five empty pages.
 *
 * Active state is carried by `aria-current`, a weight change **and** a gold
 * underline, never by colour alone (§3.4).
 */
export function DesktopPrimaryNav({
  items,
  categories = [],
}: {
  items: ResolvedNavItem[];
  categories?: CategoryNode[];
}) {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    <div className="hidden border-b border-line bg-canvas md:block">
      <Container>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1">
            {items.map((item) => {
              const isActive = item.available && pathname === item.href;

              if (!item.available) {
                return (
                  <li key={item.id}>
                    <span
                      aria-disabled="true"
                      className="inline-flex min-h-11 cursor-default select-none items-center gap-1 px-3 text-sm font-medium text-ink-muted/50"
                    >
                      {item.label}
                      {item.hasDropdown ? (
                        <FiChevronDown aria-hidden="true" className="size-3.5" />
                      ) : null}
                      <span className="sr-only">(coming soon)</span>
                    </span>
                  </li>
                );
              }

              // The one trigger with a real panel behind it.
              if (item.id === 'categories' && categories.length > 0) {
                return (
                  <li key={item.id}>
                    <CategoryMenu
                      label={item.label}
                      href={item.href}
                      categories={categories}
                      isActive={pathname.startsWith('/category')}
                    />
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <AppLink
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    aria-haspopup={item.hasDropdown ? 'menu' : undefined}
                    className={`inline-flex min-h-11 items-center gap-1 border-b-2 px-3 text-sm transition-colors ${
                      isActive
                        ? 'border-brand-gold font-semibold text-ink'
                        : 'border-transparent font-medium text-ink-muted hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {item.hasDropdown ? (
                      <FiChevronDown aria-hidden="true" className="size-3.5" />
                    ) : null}
                  </AppLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
    </div>
  );
}
