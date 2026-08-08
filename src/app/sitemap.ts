import type { MetadataRoute } from 'next';
import { demoModeEnabled } from '@/lib/catalogue/demo';
import { absoluteUrl } from '@/lib/seo/metadata';
import { sitemapRoutes } from '@/lib/site';

/**
 * One entry per indexable route — no locale variants, no `alternates` (D-03).
 *
 * `sitemapRoutes` is already filtered twice: to routes that have actually been
 * built, and to those whose content is real enough to index. Pages that are
 * still pending (FAQ and the five policy routes) are excluded here and
 * separately emit `noindex, nofollow`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // While demo mode is on the whole site is excluded from the sitemap (D-08).
  if (demoModeEnabled()) return [];

  const lastModified = new Date();

  return sitemapRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
