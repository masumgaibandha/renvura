import { AppLink } from '@/components/ui/AppLink';
import { Bn } from '@/components/ui/Bn';

/**
 * Zero results, designed rather than accidental (§8.3).
 *
 * A zero-result state is **not an error**: a filter combination with nothing in
 * it, or a search that missed, is the system working correctly. So no "Something
 * went wrong", no warning colour, no error icon — just what happened and the
 * shortest way out of it.
 *
 * Every variant offers a real action. The one thing it never does is suggest
 * products the customer did not ask for, which would be answering a different
 * question than the one they asked.
 */
export function CatalogueEmptyState({
  title,
  body,
  bodyBn,
  actions,
}: {
  title: string;
  body: string;
  bodyBn?: string;
  actions: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <div
      // Announced when it replaces a grid, so a filter change is not silent for
      // a screen-reader user.
      role="status"
      className="rounded-2xl border border-line bg-soft-sunshine/45 p-6 sm:p-8"
    >
      <h2 className="max-w-2xl font-display text-[1.375rem] leading-tight text-ink sm:text-2xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">{body}</p>
      {bodyBn ? (
        <Bn as="p" className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          {bodyBn}
        </Bn>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {actions.map((action) => (
            <AppLink
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? 'inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90'
                  : 'inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-navy/25 bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-2'
              }
            >
              {action.label}
            </AppLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
