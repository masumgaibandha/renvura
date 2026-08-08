import { isProductionSite } from '@/lib/env';
import { isBuilt } from '@/lib/site';

/**
 * The single source of navigation availability.
 *
 * Every navigation surface — desktop primary row, mobile drawer, mobile bottom
 * tab bar, header controls — reads its items from here, so "is this destination
 * real yet?" is answered in one place instead of being re-decided in JSX.
 *
 * An item is shown only when everything it needs exists:
 *
 *   `requiresRoute`  the registry entry must be `built` (`src/lib/site.ts`)
 *   `requiresData`   the dataset behind it must be non-empty
 *
 * Categories and age bands are deliberately data-gated rather than route-gated:
 * they are Phase 2 decisions and must never be hardcoded (D-15, §11.1.2). When
 * the founder's real categories land, those items light up with no change here.
 *
 * NO DEAD CONTROLS (D-15, §11.1.1). An unavailable item is removed from the
 * markup entirely — never rendered as a live-looking control that no-ops. The
 * one sanctioned exception is the disabled preview below.
 */

export type NavDataset = 'categories' | 'ageBands';

/**
 * Phase 3 note on `ageBands`.
 *
 * The requirement is deliberately **not** "age bands exist" but "age bands have
 * products in them". Bands are configuration; assignments are a founder
 * decision that has not been made, and five links to five empty pages is a dead
 * control with a useful-looking label. `NavContext.hasAgeBands` is therefore
 * supplied from `hasAgeAssignments()`, not from the band list.
 */

export type NavItem = {
  id: string;
  /** English label. All navigation chrome is English (D-02, §4.2). */
  label: string;
  /** Destination once the item becomes available. */
  href: string;
  /** Registry path that must be `built` before this item may appear. */
  requiresRoute?: string;
  /** Dataset that must be non-empty before this item may appear. */
  requiresData?: NavDataset;
  /**
   * Marks an item that becomes a dropdown in Phase 2/3. No menu is rendered
   * yet — the flag exists so the trigger markup is already in the right shape.
   */
  hasDropdown?: boolean;
  /** Header controls only: whether the control also appears on mobile. */
  showOnMobile?: boolean;
};

export type ResolvedNavItem = NavItem & { available: boolean };

