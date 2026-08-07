import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';

/**
 * The honest empty state for routes whose content is not written yet.
 *
 * No draft, no placeholder legal text and no invented delivery, returns or
 * safety wording (D-12). Every page rendered through this emits
 * `noindex, nofollow` and is excluded from the sitemap (see `src/lib/site.ts`).
 */
export function PendingPage({
  title,
  summary,
  pendingLabel = 'Not published yet',
  pendingTitle,
  pendingBody,
}: {
  title: string;
  summary?: string;
  pendingLabel?: string;
  pendingTitle: string;
  pendingBody: string;
}) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <span className="inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
          {pendingLabel}
        </span>

        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {summary ? <p className="mt-4 text-base text-ink-muted">{summary}</p> : null}

        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-base font-semibold text-ink">{pendingTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{pendingBody}</p>
          <AppLink
            href="/contact"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
          >
            Ask us directly
          </AppLink>
        </div>
      </div>
    </Container>
  );
}
