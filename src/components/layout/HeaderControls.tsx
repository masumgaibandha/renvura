import type { IconType } from 'react-icons';
import { FiHeart, FiShoppingCart, FiUser } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import { CartCountBadge } from '@/components/layout/CartCountBadge';
import type { ResolvedNavItem } from '@/lib/navigation';

/**
 * Header icon controls — Account · Wishlist · Cart (design direction §5.2).
 *
 * Account and Wishlist are desktop-only; the mobile bar keeps Cart alone, per
 * the agreed mobile structure (Menu · Logo · Search · Cart).
 *
 * Counts: the wishlist badge (via `counts`) has nothing to supply yet and none
 * is invented — it renders only for a real, positive number (D-12). Cart's
 * count is genuine client state as of Phase 4, so it is a small client island
 * (`CartCountBadge`) rather than a prop this server component could ever see.
 */

const ICONS: Record<string, IconType> = {
  account: FiUser,
  wishlist: FiHeart,
  cart: FiShoppingCart,
};

export function HeaderControls({
  items,
  counts = {},
}: {
  items: ResolvedNavItem[];
  counts?: Record<string, number>;
}) {
  if (items.length === 0) return null;

  return (
    <ul className="flex items-center gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.id] ?? FiUser;
        const count = counts[item.id];
        const hidden = item.showOnMobile === true ? '' : 'hidden md:inline-flex';
        const base = `relative inline-flex size-11 items-center justify-center rounded-xl ${hidden}`;

        return (
          <li key={item.id} className={item.showOnMobile === true ? '' : 'hidden md:block'}>
            {item.available ? (
              <AppLink href={item.href} aria-label={item.label} className={`${base} text-ink`}>
                <Icon aria-hidden="true" className="size-5" />
                {item.id === 'cart' ? (
                  <CartCountBadge />
                ) : typeof count === 'number' && count > 0 ? (
                  <span className="absolute right-1 top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[0.625rem] font-bold leading-4 text-on-accent">
                    {count}
                  </span>
                ) : null}
              </AppLink>
            ) : (
              <span aria-disabled="true" className={`${base} cursor-default text-ink-muted/50`}>
                <Icon aria-hidden="true" className="size-5" />
                <span className="sr-only">{item.label} (coming soon)</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
