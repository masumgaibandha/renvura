'use client';

import { RouterProvider } from '@heroui/react/rac';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import type { ReactNode } from 'react';

/**
 * Client providers.
 *
 * There is no theme provider: the storefront ships light/cream only and the
 * theme toggle is removed (D-07). There is no i18n provider either — the site
 * is one English-first page set, so react-aria's default `en` locale is
 * correct (D-02).
 */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
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
  );
}
