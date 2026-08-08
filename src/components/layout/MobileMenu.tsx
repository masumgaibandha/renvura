'use client';

import { Button } from '@heroui/react';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { FiChevronDown, FiMenu, FiPhone, FiX } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import type { CategoryNode } from '@/lib/content/storefront';
import type { ResolvedNavItem } from '@/lib/navigation';
import { footerRoutesFor, siteConfig } from '@/lib/site';

/**
 * Mobile navigation drawer — design direction §5.2.
 *
 * Order: Shop · Categories · Shop by Age · Blog · About · Contact · Account ·
 * Wishlist, then the built help routes, then the support number.
 *
 * Items arrive pre-filtered by `resolveNav`, so the drawer cannot list a
 * destination that does not exist (D-15). Help routes are de-duplicated against
 * that list — Contact belongs to both sets and must appear once.
 *
 * HeroUI supplies the trigger button; the panel is plain markup with Escape and
 * focus return. No drawer library is introduced (D-04).
 */
export function MobileMenu({
  items,
  categories = [],
}: {
  items: ResolvedNavItem[];
  categories?: CategoryNode[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const shownHrefs = new Set(items.map((item) => item.href));
  const helpRoutes = footerRoutesFor('help').filter((route) => !shownHrefs.has(route.path));

  /**
   * The Categories entry becomes a flat, indented list rather than a nested
   * accordion.
   *
   * Five shelves fit on one phone screen. An accordion would add a tap, a
   * state machine and an animation to reveal three links — cost without
   * benefit at this catalogue size (§21).
   */
  const showCategories = categories.length > 0;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function linkClass(isActive: boolean) {
    return `flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors ${
      isActive ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:bg-surface-2'
    }`;
  }

  return (
    <div className="md:hidden">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={panelId}
        onPress={() => setOpen((value) => !value)}
        className="-ml-2 min-h-11 min-w-11 text-ink"
      >
        {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
      </Button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-6.25rem)] overflow-y-auto border-b border-line bg-surface shadow-lg"
      >
        <nav aria-label="Mobile" className="p-2 pb-4">
          {items.length > 0 ? (
            <ul className="flex flex-col">
              {items.map((item) => {
                // Categories is not a link on mobile — it labels the shelf list
                // directly below it, so tapping the word would navigate past the
                // very thing it introduces.
                if (item.id === 'categories' && showCategories) {
                  return (
                    <li key={item.id}>
                      <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        {item.label}
                      </p>
                      <ul className="flex flex-col">
                        {categories.flatMap((category) => [
                          <li key={category.slug}>
                            <AppLink
                              href={category.href}
                              onClick={() => setOpen(false)}
                              aria-current={pathname === category.href ? 'page' : undefined}
                              className={linkClass(pathname === category.href)}
                            >
                              {category.name}
                            </AppLink>
                          </li>,
                          ...category.children.map((child) => (
                            <li key={child.slug}>
                              <AppLink
                                href={child.href}
                                onClick={() => setOpen(false)}
                                aria-current={pathname === child.href ? 'page' : undefined}
                                className={`${linkClass(pathname === child.href)} pl-8 text-sm`}
                              >
                                {child.name}
                              </AppLink>
                            </li>
                          )),
                        ])}
                      </ul>
                    </li>
                  );
                }

                return (
                <li key={item.id}>
                  {item.available ? (
                    <AppLink
                      href={item.href}
                      // Closed on click rather than in an effect on `pathname`,
                      // which would cascade an extra render on every navigation.
                      onClick={() => setOpen(false)}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      className={linkClass(pathname === item.href)}
                    >
                      {item.label}
                      {item.hasDropdown ? (
                        <FiChevronDown aria-hidden="true" className="size-4" />
                      ) : null}
                    </AppLink>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="flex cursor-default items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-ink-muted/50"
                    >
                      {item.label}
                      <span className="text-xs font-normal">Coming soon</span>
                    </span>
                  )}
                </li>
                );
              })}
            </ul>
          ) : null}

          {helpRoutes.length > 0 ? (
            <div className="mt-2 border-t border-line pt-2">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Help
              </p>
              <ul className="flex flex-col">
                {helpRoutes.map((route) => (
                  <li key={route.path}>
                    <AppLink
                      href={route.path}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === route.path ? 'page' : undefined}
                      className={linkClass(pathname === route.path)}
                    >
                      {route.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-2 border-t border-line px-4 pt-4">
            <a
              href={siteConfig.phoneHref}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink"
            >
              <FiPhone aria-hidden="true" className="size-4 text-ink-muted" />
              <span className="latin">{siteConfig.phone}</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
