/**
 * Generic shimmer primitives for route-level `loading.tsx` files.
 *
 * Deliberately shape-agnostic: product-grid and blog-list skeletons belong with
 * the components they stand in for, and those arrive in Phases 2 and 9.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-surface-2 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-3.5 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** Shared fallback for the prose routes: about, FAQ and the policy pages. */
export function ArticleSkeleton() {
  return (
    <LoadingRegion>
      <Skeleton className="h-9 w-64" />
      <div className="mt-5 max-w-2xl">
        <SkeletonText lines={2} />
      </div>
      <div className="mt-10 max-w-2xl space-y-8">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-6 w-44" />
            <SkeletonText lines={3} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** Announces that a route is loading, for assistive technology. */
export function LoadingRegion({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      {children}
    </div>
  );
}
