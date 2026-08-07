import { describe, expect, it } from 'vitest';
import {
  assertHomepageOrder,
  homepageSections,
  type HomepageSection,
} from '@/lib/homepage-sections';

/**
 * The homepage order is configuration, not layout code (D-10). Four structural
 * constraints hold whatever the configuration says, and these tests are what
 * stop a future reorder from quietly breaking them.
 */
describe('homepage section configuration', () => {
  it('accepts the shipped default order', () => {
    expect(() => assertHomepageOrder(homepageSections)).not.toThrow();
  });

  it('starts with the hero', () => {
    const firstEnabled = homepageSections.find((section) => section.enabled);
    expect(firstEnabled?.kind).toBe('hero');
  });

  it('puts every discovery and merchandising section before founder content', () => {
    const active = homepageSections.filter((section) => section.enabled);
    const founderIndex = active.findIndex((section) => section.kind === 'founder');
    const lastDiscovery = active.reduce(
      (last, section, index) =>
        section.kind === 'discovery' || section.kind === 'merchandising' ? index : last,
      -1,
    );

    expect(founderIndex).toBeGreaterThan(lastDiscovery);
  });

  it('rejects a configuration that promotes founder content to the hero', () => {
    const bad: HomepageSection[] = [
      { id: 'founder', enabled: true, kind: 'founder' },
      { id: 'hero', enabled: true, kind: 'hero' },
    ];

    expect(() => assertHomepageOrder(bad)).toThrow(/hero/i);
  });

  it('rejects a configuration that pushes products below the founder', () => {
    const bad: HomepageSection[] = [
      { id: 'hero', enabled: true, kind: 'hero' },
      { id: 'founder', enabled: true, kind: 'founder' },
      { id: 'featured-products', enabled: true, kind: 'merchandising' },
    ];

    expect(() => assertHomepageOrder(bad)).toThrow(/before founder content/i);
  });

  it('disables sections that would otherwise need invented content', () => {
    const byId = new Map(homepageSections.map((section) => [section.id, section]));

    // Promotional banners need real destination categories (Phase 2);
    // offers need a real active campaign (D-12).
    expect(byId.get('promo-banners')?.enabled).toBe(false);
    expect(byId.get('offers')?.enabled).toBe(false);
  });
});
