'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import type { CategoryNode } from '@/lib/content/storefront';

/**
 * Desktop "Categories" disclosure — design direction §5.2.
 *
 * A restrained panel, not a mega-menu: an eleven-product store has two top-level
 * shelves and three subcategories, and rendering that as a full-width grid of
 * imagery would be marketplace cosplay. One column per top-level category, its
 * children beneath, and a link to the whole shop.
 *
 * Accessibility, and why the trigger is a link rather than a button:
 *  - `Categories` is a real destination (`/products`), so with JavaScript off,
 *    or for anyone who activates it rather than opening the panel, it navigates
 *    somewhere useful. It is never a control that does nothing (§11.1.1).
 *  - the panel opens on hover **and** on focus, and closes on Escape, on blur
 *    out of the group, and on any pointer press outside
 *  - `aria-expanded` reflects state; everything inside is reachable with Tab
 *    because the panel is only `hidden` when closed, never visually cloaked
 */
export function CategoryMenu({
  label,
  href,
  categories,
  isActive,
}: {
  label: string;
  href: string;
  categories: CategoryNode[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!groupRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={groupRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <AppLink
        href={href}
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={isActive ? 'page' : undefined}
        className={`inline-flex min-h-11 items-center gap-1 border-b-2 px-3 text-sm transition-colors ${
          isActive
            ? 'border-brand-gold font-semibold text-ink'
            : 'border-transparent font-medium text-ink-muted hover:text-ink'
        }`}
      >
        {label}
        <FiChevronDown
          aria-hidden="true"
          className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </AppLink>

      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full z-50 w-max min-w-64 rounded-2xl border border-line bg-surface p-4 shadow-lg"
      >
        <ul className="flex gap-8">
          {categories.map((category) => (
            <li key={category.slug}>
              <AppLink
                href={category.href}
                onClick={() => setOpen(false)}
                className="block rounded px-1 py-1 text-sm font-semibold text-ink transition-colors hover:text-brand-navy"
              >
                {category.name}
              </AppLink>

              {category.children.length > 0 ? (
                <ul className="mt-1.5 flex flex-col">
                  {category.children.map((child) => (
                    <li key={child.slug}>
                      <AppLink
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className="block rounded px-1 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
                      >
                        {child.name}
                      </AppLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="mt-3 border-t border-line pt-3">
          <AppLink
            href="/products"
            onClick={() => setOpen(false)}
            className="inline-flex items-center rounded px-1 py-1 text-sm font-semibold text-brand-navy transition-opacity hover:opacity-75"
          >
            View all products
          </AppLink>
        </div>
      </div>
    </div>
  );
}
