import { useTranslations } from 'next-intl';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { Monogram } from '@/components/ui/Logo';
import { navRoutes, policyRoutes, siteConfig } from '@/lib/site';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tPolicies = useTranslations('policies');

  return (
    <footer className="mt-20 border-t border-line bg-brand-navy text-brand-cream">
      <Container className="py-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Monogram size={36} />
              <span className="latin text-lg font-semibold tracking-[0.2em]">RENVURA</span>
            </div>
            <p className="mt-4 text-sm text-brand-slate">{t('tagline')}</p>
            <p className="mt-1 text-sm text-brand-slate">{t('location')}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-14">
            <nav aria-labelledby="footer-explore">
              <h2
                id="footer-explore"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate"
              >
                {t('exploreHeading')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {navRoutes.map((route) => (
                  <li key={route.path}>
                    <AppLink
                      href={route.path}
                      className="text-sm text-brand-cream/90 transition-colors hover:text-brand-gold"
                    >
                      {tNav(route.navKey)}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="footer-policies">
              <h2
                id="footer-policies"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate"
              >
                {t('policiesHeading')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {policyRoutes.map((policy) => (
                  <li key={policy.path}>
                    <AppLink
                      href={policy.path}
                      className="text-sm text-brand-cream/90 transition-colors hover:text-brand-gold"
                    >
                      {tPolicies(`${policy.key}.title`)}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-brand-slate/25 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">
            {t('contactHeading')}
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:gap-8">
            <li>
              <a
                href={siteConfig.phoneHref}
                className="latin transition-colors hover:text-brand-gold"
              >
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.emailHref}
                className="latin transition-colors hover:text-brand-gold"
              >
                {siteConfig.email}
              </a>
            </li>
          </ul>
          <p className="mt-6 text-xs text-brand-slate">
            {t('rights', { year: new Date().getFullYear() })}
          </p>
        </div>
      </Container>
    </footer>
  );
}
