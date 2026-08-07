'use client';

import { usePathname } from 'next/navigation';
import type { IconType } from 'react-icons';
import { FiHeart, FiHome, FiSearch, FiShoppingBag, FiShoppingCart } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import type { BottomNavId, ResolvedNavItem } from '@/lib/navigation';

/**
 * Mobile bottom tab bar — Home · Shop · Search · Wishlist · Cart.
 *
 * Mobile only (`md:hidden`); the desktop header carries the same destinations.
 * The bar is fixed, so `app/layout.tsx` reserves matching padding on `<body>` —
 * it must never sit on top of page content or the footer.
 *
 * Restrained by intent: a hairline top border, no elevation, no floating action
 * button, no animation, and labels always visible. Icon-only tabs fail the
 * "colour and shape are not the only carriers of meaning" rule and are harder
 * to scan for a parent on a bus (§3.4, §9).
 *
 * Active state is `aria-current="page"` plus a weight change plus a gold rule
 * above the tab — three signals, none of them colour alone.
 *
 * Tabs arrive pre-filtered by `resolveNav`, so an unbuilt destination is simply
 * not here (D-15, §11.1.1). The bar is omitted entirely below
 * `MIN_BOTTOM_NAV_ITEMS` rather than shipped with a single tab.
 */

const ICONS: Record<BottomNavId, IconType> = {
  home: FiHome,
  shop: FiShoppingBag,
  search: FiSearch,
  wishlist: FiHeart,
  cart: FiShoppingCart,
};

export function MobileBottomNav({ items }: { items: ResolvedNavItem[] }) {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-canvas/85 md:hidden"
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const Icon = ICONS[item.id as BottomNavId] ?? FiHome;
          const isActive = item.available && pathname === item.href;

          const inner = (
            <>
              <span
                aria-hidden="true"
                className={`h-0.5 w-8 rounded-full ${isActive ? 'bg-brand-gold' : 'bg-transparent'}`}
              />
              <Icon aria-hidden="true" className="size-5" />
              <span className={`text-[0.625rem] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </>
          );

          const shell =
            'flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 pb-1.5 pt-1';

          return (
            <li key={item.id} className="flex-1">
              {item.available ? (
                <AppLink
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`${shell} ${isActive ? 'text-ink' : 'text-ink-muted'}`}
                >
                  {inner}
                </AppLink>
              ) : (
                <span
                  aria-disabled="true"
                  className={`${shell} cursor-default text-ink-muted/50`}
                >
                  {inner}
                  <span className="sr-only">(coming soon)</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
