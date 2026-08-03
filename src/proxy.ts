import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. next-intl's handler is a
 * plain `(request) => Response` function, so it plugs in unchanged.
 */
export default createMiddleware(routing);

export const config = {
  // Run on everything except Next internals, the API and files with an extension.
  matcher: ['/((?!api|_next|_vercel|brand|.*\\..*).*)'],
};
