import type { Metadata } from 'next';
import { locales, type Locale } from '@/i18n/routing';
import { siteUrl } from '@/lib/env';
import { openGraphLocales, siteConfig } from '@/lib/site';

/**
 * Absolute URL for a locale-relative path.
 * `/` → `https://site/bn`, `/about` → `https://site/bn/about`.
 */
export function absoluteUrl(locale: Locale, path: string): string {
  const normalised = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}/${locale}${normalised}`;
}

/** hreflang map for a path: every locale plus `x-default` pointing at Bangla. */
export function alternateLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  languages['x-default'] = absoluteUrl('bn', path);
  return languages;
}

export type BuildMetadataOptions = {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  /** Pages whose content is still being prepared are kept out of the index. */
  noindex?: boolean;
};

export function buildMetadata({
  locale,
  path,
  title,
  description,
  noindex = false,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(locale, path);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(path),
    },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: openGraphLocales[locale],
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
