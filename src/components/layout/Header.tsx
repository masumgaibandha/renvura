import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { getCategoryTiles } from '@/lib/content/storefront';
import { headerNavRoutes, isBuilt } from '@/lib/site';

/**
 * Commerce header — design direction §5.2.
 *
 * Structure: announcement bar → sticky header (logo, categories, search,
 * account / wishlist / cart).
 *
 * NO DEAD CONTROLS (D-15, §11.1.1). Search, account, wishlist and cart are
 * rendered **only** when the route behind them exists in the registry. In
 * Phase 1 none of them do, so none of them render — a customer never sees a
 * control that silently does nothing. When Phase 3 flips `/search` to `built`,
 * the search field appears here with no change to this file. The same applies
 * to the categories mega menu, which needs real categories (Phase 2).
 */
export async function Header() {
  const categories = await getCategoryTiles();

  const showCategories = categories.length > 0;
  const showSearch = isBuilt('/search');
  const showAccount = isBuilt('/account');
  const showWishlist = isBuilt('/wishlist');
  const showCart = isBuilt('/cart');
  const hasCommerceControls = showSearch || showAccount || showWishlist || showCart;

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <AnnouncementBar />

      <div className="border-b border-line">
        <Container className="flex h-16 items-center gap-3 sm:gap-5">
          <MobileMenu categories={categories} />

          <AppLink href="/" className="inline-flex min-h-11 shrink-0 items-center" aria-label="Renvura — home">
            <Logo width={128} height={39} priority />
          </AppLink>

          <nav className="hidden md:block" aria-label="Primary">
            <ul className="flex items-center gap-1">
              {headerNavRoutes.map((route) => (
                <li key={route.path}>
                  <AppLink
                    href={route.path}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    {route.label}
                  </AppLink>
                </li>
              ))}
              {showCategories ? (
                <li>
                  <AppLink
                    href="/products"
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    Shop
                  </AppLink>
                </li>
              ) : null}
            </ul>
          </nav>

          {/* Commerce controls appear here as their routes are built (Phases 3–5).
              Until then the header carries one real action instead of a row of
              icons that would do nothing. */}
          <div className="ml-auto flex items-center gap-1">
            {hasCommerceControls ? null : (
              <AppLink
                href="/contact"
                className="hidden min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 sm:inline-flex"
              >
                Talk to us
              </AppLink>
            )}
          </div>
        </Container>
      </div>
    </header>
  );
}
