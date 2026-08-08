/**
 * Homepage section order — configuration, not layout code (D-10).
 *
 * The order below is the *recommended default merchandising order*. It is data,
 * so the founder can reorder or disable sections without a deployment once an
 * admin exists (Phase 6). The page component renders whatever this array says,
 * in the order it says, and never hardcodes a sequence of its own.
 *
 * Four constraints always hold and are enforced by `assertHomepageOrder`:
 *
 *   1. The hero stays first.
 *   2. Product discovery and merchandising come before founder content.
 *   3. Founder content is never the hero.
 *   4. (The header and footer sit outside this list, in the layout.)
 */

export const HOMEPAGE_SECTION_IDS = [
  'hero',
  'categories',
  'ages',
  'featured-products',
  'promo-banners',
  'best-sellers',
  'collections',
  'new-arrivals',
  'coming-soon',
  'offers',
  'why-renvura',
  'founder',
  'articles',
  'reviews',
  'support',
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export type HomepageSection = {
  id: HomepageSectionId;
  /**
   * `false` disables a section outright, regardless of data. Sections whose
   * data is simply empty are skipped at render time instead — that is the
   * normal Phase 1 case, not a disabled section.
   */
  enabled: boolean;
  /** Discovery and merchandising sections must precede founder content. */
  kind: 'hero' | 'discovery' | 'merchandising' | 'trust' | 'founder' | 'content' | 'support';
};

export const homepageSections: readonly HomepageSection[] = [
  { id: 'hero', enabled: true, kind: 'hero' },
  { id: 'categories', enabled: true, kind: 'discovery' },
  { id: 'ages', enabled: true, kind: 'discovery' },
  { id: 'featured-products', enabled: true, kind: 'merchandising' },
  // Promotional banners each need a real destination category or collection.
  // Disabled until Phase 2 provides them, so no banner can point nowhere.
  { id: 'promo-banners', enabled: false, kind: 'merchandising' },
  // Only ever populated from completed-order data (Phase 4+).
  { id: 'best-sellers', enabled: true, kind: 'merchandising' },
  { id: 'collections', enabled: true, kind: 'merchandising' },
  { id: 'new-arrivals', enabled: true, kind: 'merchandising' },
  // Products the founder has selected but not yet priced. Deliberately last of
  // the merchandising sections: what a customer can buy comes first, and a
  // preview of what is coming is a footnote to that, not a headline.
  { id: 'coming-soon', enabled: true, kind: 'merchandising' },
  // Requires a real, active campaign. Disabled until one exists (D-12).
  { id: 'offers', enabled: false, kind: 'merchandising' },
  { id: 'why-renvura', enabled: true, kind: 'trust' },
  { id: 'founder', enabled: true, kind: 'founder' },
  { id: 'articles', enabled: true, kind: 'content' },
  { id: 'reviews', enabled: true, kind: 'trust' },
  { id: 'support', enabled: true, kind: 'support' },
];

const DISCOVERY_KINDS = new Set<HomepageSection['kind']>(['discovery', 'merchandising']);

/**
 * Guards the four structural constraints. Exported so a unit test can assert
 * them and so a future admin reorder can be validated before it is saved.
 */
export function assertHomepageOrder(sections: readonly HomepageSection[]): void {
  const active = sections.filter((section) => section.enabled);

  if (active[0]?.kind !== 'hero') {
    throw new Error('Homepage order: the hero must be the first enabled section.');
  }

  const founderIndex = active.findIndex((section) => section.kind === 'founder');
  if (founderIndex === 0) {
    throw new Error('Homepage order: founder content must never be the hero.');
  }

  if (founderIndex !== -1) {
    const lastDiscoveryIndex = active.reduce(
      (last, section, index) => (DISCOVERY_KINDS.has(section.kind) ? index : last),
      -1,
    );
    if (lastDiscoveryIndex > founderIndex) {
      throw new Error(
        'Homepage order: product discovery and merchandising must come before founder content.',
      );
    }
  }
}