/** What the data-gated items are waiting for. Both are empty until Phase 2. */
export type NavContext = {
  hasCategories?: boolean;
  hasAgeBands?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Item sets                                                                   */
/* -------------------------------------------------------------------------- */

const SHOP: NavItem = {
  id: 'shop',
  label: 'Shop',
  href: '/products',
  requiresRoute: '/products',
};

// Phase 3 made this a real menu. `href` remains the "browse everything"
// destination, which is what the trigger falls back to for a keyboard user who
// activates it rather than opening the panel, and what it degrades to with no
// JavaScript — so it is never a control that does nothing.
const CATEGORIES: NavItem = {
  id: 'categories',
  label: 'Categories',
  href: '/products',
  requiresRoute: '/products',
  requiresData: 'categories',
  hasDropdown: true,
};

const AGES: NavItem = {
  id: 'ages',
  label: 'Shop by Age',
  href: '/products',
  requiresRoute: '/products',
  requiresData: 'ageBands',
  hasDropdown: true,
};

const BLOG: NavItem = { id: 'blog', label: 'Blog', href: '/blog', requiresRoute: '/blog' };
const ABOUT: NavItem = { id: 'about', label: 'About', href: '/about', requiresRoute: '/about' };
const CONTACT: NavItem = {
  id: 'contact',
  label: 'Contact',
  href: '/contact',
  requiresRoute: '/contact',
};
const ACCOUNT: NavItem = {
  id: 'account',
  label: 'Account',
  href: '/account',
  requiresRoute: '/account',
};
const WISHLIST: NavItem = {
  id: 'wishlist',
  label: 'Wishlist',
  href: '/wishlist',
  requiresRoute: '/wishlist',
};
const CART: NavItem = { id: 'cart', label: 'Cart', href: '/cart', requiresRoute: '/cart' };

/**
 * Desktop primary navigation row.
 *
 * Deliberately excludes "New Arrivals" and "Offers": both are homepage
 * merchandising sections, not destinations, and `/offers` needs a real active
 * campaign before it may be advertised at all (D-12).
 */
export const primaryNavItems: readonly NavItem[] = [SHOP, CATEGORIES, AGES, BLOG, ABOUT];

/** Mobile drawer. Adds the account-ish destinations the top bar has no room for. */
export const mobileMenuItems: readonly NavItem[] = [
  SHOP,
  CATEGORIES,
  AGES,
  BLOG,
  ABOUT,
  CONTACT,
  ACCOUNT,
  WISHLIST,
];

export const BOTTOM_NAV_IDS = ['home', 'shop', 'search', 'wishlist', 'cart'] as const;
export type BottomNavId = (typeof BOTTOM_NAV_IDS)[number];

/** Mobile bottom tab bar. */
export const bottomNavItems: readonly NavItem[] = [
  { id: 'home', label: 'Home', href: '/', requiresRoute: '/' },
  SHOP,
  { id: 'search', label: 'Search', href: '/search', requiresRoute: '/search' },
  WISHLIST,
  CART,
];

/** Header icon controls, right-hand side. Cart is the only one kept on mobile. */
export const headerControlItems: readonly NavItem[] = [
  ACCOUNT,
  WISHLIST,
  { ...CART, showOnMobile: true },
];

/* -------------------------------------------------------------------------- */
/* Resolution                                                                  */
/* -------------------------------------------------------------------------- */

export function isNavItemAvailable(item: NavItem, context: NavContext = {}): boolean {
  if (item.requiresRoute !== undefined && !isBuilt(item.requiresRoute)) return false;
  if (item.requiresData === 'categories' && context.hasCategories !== true) return false;
  if (item.requiresData === 'ageBands' && context.hasAgeBands !== true) return false;
  return true;
}

/**
 * Resolves a set to what may actually be rendered.
 *
 * With `preview` off — the public default — unavailable items are dropped. With
 * it on, they are kept and flagged `available: false` so the caller can render
 * them as genuinely disabled, non-interactive controls.
 */
export function resolveNav(
  items: readonly NavItem[],
  context: NavContext = {},
  preview = false,
): ResolvedNavItem[] {
  return items
    .map((item) => ({ ...item, available: isNavItemAvailable(item, context) }))
    .filter((item) => item.available || preview);
}

/** Search is a route like any other; Phase 3 flips it on. */
export function isSearchAvailable(): boolean {
  return isBuilt('/search');
}

/**
 * A tab bar needs to be a *set* of destinations to earn its place. One tab is
 * not a tab bar, and the bar permanently occupies scarce mobile viewport, so
 * below this threshold it is omitted entirely rather than shipped near-empty.
 * A primary nav row has no such floor — a list of one link is still a list.
 */
export const MIN_BOTTOM_NAV_ITEMS = 2;

export function shouldRenderBottomNav(items: readonly ResolvedNavItem[]): boolean {
  return items.length >= MIN_BOTTOM_NAV_ITEMS;
}

/**
 * §11.1.1 option 2 — the disabled preview of not-yet-built controls, so the
 * header's final proportions can be reviewed before the routes exist.
 *
 * Opt-in via `NAV_PREVIEW=1` in `.env.local`, and **hard-blocked on the real
 * production site** regardless of the flag: the spec says this must never reach
 * a publicly reachable environment.
 *
 * Deliberately *not* a `NEXT_PUBLIC_` variable. This is read only by server
 * components (`Header`, the root layout), which pass the resolved result down,
 * so the flag never enters a client bundle and cannot be flipped from the
 * browser.
 */
export function navPreviewEnabled(): boolean {
  if (isProductionSite()) return false;
  return process.env.NAV_PREVIEW === '1';
}
