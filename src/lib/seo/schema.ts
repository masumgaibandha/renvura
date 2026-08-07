import { siteUrl } from '@/lib/env';
import { siteConfig } from '@/lib/site';

/**
 * Structured data is emitted only where real, verified content exists (D-12).
 *
 * Phase 1 emits `Organization` and nothing else:
 *
 *  - `Organization` — name, site URL, logo and the founder-supplied contact
 *    details. Every value below is already true and published elsewhere on the
 *    site. Phase 9 verifies and enriches this with the final business details
 *    (legal name, full address, social profiles).
 *  - `LocalBusiness` — NOT emitted. Renvura has no confirmed public business
 *    location; claiming one would be a fabricated claim.
 *  - `Product` / `Offer` / `AggregateRating` — NOT emitted. Support is built and
 *    tested in Phase 2 and never ships for demo products.
 *  - `Article` / `FAQPage` — NOT emitted. No published articles, and the FAQ
 *    carries no real question-and-answer content yet.
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteUrl,
    logo: `${siteUrl}/brand/logo-light.png`,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: siteConfig.phoneHref.replace('tel:', ''),
        email: siteConfig.email,
        areaServed: 'BD',
        availableLanguage: ['en', 'bn'],
      },
    ],
  } as const;
}
