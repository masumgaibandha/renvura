import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { RouteProgress } from '@/components/layout/RouteProgress';
import { Providers } from '@/components/providers';
import { siteUrl } from '@/lib/env';
import { fontVariables } from '@/lib/fonts';
import { organizationSchema } from '@/lib/seo/schema';
import { siteConfig } from '@/lib/site';
import '@/styles/globals.css';

/**
 * Root layout.
 *
 * One page set, no locale segment (D-03). `<html lang>` is English; Bangla
 * appears as marked-up runs inside content via `<Bn>` (D-02).
 *
 * The storefront is light/cream only — there is no theme provider and no
 * pre-hydration theme script, because there is no theme to choose (D-07).
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Renvura — Children’s products for Bangladeshi families',
    template: '%s · Renvura',
  },
  applicationName: siteConfig.name,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={siteConfig.htmlLang} className={fontVariables}>
      <body className="flex min-h-dvh flex-col overflow-x-hidden bg-canvas text-ink">
        {/* Organization is the only structured data Phase 1 emits — every value
            in it is already true and published on this site (D-12). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />

        <Providers>
          <RouteProgress />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
