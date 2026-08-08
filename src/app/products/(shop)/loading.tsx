import { Container } from '@/components/ui/Container';
import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton';

/**
 * Shop loading state.
 *
 * Mirrors the real grid's geometry — same columns, same square image tile, same
 * gaps — so the page does not reflow when products arrive. Eight placeholders
 * is a shape, not a claim about how many products exist.
 *
 * Lives inside the `(shop)` route group — which changes no URL — so its Suspense
 * boundary covers `/products` alone. At `app/products/` it would also wrap
 * `/products/[slug]`, and a flushed shell there turns every unknown slug into a
 * soft 200 instead of a real 404.
 */
export default function Loading() {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <LoadingRegion>
          <span className="sr-only">Loading products</span>

          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-10 w-64" />
          <Skeleton className="mt-4 h-4 w-full max-w-lg" />

          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-7 sm:mt-12 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-6">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="p-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="mt-4 h-3 w-20" />
                <Skeleton className="mt-2.5 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            ))}
          </div>
        </LoadingRegion>
      </Container>
    </div>
  );
}
