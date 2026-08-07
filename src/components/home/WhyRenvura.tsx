import { FiHeart, FiMessageCircle, FiSearch } from 'react-icons/fi';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * "Why parents choose Renvura" — design direction §6.1.
 *
 * Every line here must be true **today** (D-12). That rules out the usual
 * e-commerce trust row until the features behind it exist:
 *
 *   - no "cash on delivery" — checkout is Phase 4
 *   - no "free/fast delivery" — no courier, no founder-supplied delivery terms
 *   - no "easy returns" — the returns policy is not written yet
 *   - no "secure payments" — no payment provider is integrated
 *
 * What remains are three claims that are already true: the founder's curation,
 * a real person answering the phone, and plain-language explanation. More items
 * are added here as the features that justify them ship.
 */
const REASONS = [
  {
    icon: FiSearch,
    title: 'Chosen, not listed',
    body: 'Every product is selected by a child-development specialist rather than bulk-listed from a supplier catalogue.',
  },
  {
    icon: FiMessageCircle,
    title: 'A real person answers',
    body: 'Call or email before you buy and you reach the founder, not a call centre script.',
  },
  {
    icon: FiHeart,
    title: 'Explained in plain language',
    body: 'Age guidance and usage notes are written to be understood — in Bangla where that helps most.',
  },
] as const;

export function WhyRenvura() {
  return (
    <section className="bg-surface py-12 sm:py-16">
      <Container>
        <SectionHeading eyebrow="Why Renvura" title="Why parents choose Renvura" />

        <ul className="mt-8 grid gap-5 sm:grid-cols-3 sm:gap-6">
          {REASONS.map((reason) => (
            <li key={reason.title} className="rounded-2xl bg-canvas p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-soft-mint">
                <reason.icon aria-hidden="true" className="size-5 text-brand-navy" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{reason.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{reason.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
