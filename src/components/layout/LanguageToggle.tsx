'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';

const shortLabels: Record<Locale, string> = { bn: 'বাং', en: 'EN' };
const fullLabels: Record<Locale, 'switchToBangla' | 'switchToEnglish'> = {
  bn: 'switchToBangla',
  en: 'switchToEnglish',
};

/**
 * Site-wide bn/en toggle — Project Specification v1.8 §3.3.
 *
 * Real links to the same path in the other locale, so the switch works before
 * hydration and search engines can follow both versions.
 */
export function LanguageToggle() {
  const t = useTranslations('nav');
  const active = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <div
      className="flex items-center rounded-full border border-line p-0.5 text-xs font-semibold"
      role="group"
      aria-label={t('languageLabel')}
    >
      {locales.map((locale) => {
        const isActive = locale === active;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            aria-current={isActive ? 'true' : undefined}
            aria-label={t(fullLabels[locale])}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              isActive ? 'bg-accent text-on-accent' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {shortLabels[locale]}
          </Link>
        );
      })}
    </div>
  );
}
