'use client';

import { useLinkStatus } from 'next/link';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
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
 * Locale-aware link that also feeds the global route-progress bar.
 * Use this for every internal link.
 */
export function AppLink({ children, ...props }: AppLinkProps) {
  return (
    <Link {...props}>
      {children}
      <NavigationReporter />
    </Link>
  );
}
