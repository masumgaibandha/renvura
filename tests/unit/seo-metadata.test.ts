import { describe, expect, it } from 'vitest';
import { absoluteUrl, alternateLanguages, buildMetadata } from '@/lib/seo/metadata';
import { siteRoutes, sitemapRoutes } from '@/lib/site';

describe('absoluteUrl', () => {
  it('maps the home path to the bare locale root', () => {
    expect(absoluteUrl('bn', '/')).toBe('https://renvura.com/bn');
    expect(absoluteUrl('en', '/')).toBe('https://renvura.com/en');
  });

  it('prefixes every other path with the locale', () => {
    expect(absoluteUrl('bn', '/about')).toBe('https://renvura.com/bn/about');
    expect(absoluteUrl('en', '/child-safety')).toBe('https://renvura.com/en/child-safety');
  });
});

describe('alternateLanguages', () => {
  it('lists every locale plus x-default pointing at Bangla', () => {
    expect(alternateLanguages('/about')).toEqual({
      bn: 'https://renvura.com/bn/about',
      en: 'https://renvura.com/en/about',
      'x-default': 'https://renvura.com/bn/about',
    });
  });
});

describe('buildMetadata', () => {
  it('sets a self-referencing canonical and full hreflang set', () => {
    const metadata = buildMetadata({
      locale: 'en',
      path: '/contact',
      title: 'Contact Renvura',
      description: 'Contact details',
    });

    expect(metadata.alternates?.canonical).toBe('https://renvura.com/en/contact');
    expect(metadata.alternates?.languages).toMatchObject({
      bn: 'https://renvura.com/bn/contact',
      en: 'https://renvura.com/en/contact',
      'x-default': 'https://renvura.com/bn/contact',
    });
  });

  it('indexes by default', () => {
    const metadata = buildMetadata({ locale: 'bn', path: '/', title: 'Renvura' });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it('honours noindex for pages whose content is pending', () => {
    const metadata = buildMetadata({
      locale: 'bn',
      path: '/privacy',
      title: 'Privacy',
      noindex: true,
    });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('carries Open Graph and Twitter tags for share previews', () => {
    const metadata = buildMetadata({ locale: 'bn', path: '/', title: 'Renvura', description: 'x' });
    expect(metadata.openGraph?.url).toBe('https://renvura.com/bn');
    expect(metadata.twitter).toBeDefined();
  });
});

describe('sitemap route selection', () => {
  it('includes only indexable routes', () => {
    expect(sitemapRoutes.map((route) => route.path)).toEqual(['/', '/about', '/contact']);
  });

  it('excludes the FAQ and every policy page', () => {
    const excluded = ['/faq', '/privacy', '/returns', '/shipping', '/terms', '/child-safety'];
    for (const path of excluded) {
      expect(sitemapRoutes.some((route) => route.path === path)).toBe(false);
      expect(siteRoutes.find((route) => route.path === path)?.indexable).toBe(false);
    }
  });

  it('has no duplicate paths', () => {
    const paths = siteRoutes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
