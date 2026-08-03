import type { MetadataRoute } from 'next';
import { isProductionSite, siteUrl } from '@/lib/env';

/**
 * Only the real production deployment is crawlable. Preview builds serve a
 * blanket disallow so staging URLs never compete with the live site.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
