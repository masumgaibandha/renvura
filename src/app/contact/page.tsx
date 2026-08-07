import type { Metadata } from 'next';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { ContactForm } from '@/components/contact/ContactForm';
import { Bn } from '@/components/ui/Bn';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: '/contact',
    title: 'Contact Renvura',
    description:
      'Call, email or message Renvura with a question about a product, an age group or an order.',
  });
}

export default function ContactPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Contact Renvura</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Ask about a product, an age group, or anything that is not clear on the site. Messages
          reach the founder directly.
        </p>
        <Bn as="p" className="mt-2 text-base leading-relaxed text-ink-muted">
          যেকোনো প্রশ্ন থাকলে সরাসরি ফোন করুন বা বার্তা পাঠান।
        </Bn>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <section aria-labelledby="contact-form-heading" className="order-2 lg:order-1">
          <h2 id="contact-form-heading" className="font-display text-xl text-ink">
            Send a message
          </h2>
          <div className="mt-5">
            <ContactForm />
          </div>
        </section>

        <section aria-labelledby="contact-details-heading" className="order-1 lg:order-2">
          <h2 id="contact-details-heading" className="font-display text-xl text-ink">
            Contact details
          </h2>
          <ul className="mt-5 space-y-4">
            <li>
              <a
                href={siteConfig.phoneHref}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <FiPhone aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
                <span>
                  <span className="block text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Phone
                  </span>
                  <span className="latin block text-base font-semibold text-ink">
                    {siteConfig.phone}
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.emailHref}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <FiMail aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Email
                  </span>
                  <span className="latin block break-all text-base font-semibold text-ink">
                    {siteConfig.email}
                  </span>
                </span>
              </a>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
              <FiMapPin aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
              <span>
                <span className="block text-xs uppercase tracking-[0.14em] text-ink-muted">
                  Location
                </span>
                <span className="block text-base font-semibold text-ink">
                  {siteConfig.location}
                </span>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </Container>
  );
}
