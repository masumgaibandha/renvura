import { Container } from '@/components/ui/Container';
import { LoadingRegion, Skeleton, SkeletonText } from '@/components/ui/Skeleton';

/**
 * Locale-independent on purpose: reading translations here would resolve the
 * locale from request headers and opt the whole segment out of static
 * rendering. The skeleton carries no text, so it needs none.
 */
export default function Loading() {
  return (
    <Container className="py-12">
      <LoadingRegion>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="mt-10 max-w-2xl space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-10 w-full" />
          <SkeletonText lines={2} />
        </div>
      </LoadingRegion>
    </Container>
  );
}
