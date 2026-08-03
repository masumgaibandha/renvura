import type { Locale } from '@/i18n/routing';

/**
 * Single registry of everything that exists in Phase 1.
 *
 * Navigation, the footer and the sitemap all read from here, so a link can
 * never point at a route that has not been built, and the sitemap can never
 * advertise a page whose content is still pending.
 */

export const siteConfig = {
  name: 'Renvura',
  /** Contact details — Project Specification v1.8 §5.8. */
  phone: '01883-115898',
  phoneHref: 'tel:+8801883115898',
  email: 'hello@renvura.com',
  emailHref: 'mailto:hello@renvura.com',
  locationEn: 'Dhaka, Bangladesh',
  ogImage: '/brand/banner-light.png',
} as const;

export type SiteRoute = {
  /** Locale-relative path, e.g. `/about`. */
  path: string;
  /** Key into the `nav` message namespace, when the route appears in navigation. */
  navKey?: 'home' | 'about' | 'contact' | 'faq';
  /**
   * `false` for pages whose content is still being prepared. Those pages emit
   * `noindex, nofollow` and are excluded from the sitemap.
   */
  indexable: boolean;
  priority: number;
  changeFrequency: 'monthly' | 'yearly';
};

export const siteRoutes = [
  { path: '/', navKey: 'home', indexable: true, priority: 1, changeFrequency: 'monthly' },
  { path: '/about', navKey: 'about', indexable: true, priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', navKey: 'contact', indexable: true, priority: 0.7, changeFrequency: 'yearly' },
  // Content pending — see messages `faq.pending*` and `policies.pending*`.
  { path: '/faq', navKey: 'faq', indexable: false, priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', indexable: false, priority: 0.3, changeFrequency: 'yearly' },
  { path: '/returns', indexable: false, priority: 0.3, changeFrequency: 'yearly' },
  { path: '/shipping', indexable: false, priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', indexable: false, priority: 0.3, changeFrequency: 'yearly' },
  { path: '/child-safety', indexable: false, priority: 0.3, changeFrequency: 'yearly' },
] as const satisfies readonly SiteRoute[];

type SiteRouteEntry = (typeof siteRoutes)[number];

/** Routes shown in the header and mobile menu, in order. */
export const navRoutes = siteRoutes.filter(
  (route): route is Extract<SiteRouteEntry, { navKey: string }> => 'navKey' in route,
);

/** Footer policy column — Project Specification v1.8 §5.9. */
export const policyRoutes = [
  { path: '/privacy', key: 'privacy' },
  { path: '/returns', key: 'returns' },
  { path: '/shipping', key: 'shipping' },
  { path: '/terms', key: 'terms' },
  { path: '/child-safety', key: 'childSafety' },
] as const;

export type PolicyKey = (typeof policyRoutes)[number]['key'];

/** Only indexable routes reach the sitemap. */
export const sitemapRoutes = siteRoutes.filter((route) => route.indexable);

export function isIndexable(path: string): boolean {
  return siteRoutes.some((route) => route.path === path && route.indexable);
}

/** `bn` → `bn-BD` etc., for hreflang and Open Graph. */
export const localeTags: Record<Locale, string> = {
  bn: 'bn-BD',
  en: 'en-GB',
};

export const openGraphLocales: Record<Locale, string> = {
  bn: 'bn_BD',
  en: 'en_GB',
};
