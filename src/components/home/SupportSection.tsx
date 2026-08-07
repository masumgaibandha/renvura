import { FiMail, FiPhone } from 'react-icons/fi';
import { Bn } from '@/components/ui/Bn';
import { Container } from '@/components/ui/Container';
import { siteConfig } from '@/lib/site';

/**
 * Support section — design direction §6.1 (final content section).
 *
 * The reference layout puts a newsletter capture here. Renvura does not: there
 * is no newsletter endpoint in Phase 1, and an email field that silently
 * discards the address is exactly the dead control §11.1.1 forbids. Nor is
 * there a WhatsApp button — the published number has not been confirmed as a
 * WhatsApp account, and linking to `wa.me` on the assumption that it is would
 * be an invented claim (D-12). Both are added when the facts support them.
 *
 * What is left is real: a phone number and an email address that reach the
 * founder. The Bangla line is the hybrid-language rule in practice (D-02) —
 * English carries the interface, Bangla carries the reassurance a parent
 * actually reads.
 */
export function SupportSection() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="rounded-2xl bg-brand-navy px-5 py-8 text-brand-cream sm:px-8 sm:py-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-[1.375rem] leading-tight sm:text-3xl">
              Not sure what suits your child?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-slate sm:text-base">
              Tell us the age and what you are looking for. You will get an honest answer —
              including when we do not have the right thing yet.
            </p>
            <Bn as="p" className="mt-2 text-sm leading-relaxed text-brand-slate sm:text-base">
              শিশুর বয়স আর আপনার প্রয়োজনটা জানালে আমরা সরাসরি পরামর্শ দিতে পারব।
            </Bn>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={siteConfig.phoneHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
              >
                <FiPhone aria-hidden="true" className="size-4" />
                <span className="latin">{siteConfig.phone}</span>
              </a>
              <a
                href={siteConfig.emailHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-slate/40 px-6 text-sm font-semibold text-brand-cream transition-colors hover:border-brand-gold hover:text-brand-gold"
              >
                <FiMail aria-hidden="true" className="size-4" />
                <span className="latin">{siteConfig.email}</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
