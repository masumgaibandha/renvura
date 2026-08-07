import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { Monogram } from '@/components/ui/Logo';
import {
  footerColumns,
  footerRoutesFor,
  policyRoutes,
  siteConfig,
} from '@/lib/site';

/**
 * Full e-commerce footer — design direction §5.3.
 *
 * Navy ground, cream text, slate-toned separators. Columns are built from the
 * route registry, so a column can only ever list routes that exist: the Shop
 * column stays empty (and is therefore not rendered) until Phase 2 builds
 * `/products` and `/collections` (D-15).
 *
 * No payment-method row: Renvura is not yet integrated with any payment
 * provider, and aspirational payment badges are a fabricated claim (D-12).
 */
export function Footer() {
  const columns = footerColumns
    .map((column) => ({ ...column, routes: footerRoutesFor(column.key) }))
    .filter((column) => column.routes.length > 0);

  return (
    <footer className="mt-20 bg-brand-navy text-brand-cream">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Monogram size={36} />
              <span className="latin text-lg font-semibold tracking-[0.2em]">RENVURA</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-brand-slate">
              Children&rsquo;s products for Bangladeshi families — chosen with care, explained
              plainly, and sold without inflated claims.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.key} aria-labelledby={`footer-${column.key}`}>
              <h2
                id={`footer-${column.key}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate"
              >
                {column.heading}
              </h2>
              <ul className="mt-2 space-y-0.5">
                {column.routes.map((route) => (
                  <li key={route.path}>
                    <AppLink
                      href={route.path}
                      className="inline-flex min-h-11 items-center text-sm text-brand-cream/90 transition-colors hover:text-brand-gold"
                    >
                      {route.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">
              Contact
            </h2>
            <ul className="mt-2 space-y-0.5 text-sm">
              <li>
                <a
                  href={siteConfig.phoneHref}
                  className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-brand-gold"
                >
                  <FiPhone aria-hidden="true" className="size-4 shrink-0 text-brand-slate" />
                  <span className="latin">{siteConfig.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.emailHref}
                  className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-brand-gold"
                >
                  <FiMail aria-hidden="true" className="size-4 shrink-0 text-brand-slate" />
                  <span className="latin break-all">{siteConfig.email}</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-brand-cream/90">
                <FiMapPin aria-hidden="true" className="size-4 shrink-0 text-brand-slate" />
                {siteConfig.location}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-slate/25 pt-6">
          <ul className="flex flex-wrap gap-x-6">
            {policyRoutes.map((route) => (
              <li key={route.path}>
                <AppLink
                  href={route.path}
                  className="inline-flex min-h-11 items-center text-xs text-brand-slate transition-colors hover:text-brand-gold"
                >
                  {route.label}
                </AppLink>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-brand-slate">
            © {new Date().getFullYear()} Renvura. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
