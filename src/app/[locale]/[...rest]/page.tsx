import { notFound } from 'next/navigation';

/**
 * Anything under a locale that matches no real route falls through to here and
 * renders the branded, translated 404 from `[locale]/not-found.tsx` with a
 * proper 404 status. Without this, unmatched paths escape the `[locale]`
 * segment and get Next.js's unbranded default page.
 */
export default function CatchAllNotFound() {
  notFound();
}
