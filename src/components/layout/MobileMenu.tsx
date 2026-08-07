'use client';

import { Button } from '@heroui/react';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { FiMenu, FiPhone, FiX } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import type { CategoryTile } from '@/lib/content/storefront';
import { footerRoutesFor, headerNavRoutes, siteConfig } from '@/lib/site';

/**
 * Mobile navigation drawer — design direction §5.2.
 *
 * Contains the primary navigation, the category tree when categories exist,
 * help routes and the support phone number. Every entry comes from the route
 * registry or from real category data, so the drawer can never list a route
 * that does not exist (D-15).
 */
export function MobileMenu({ categories }: { categories: CategoryTile[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const helpRoutes = footerRoutesFor('help');

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
    return `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
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
          <ul className="flex flex-col">
            {headerNavRoutes.map((route) => (
              <li key={route.path}>
                <AppLink
                  href={route.path}
                  // Closed on click rather than in an effect on `pathname`,
                  // which would cascade an extra render on every navigation.
                  onClick={() => setOpen(false)}
                  aria-current={pathname === route.path ? 'page' : undefined}
                  className={linkClass(pathname === route.path)}
                >
                  {route.label}
                </AppLink>
              </li>
            ))}
          </ul>

          {categories.length > 0 ? (
            <div className="mt-2 border-t border-line pt-2">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Shop by category
              </p>
              <ul className="flex flex-col">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <AppLink
                      href={category.href}
                      onClick={() => setOpen(false)}
                      className={linkClass(pathname === category.href)}
                    >
                      {category.name}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
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
