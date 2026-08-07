import { ArticleSkeleton } from '@/components/ui/Skeleton';
import { Container } from '@/components/ui/Container';

export default function Loading() {
  return (
    <Container className="py-12 sm:py-16">
      <ArticleSkeleton />
    </Container>
  );
}
