'use client';

import { useCart } from '@/lib/cart/context';

/**
 * The cart count badge — gold fill, navy text, as design direction §5.2
 * requires.
 *
 * A small client island inside the otherwise server-rendered header controls.
 * The server has no cart state to render (`localStorage` does not exist on
 * the server), so the badge is simply absent until the client hydrates and
 * reads the real count — no invented number in the meantime (D-12), and
 * `isReady` keeps that gap from ever showing a stale "0".
 */
export function CartCountBadge() {
  const { count, isReady } = useCart();

  if (!isReady || count <= 0) return null;

  return (
    <span className="absolute right-1 top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[0.625rem] font-bold leading-4 text-on-accent">
      {count > 99 ? '99+' : count}
    </span>
  );
}
