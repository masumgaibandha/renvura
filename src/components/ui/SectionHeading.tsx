import type { ReactNode } from 'react';

/**
 * Section heading with the small uppercase eyebrow above it — the device the
 * premium-layout reference uses to make a grid read as considered rather than
 * busy (design direction §2.2, §4).
 */
export function SectionHeading({
  eyebrow,
  title,
  align = 'left',
  action,
}: {
  eyebrow?: string;
  title: string;
  align?: 'left' | 'center';
  action?: ReactNode;
}) {
  const centered = align === 'center';

  return (
    <div
      className={`flex flex-wrap items-end gap-x-6 gap-y-2 ${
        centered ? 'flex-col items-center text-center' : 'justify-between'
      }`}
    >
      <div>
        {eyebrow ? (
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-xs">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-display text-[1.375rem] leading-tight text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
