'use client';

import { useSyncExternalStore } from 'react';
import {
  isNavigating,
  isNavigatingOnServer,
  subscribeToNavigation,
} from './route-progress-store';

export function RouteProgress() {
  const navigating = useSyncExternalStore(
    subscribeToNavigation,
    isNavigating,
    isNavigatingOnServer,
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div
        className={`h-full bg-accent transition-[width,opacity] duration-300 ease-out ${
          navigating ? 'w-4/5 opacity-100' : 'w-0 opacity-0'
        }`}
      />
    </div>
  );
}
