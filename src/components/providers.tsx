'use client';

import { I18nProvider, RouterProvider } from '@heroui/react/rac';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import { localeTags } from '@/lib/site';

type ProvidersProps = {
  locale: Locale;
  children: ReactNode;
};

/**
 * next-themes injects its own pre-hydration script, so the theme is applied
 * before first paint and there is no flash of the wrong theme.
 */
export function Providers({ locale, children }: ProvidersProps) {
  const router = useRouter();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <I18nProvider locale={localeTags[locale]}>
        <RouterProvider navigate={router.push}>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 5000,
              style: {
                background: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                maxWidth: '32rem',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--surface)' } },
              error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface)' } },
            }}
          />
        </RouterProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
