'use client';

import { Button, useIsHydrated } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { FiMoon, FiSun } from 'react-icons/fi';

/**
 * Theme toggle — Project Specification v1.8 §3.4.
 *
 * Renders a stable placeholder until mounted: `resolvedTheme` is unknown during
 * SSR, and guessing it would produce a hydration mismatch.
 */
export function ThemeToggle() {
  const t = useTranslations('nav');
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsHydrated();

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? t('switchToLight') : t('switchToDark');

  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      aria-label={mounted ? label : t('themeLabel')}
      onPress={() => setTheme(isDark ? 'light' : 'dark')}
      className="text-ink"
    >
      {mounted && isDark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
    </Button>
  );
}
