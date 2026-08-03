import { Container } from '@/components/ui/Container';
import { LoadingRegion, Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function ContactLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <LoadingRegion>
        <Skeleton className="h-9 w-48" />
        <div className="mt-4 max-w-2xl">
          <SkeletonText lines={2} />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </LoadingRegion>
    </Container>
  );
}
