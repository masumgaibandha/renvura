import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { absoluteUrl, alternateLanguages } from '@/lib/seo/metadata';
import { sitemapRoutes } from '@/lib/site';

/**
 * Both locale variants of every *indexable* route.
 *
 * Routes whose content is still being prepared (FAQ and the five policy pages)
 * are excluded by `sitemapRoutes` and separately emit `noindex, nofollow`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return sitemapRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: absoluteUrl(locale, route.path),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: alternateLanguages(route.path) },
    })),
  );
}
