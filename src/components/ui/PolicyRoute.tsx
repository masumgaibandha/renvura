import type { Metadata } from 'next';
import { PendingPage } from '@/components/ui/PendingPage';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * The five footer policy routes plus the FAQ.
 *
 * The routes, titles and footer links exist so the structure is in place, but
 * these pages need real, reviewed wording before they can go live (D-12).
 * Until the founder supplies it they render the pending state, emit
 * `noindex, nofollow` and stay out of the sitemap.
 *
 * Consumer-protection and data rules apply in Bangladesh; the wording must be
 * reviewed by someone qualified before publication — especially Privacy, Terms
 * and the Child Safety disclaimer.
 */
export type PendingRouteKey =
  | 'faq'
  | 'privacy'
  | 'returns'
  | 'shipping'
  | 'terms'
  | 'child-safety';

type PendingRouteContent = {
  path: string;
  title: string;
  summary: string;
  pendingTitle: string;
  pendingBody: string;
};

export const PENDING_ROUTES: Record<PendingRouteKey, PendingRouteContent> = {
  faq: {
    path: '/faq',
    title: 'Frequently asked questions',
    summary:
      'Answers to the questions parents ask most about ordering, delivery and product suitability.',
    pendingTitle: 'These answers are not published yet',
    pendingBody:
      'Writing answers about ordering or delivery before those services exist would mean publishing things that are not yet true. Until then, any question you have is answered directly.',
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy',
    summary: 'How Renvura collects, uses and protects customer information.',
    pendingTitle: 'This policy is not published yet',
    pendingBody:
      'A privacy policy has to describe exactly what is collected and how it is handled, and it needs qualified review before it is published. A placeholder would be worse than nothing.',
  },
  returns: {
    path: '/returns',
    title: 'Returns & Refunds',
    summary: 'The conditions, timeframe and process for returning an order.',
    pendingTitle: 'These terms are not published yet',
    pendingBody:
      'Return terms are a promise. They will be published once they are decided and reviewed — not estimated in advance.',
  },
  shipping: {
    path: '/shipping',
    title: 'Shipping & Delivery',
    summary: 'Delivery areas, charges and timings.',
    pendingTitle: 'Delivery details are not published yet',
    pendingBody:
      'Delivery zones, charges and timings depend on the courier arrangements being finalised. Publishing figures before then would be guesswork.',
  },
  terms: {
    path: '/terms',
    title: 'Terms & Conditions',
    summary: 'The rules covering use of this site, ordering and liability.',
    pendingTitle: 'These terms are not published yet',
    pendingBody:
      'Terms and conditions need qualified review before publication. They will appear here once that review is complete.',
  },
  'child-safety': {
    path: '/child-safety',
    title: 'Child Safety & Material Disclaimer',
    summary:
      'Age-appropriateness, materials, choking hazards and supervision guidance for the products Renvura sells.',
    pendingTitle: 'This page is not published yet',
    pendingBody:
      'Safety information must come from verified product documentation, never from assumption. It will be published alongside the products it describes.',
  },
};

export function createPendingMetadata(key: PendingRouteKey): Metadata {
  const content = PENDING_ROUTES[key];
  return buildMetadata({ path: content.path, title: content.title, noindex: true });
}

export function PendingRoute({ routeKey }: { routeKey: PendingRouteKey }) {
  const content = PENDING_ROUTES[routeKey];

  return (
    <PendingPage
      title={content.title}
      summary={content.summary}
      pendingTitle={content.pendingTitle}
      pendingBody={content.pendingBody}
    />
  );
}
