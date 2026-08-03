/**
 * Tiny external store counting in-flight link navigations.
 *
 * `AppLink` reports Next.js's `useLinkStatus` into this store and
 * `RouteProgress` renders the top-of-page bar from it — the navigation
 * progress indicator required by Project Specification v1.8 §5.8, with no
 * extra dependency.
 */

let pendingCount = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function startNavigation(): void {
  pendingCount += 1;
  emit();
}

export function endNavigation(): void {
  pendingCount = Math.max(0, pendingCount - 1);
  emit();
}

export function subscribeToNavigation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isNavigating(): boolean {
  return pendingCount > 0;
}

/** The server never has a navigation in flight. */
export function isNavigatingOnServer(): boolean {
  return false;
}
