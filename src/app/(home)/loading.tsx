import { Container } from '@/components/ui/Container';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Homepage loading state.
 *
 * Lives in the `(home)` route group rather than at the app root: a Suspense
 * boundary above the whole app would make Next stream a 200 before an unmatched
 * route can throw `notFound()`, turning every unknown URL into a soft 404.
 * Loading states belong to leaf routes.
 */
export default function HomeLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-12 w-44 rounded-xl" />
      </div>
    </Container>
  );
}
