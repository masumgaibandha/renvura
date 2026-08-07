'use client';

import Link, { useLinkStatus } from 'next/link';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { endNavigation, startNavigation } from '@/components/layout/route-progress-store';

function NavigationReporter() {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (!pending) return;
    startNavigation();
    return endNavigation;
  }, [pending]);

  return null;
}

type AppLinkProps = ComponentProps<typeof Link> & { children: ReactNode };

/**
 * Internal link that feeds the global route-progress bar.
 *
 * Plain `next/link` under the hood — there is no locale prefixing to apply
 * (D-03). Use this for every internal link so navigation always shows progress
 * on a slow connection.
 */
export function AppLink({ children, ...props }: AppLinkProps) {
  return (
    <Link {...props}>
      {children}
      <NavigationReporter />
    </Link>
  );
}
