import { defineRouting } from 'next-intl/routing';

/**
 * Bangla is the default locale for the Bangladeshi market, but every locale is
 * prefixed (`/bn/*`, `/en/*`) so canonical and hreflang stay symmetrical.
 * `/` is redirected to `/bn` by the proxy.
 */
export const routing = defineRouting({
  locales: ['bn', 'en'],
  defaultLocale: 'bn',
  localePrefix: 'always',
  /**
   * Off deliberately: `/` must always land on `/bn`. With detection on, an
   * `Accept-Language: en` browser is redirected to `/en` instead, which
   * contradicts a Bangla-default site and makes the entry point unpredictable.
   * Readers switch language with the toggle.
   */
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const locales = routing.locales;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
