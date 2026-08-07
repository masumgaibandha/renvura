import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { builtRoutes } from '@/lib/site';

/**
 * Branded 404.
 *
 * With no `[locale]` segment there is no catch-all route: Next matches this
 * file for any unknown path and returns a real 404 status, which is what the
 * smoke test asserts.
 *
 * The routes back out are read from the registry, so this page can never offer
 * a link to something that does not exist (D-15).
 */
export default function NotFound() {
  const links = builtRoutes.filter((route) =>
    ['/', '/about', '/contact'].includes(route.path),
  );

  return (
    <Container className="flex min-h-[60vh] flex-col justify-center py-16">
      <div className="max-w-xl">
        <p className="latin font-display text-6xl text-ink">404</p>
        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">
          This page could not be found
        </h1>
        <p className="mt-4 text-base text-ink-muted">
          The link may be out of date, or the page may not have been built yet. Here is the way
          back.
        </p>

        <ul className="mt-8 flex flex-col gap-3 sm:flex-row">
          {links.map((link) => (
            <li key={link.path}>
              <AppLink
                href={link.path}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                {link.path === '/' ? 'Go to the homepage' : link.label}
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
