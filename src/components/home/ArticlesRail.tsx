import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

/** Helpful articles — omitted entirely until real published articles exist (Phase 9). */
export function ArticlesRail({
  articles,
}: {
  articles: { slug: string; title: string; href: string; excerpt: string }[];
}) {
  if (articles.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <SectionHeading eyebrow="Guidance" title="Helpful articles" />

        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {articles.map((article) => (
            <li key={article.slug}>
              <AppLink
                href={article.href}
                className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:bg-surface-2"
              >
                <h3 className="text-base font-semibold leading-snug text-ink">{article.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                  {article.excerpt}
                </p>
              </AppLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
