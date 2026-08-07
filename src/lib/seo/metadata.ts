import type { Metadata } from 'next';
import { siteUrl } from '@/lib/env';
import { siteConfig } from '@/lib/site';

/**
 * One page, one URL, one canonical.
 *
 * There is no locale prefix and no `hreflang` alternate set: Renvura is a
 * single English-first hybrid-language site (D-02, D-03). Bangla appears inside
 * content as marked-up runs, never as a separate page.
 */

/** Absolute URL for a site-root-relative path. `/` → `https://site`. */
export function absoluteUrl(path: string): string {
  if (path === '/') return siteUrl;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export type BuildMetadataOptions = {
  path: string;
  title: string;
  description?: string;
  /** Pages whose content is still being prepared are kept out of the index. */
  noindex?: boolean;
};

export function buildMetadata({
  path,
  title,
  description,
  noindex = false,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: siteConfig.openGraphLocale,
      url,
      title,
      description,
      images: [{ url: siteConfig.ogImage, width: 1500, height: 500, alt: siteConfig.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [siteConfig.ogImage],
    },
  };
}
