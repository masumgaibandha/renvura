import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { DesktopPrimaryNav } from '@/components/layout/DesktopPrimaryNav';
import { HeaderControls } from '@/components/layout/HeaderControls';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { DesktopSearchField, MobileSearchButton } from '@/components/layout/SearchField';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { getCategoryTree, hasAgeAssignments } from '@/lib/content/storefront';
import {
  headerControlItems,
  isSearchAvailable,
  mobileMenuItems,
  navPreviewEnabled,
  primaryNavItems,
  resolveNav,
} from '@/lib/navigation';

/**
 * Commerce header — design direction §5.2.
 *
 *   announcement bar
 *   main bar    desktop: logo · search · account · wishlist · cart
 *               mobile:  menu · logo · search · cart
 *   primary nav desktop only: Shop · Categories · Shop by Age · Blog · About
 *
 * Availability comes from `@/lib/navigation`, which reads the route registry
 * and the category/age datasets. This component performs no availability checks
 * of its own — that is what keeps "no dead controls" (D-15, §11.1.1) enforced in
 * one place rather than scattered through JSX.
 *
 * In Phase 1 almost every commerce destination is still unbuilt, so the header
 * resolves to logo + About + a real contact action. Each item appears on its own
 * as its phase flips it to `built`, with no change to this file.
 */
export async function Header() {
  const [categories, ageAssignments] = await Promise.all([getCategoryTree(), hasAgeAssignments()]);

  const context = {
    hasCategories: categories.length > 0,
    // Gated on real age *assignments*, not on the existence of bands — see the
    // note in `@/lib/navigation`.
    hasAgeBands: ageAssignments,
  };
  // Server-only: the disabled preview must never be decided in a client bundle.
  const preview = navPreviewEnabled();

  const primaryNav = resolveNav(primaryNavItems, context, preview);
  const menuItems = resolveNav(mobileMenuItems, context, preview);
  const controls = resolveNav(headerControlItems, context, preview);
  const searchAvailable = isSearchAvailable();

  // Contact is not in the agreed primary row, so the header keeps one real
  // action while the commerce controls do not exist yet. It steps aside as soon
  // as they do.
  const showContactCta = controls.length === 0 && !searchAvailable;

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <AnnouncementBar />

      <div className="border-b border-line">
        <Container className="flex h-16 items-center gap-2 sm:gap-4">
          <MobileMenu items={menuItems} categories={categories} />

          <AppLink
            href="/"
            className="inline-flex min-h-11 shrink-0 items-center"
            aria-label="Renvura — home"
          >
            <Logo width={128} height={39} priority />
          </AppLink>

          <DesktopSearchField available={searchAvailable} preview={preview} />

          <div className="ml-auto flex items-center gap-1">
            <MobileSearchButton available={searchAvailable} preview={preview} />
            <HeaderControls items={controls} />
            {showContactCta ? (
              <AppLink
                href="/contact"
                className="hidden min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 sm:inline-flex"
              >
                Talk to us
              </AppLink>
            ) : null}
          </div>
        </Container>
      </div>

      <DesktopPrimaryNav items={primaryNav} categories={categories} />
    </header>
  );
}
