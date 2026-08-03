import { useTranslations } from 'next-intl';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { navRoutes } from '@/lib/site';

export function Header() {
  const t = useTranslations('nav');

  return (
    <header className="relative border-b border-line bg-canvas">
      <Container className="flex h-16 items-center justify-between gap-4">
        <AppLink href="/" className="shrink-0" aria-label="Renvura">
          <Logo width={132} height={40} priority />
        </AppLink>

        <nav className="hidden sm:block" aria-label="Renvura">
          <ul className="flex items-center gap-1">
            {navRoutes.map((route) => (
              <li key={route.path}>
                <AppLink
                  href={route.path}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  {t(route.navKey)}
                </AppLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
