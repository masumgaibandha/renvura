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
    expect(labelsOf(resolved)).not.toContain('Shop');
    expect(labelsOf(resolved)).not.toContain('Blog');
  });

  it('keeps About, which is built today', () => {
    expect(labelsOf(resolveNav(primaryNavItems, {}, false))).toContain('About');
  });

  it('keeps unavailable items flagged when the disabled preview is on', () => {
    const resolved = resolveNav(primaryNavItems, {}, true);

    expect(resolved).toHaveLength(primaryNavItems.length);
    expect(resolved.find((item) => item.id === 'shop')?.available).toBe(false);
    expect(resolved.find((item) => item.id === 'about')?.available).toBe(true);
  });

  it('reveals items automatically once their requirements are met', () => {
    // Simulates Phase 2 landing categories, without touching this config.
    const withData = resolveNav(primaryNavItems, { hasCategories: true, hasAgeBands: true }, false);
    const expected = isBuilt('/products') ? 3 : 1;

    expect(withData.length).toBe(expected);
  });
});

describe('bottom tab bar threshold', () => {
  it('omits the bar rather than shipping it near-empty', () => {
    const resolved = resolveNav(bottomNavItems, {}, false);

    // Only Home exists in Phase 1, so the bar is not rendered at all.
    expect(labelsOf(resolved)).toEqual(['Home']);
    expect(resolved.length).toBeLessThan(MIN_BOTTOM_NAV_ITEMS);
    expect(shouldRenderBottomNav(resolved)).toBe(false);
  });

  it('renders once a second destination exists', () => {
    expect(shouldRenderBottomNav(resolveNav(bottomNavItems, {}, true))).toBe(true);
  });
});
