import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * Customer reviews.
 *
 * Absent until real reviews exist — no seeded testimonials, ever (D-12). This
 * component therefore renders nothing throughout Phase 1 and only comes alive
 * when Phase 12 supplies verified, moderated reviews.
 */
export function ReviewsSection({
  reviews,
}: {
  reviews: { id: string; author: string; rating: number; body: string }[];
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <SectionHeading eyebrow="From customers" title="What parents say" />

        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-sm leading-relaxed text-ink">{review.body}</p>
              <p className="mt-4 text-sm font-semibold text-ink-muted">{review.author}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
