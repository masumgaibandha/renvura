import { describe, expect, it } from 'vitest';
import {
  bottomNavItems,
  headerControlItems,
  isNavItemAvailable,
  MIN_BOTTOM_NAV_ITEMS,
  mobileMenuItems,
  primaryNavItems,
  resolveNav,
  shouldRenderBottomNav,
  type NavItem,
} from '@/lib/navigation';
import { isBuilt } from '@/lib/site';

/**
 * Navigation availability is centralised (`@/lib/navigation`) precisely so the
 * "no dead controls" rule (D-15, §11.1.1) is enforced in one testable place.
 * These tests pin the agreed structure and the conditions under which an item
 * may be shown at all.
 */

const labelsOf = (items: readonly NavItem[]) => items.map((item) => item.label);

describe('agreed navigation structure', () => {
  it('lists the five primary desktop items in order', () => {
    expect(labelsOf(primaryNavItems)).toEqual([
      'Shop',
      'Categories',
      'Shop by Age',
      'Blog',
      'About',
    ]);
  });

  it('never exposes New Arrivals or Offers as navigation', () => {
    // Both are homepage merchandising sections, not destinations, and `/offers`
    // needs a real active campaign before it may be advertised (D-12).
    for (const set of [primaryNavItems, mobileMenuItems, bottomNavItems, headerControlItems]) {
      expect(labelsOf(set)).not.toContain('New Arrivals');
      expect(labelsOf(set)).not.toContain('Offers');
    }
  });

  it('lists the agreed mobile drawer items', () => {
    expect(labelsOf(mobileMenuItems)).toEqual([
      'Shop',
      'Categories',
      'Shop by Age',
      'Blog',
      'About',
      'Contact',
      'Account',
      'Wishlist',
    ]);
  });

  it('lists the agreed bottom tab bar', () => {
    expect(labelsOf(bottomNavItems)).toEqual(['Home', 'Shop', 'Search', 'Wishlist', 'Cart']);
  });

  it('keeps Account and Wishlist off the mobile top bar, and Cart on it', () => {
    const byId = new Map(headerControlItems.map((item) => [item.id, item]));
    expect(byId.get('cart')?.showOnMobile).toBe(true);
    expect(byId.get('account')?.showOnMobile).toBeUndefined();
    expect(byId.get('wishlist')?.showOnMobile).toBeUndefined();
  });
});

describe('availability', () => {
  it('withholds an item whose route is not built', () => {
    expect(isNavItemAvailable({ id: 'x', label: 'X', href: '/cart', requiresRoute: '/cart' })).toBe(
      false,
    );
  });

  it('allows an item whose route is built', () => {
    expect(
      isNavItemAvailable({ id: 'x', label: 'X', href: '/about', requiresRoute: '/about' }),
    ).toBe(true);
  });

  it('withholds category and age items until real data exists (§11.1.2)', () => {
    const categories = primaryNavItems.find((item) => item.id === 'categories');
    const ages = primaryNavItems.find((item) => item.id === 'ages');

    expect(isNavItemAvailable(categories!, { hasCategories: false })).toBe(false);
    expect(isNavItemAvailable(ages!, { hasAgeBands: false })).toBe(false);

    // Data alone is not enough — the destination route must exist too.
    expect(isNavItemAvailable(categories!, { hasCategories: true })).toBe(isBuilt('/products'));
  });

  it('every item that resolves as available points at a route that exists', () => {
    const everything = [
      ...primaryNavItems,
      ...mobileMenuItems,
      ...bottomNavItems,
      ...headerControlItems,
    ];

    for (const item of everything) {
      if (isNavItemAvailable(item, { hasCategories: true, hasAgeBands: true })) {
        expect(isBuilt(item.href), `${item.label} points at unbuilt ${item.href}`).toBe(true);
      }
    }
  });
});

describe('resolveNav', () => {
  it('drops unavailable items by default — nothing dead reaches the markup', () => {
    const resolved = resolveNav(primaryNavItems, {}, false);

    expect(resolved.every((item) => item.available)).toBe(true);
    // Blog is Phase 9; it must not appear until that route exists.
    expect(labelsOf(resolved)).not.toContain('Blog');
    // Categories and Shop by Age are data-gated, and no categories exist here.
    expect(labelsOf(resolved)).not.toContain('Categories');
    expect(labelsOf(resolved)).not.toContain('Shop by Age');
  });

  it('keeps the destinations that are built today', () => {
    const labels = labelsOf(resolveNav(primaryNavItems, {}, false));

    expect(labels).toContain('About');
    // `/products` went live in Phase 2C, so Shop is now a real destination.
    expect(labels).toContain('Shop');
  });

  it('keeps unavailable items flagged when the disabled preview is on', () => {
    const resolved = resolveNav(primaryNavItems, {}, true);

    expect(resolved).toHaveLength(primaryNavItems.length);
    expect(resolved.find((item) => item.id === 'blog')?.available).toBe(false);
    expect(resolved.find((item) => item.id === 'about')?.available).toBe(true);
    expect(resolved.find((item) => item.id === 'shop')?.available).toBe(true);
  });

  it('reveals data-gated items automatically once their data exists', () => {
    const withoutData = resolveNav(primaryNavItems, {}, false);
    const withData = resolveNav(primaryNavItems, { hasCategories: true, hasAgeBands: true }, false);

    // Categories and Shop by Age light up with no change to this config.
    expect(withData.length).toBe(withoutData.length + (isBuilt('/products') ? 2 : 0));
    expect(labelsOf(withData)).toContain('Categories');
    expect(labelsOf(withData)).toContain('Shop by Age');
  });
});

describe('bottom tab bar threshold', () => {
  it('carries Home, Shop and — since Phase 3 — Search', () => {
    const resolved = resolveNav(bottomNavItems, {}, false);

    expect(labelsOf(resolved)).toEqual(['Home', 'Shop', 'Search']);
    expect(resolved.length).toBeGreaterThanOrEqual(MIN_BOTTOM_NAV_ITEMS);
    expect(shouldRenderBottomNav(resolved)).toBe(true);
  });

  it('still omits the bar rather than shipping it with a single tab', () => {
    // A tab bar of one is not a tab bar, and it would permanently occupy
    // scarce mobile viewport to link to the page you are already on.
    expect(shouldRenderBottomNav([{ ...bottomNavItems[0]!, available: true }])).toBe(false);
  });

  it('keeps Wishlist and Cart out until their routes exist', () => {
    // Search joined the bar in Phase 3 because `/search` became real. Wishlist
    // and Cart are Phase 4 and stay absent — the bar lists destinations, not
    // intentions (D-15).
    const labels = labelsOf(resolveNav(bottomNavItems, {}, false));

    expect(labels).toContain('Search');
    expect(labels).not.toContain('Wishlist');
    expect(labels).not.toContain('Cart');
  });
});
