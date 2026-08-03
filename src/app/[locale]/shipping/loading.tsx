import { Container } from '@/components/ui/Container';
import { ArticleSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <Container className="py-12 sm:py-16">
      <ArticleSkeleton />
    </Container>
  );
}
