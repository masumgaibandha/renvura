import { mayEmitProductSchema } from '@/lib/catalogue/demo';
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
/**
 * `Product` + `Offer` markup for a single product.
 *
 * **Support is built here; it is never emitted for a demo record** (D-08, §5.5).
 * `mayEmitProductSchema()` is the gate — the same one analytics uses — and it
 * refuses demo products in any environment, anything not `active`, and anything
 * without a real price. Returning `null` means the caller renders no script tag
 * at all.
 *
 * Deliberately omits `aggregateRating` and `review`: those require genuine
 * customer reviews, which arrive in Phase 12 and are never seeded (D-12).
 * `availability` is derived from the stock policy rather than asserted.
 */
export function productSchema(product: {
  slug?: string;
  name?: string;
  description?: string;
  priceMinor?: number;
  status?: string;
  isDemo?: boolean;
  images?: { url: string }[];
  categoryLabel?: string;
  inStock?: boolean;
  availability?: string;
}) {
  if (!mayEmitProductSchema(product)) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    category: product.categoryLabel,
    image: (product.images ?? []).map((image) => `${siteUrl}${image.url}`),
    url: `${siteUrl}/products/${product.slug}`,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: 'BDT',
      price: ((product.priceMinor ?? 0) / 100).toFixed(2),
      availability:
        product.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  } as const;
}

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
