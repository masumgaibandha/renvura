import type { ReactNode } from 'react';

/**
 * A Bangla run inside an English-first page (D-02).
 *
 * Renvura is one hybrid-language site: English carries navigation, buttons,
 * product names, specifications, cart, checkout and every system surface.
 * Bangla is used selectively, where it genuinely improves understanding —
 * detailed product explanations, usage instructions, expert notes, age
 * guidance, safety warnings, and important delivery or return information.
 *
 * Wrapping a run in this component does three things:
 *   1. marks it `lang="bn"` for screen readers and search engines,
 *   2. switches it to Noto Sans Bengali (Lora has no Bengali glyphs),
 *   3. keeps the Bengali font subset off pages that never use it.
 *
 * A Bangla field renders when present and is silently omitted when absent —
 * there is no fallback text and no "translation pending" state.
 */
export function Bn({
  children,
  as: Tag = 'span',
  className = '',
}: {
  children: ReactNode;
  as?: 'span' | 'p' | 'div' | 'li';
  className?: string;
}) {
  return (
    <Tag lang="bn" className={className}>
      {children}
    </Tag>
  );
}
