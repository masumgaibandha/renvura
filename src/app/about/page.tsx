import type { Metadata } from 'next';
import { AppLink } from '@/components/ui/AppLink';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: '/about',
    title: 'About Renvura',
    description:
      'Renvura is a children’s store for Bangladeshi families, founded by Abdullah Al Masum — M.Ed., Institute of Education and Research, University of Dhaka.',
  });
}

/**
 * The founder's story lives here in full (D-09). The homepage carries only a
 * small trust row that links to this page.
 */
export default function AboutPage() {
  const sections = [
    {
      title: 'Who is behind Renvura',
      body: 'Renvura was founded by Abdullah Al Masum, who holds an M.Ed. from the Institute of Education and Research, University of Dhaka, and has worked in early childhood care and development and inclusive education. That background is why the shop exists, and it is what shapes which products earn a place in it.',
    },
    {
      title: 'What Renvura sells',
      body: 'A broad range of children’s products for families in Bangladesh: learning and play materials, toys, baby essentials, feeding, child care, safety, clothing, accessories, school supplies, travel items and gifts. Learning and play-based products are where the deepest curation starts, but they are not the whole shop.',
    },
    {
      title: 'How products are chosen',
      body: 'Each product is selected rather than bulk-listed. Where a product genuinely supports a stage of development, that is explained on its page. Where it is simply a good, well-made everyday item, it is described as exactly that — no invented developmental benefit, and no safety claim that has not been verified.',
    },
    {
      title: 'How we write about products',
      body: 'The interface is in English because that is what most parents shopping online already navigate. Where understanding matters most — detailed explanations, usage instructions, age guidance, safety warnings and delivery information — Bangla appears alongside it.',
    },
    {
      title: 'Where things stand',
      body: 'The shop is still being built. Products, prices, delivery and ordering are not open yet, and nothing on this site is a live product offer. Everything published here is accurate as of today; when the catalogue opens it will carry real details rather than estimates.',
    },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <article className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">About Renvura</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">
          A children’s store for Bangladeshi families, built around one idea: a parent should be
          able to trust what they are told about a product.
        </p>

        {sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="font-display text-xl text-ink sm:text-2xl">{section.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">{section.body}</p>
          </section>
        ))}

        <AppLink
          href="/contact"
          className="mt-12 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
        >
          Ask a question
        </AppLink>
      </article>
    </Container>
  );
}
