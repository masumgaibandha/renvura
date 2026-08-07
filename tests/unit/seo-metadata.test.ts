import { describe, expect, it } from 'vitest';
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata';
import { organizationSchema } from '@/lib/seo/schema';
import { builtRoutes, siteRoutes, sitemapRoutes } from '@/lib/site';

/**
 * Renvura is one English-first page set: one URL per page, one canonical, and
 * no `hreflang` alternates (D-02, D-03).
 */
describe('absoluteUrl', () => {
  it('maps the root to the bare origin, with no trailing slash', () => {
    expect(absoluteUrl('/')).toBe('https://renvura.com');
  });

  it('appends a path without a locale segment', () => {
    expect(absoluteUrl('/about')).toBe('https://renvura.com/about');
  });

  it('tolerates a path given without a leading slash', () => {
    expect(absoluteUrl('contact')).toBe('https://renvura.com/contact');
  });
});

describe('buildMetadata', () => {
  it('sets a single canonical and no language alternates', () => {
    const metadata = buildMetadata({ path: '/about', title: 'About Renvura' });

    expect(metadata.alternates?.canonical).toBe('https://renvura.com/about');
    expect(metadata.alternates?.languages).toBeUndefined();
  });

  it('marks indexable pages as index, follow', () => {
    const metadata = buildMetadata({ path: '/', title: 'Renvura' });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it('keeps pending pages out of the index', () => {
    const metadata = buildMetadata({ path: '/privacy', title: 'Privacy Policy', noindex: true });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });

  it('declares a single English Open Graph locale', () => {
    const metadata = buildMetadata({ path: '/', title: 'Renvura' });
    expect(metadata.openGraph).toMatchObject({ locale: 'en_GB' });
  });
});

describe('route registry', () => {
  it('exposes only built routes as navigable', () => {
    expect(builtRoutes.every((route) => route.phase === 'built')).toBe(true);
  });

  it('never lists an unbuilt route in the sitemap', () => {
    expect(sitemapRoutes.every((route) => route.phase === 'built')).toBe(true);
  });

  it('keeps pending-content routes out of the sitemap', () => {
    const paths = sitemapRoutes.map((route) => route.path);

    for (const pending of [
      '/faq',
      '/privacy',
      '/returns',
      '/shipping',
      '/terms',
      '/child-safety',
    ]) {
      expect(paths).not.toContain(pending);
    }
  });

  it('declares later-phase commerce routes without making them navigable', () => {
    const declared = siteRoutes.map((route) => route.path);
    expect(declared).toContain('/products');
    expect(declared).toContain('/cart');

    const navigable = builtRoutes.map((route) => route.path);
    expect(navigable).not.toContain('/products');
    expect(navigable).not.toContain('/cart');
  });

  it('uses clean unprefixed paths everywhere', () => {
    for (const route of siteRoutes) {
      expect(route.path.startsWith('/')).toBe(true);
      expect(route.path).not.toMatch(/^\/(bn|en)(\/|$)/);
    }
  });
});

describe('structured data', () => {
  it('emits Organization with verified values only', () => {
    const schema = organizationSchema();

    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('Renvura');
    expect(schema.contactPoint[0]?.email).toBe('hello@renvura.com');
  });

  it('does not claim a physical business location', () => {
    // LocalBusiness needs a genuine public location (D-12). There is none yet.
    const json = JSON.stringify(organizationSchema());
    expect(json).not.toContain('LocalBusiness');
    expect(json).not.toContain('address');
  });
});
