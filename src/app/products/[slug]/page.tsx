import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/commerce/ProductGallery';
import { ProductGrid } from '@/components/commerce/ProductGrid';
import { AppLink } from '@/components/ui/AppLink';
import { Bn } from '@/components/ui/Bn';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { isProductIndexable } from '@/lib/catalogue/demo';
import { formatTakaOrUndefined } from '@/lib/catalogue/price';
import { getProductDetail, getRelatedProducts, type ProductDetailData } from '@/lib/content/storefront';
import { buildMetadata } from '@/lib/seo/metadata';
import { productSchema } from '@/lib/seo/schema';

/**
 * Product detail — design direction §8.4.
 *
 * Order: breadcrumb → gallery and buy box → description → Bangla explanation →
 * specifications → related. Every optional block is **absent, not empty**, when
 * its data is missing — no section headings without content.
 *
 * Rendered on demand rather than statically generated: `generateStaticParams`
 * would need a database at build time, and the build's independence from Mongo
 * is a kept Phase 1 invariant (D-15).
 *
 * A draft or demo product resolves only through the demo-gated lookup, so with
 * demo mode off — which is always, in production — every one of these URLs is a
 * genuine 404.
 *
 * **This segment deliberately has no `loading.tsx`.** A loading file wraps the
 * route in Suspense, which flushes the response shell — and its 200 status —
 * before `notFound()` can run, turning every unknown slug into a soft 404. A
 * correct status code matters more here than a skeleton: search engines must
 * not index a "product not found" page, and the lookup is one indexed query.
 * The shop's own loading state lives in the `(shop)` route group for the same
 * reason, so it cannot wrap this route.
 */

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) return buildMetadata({ path: `/products/${slug}`, title: 'Product not found', noindex: true });

  return buildMetadata({
    path: `/products/${product.slug}`,
    title: product.name,
    description: product.shortDescription,
    // Demo and draft products are never indexed (D-08, §7.1). `buildMetadata`
    // additionally forces noindex site-wide whenever demo mode is on.
    noindex: !isProductIndexable(product),
  });
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product.slug, product.categoryLabel);
  // Built and tested, never emitted for a demo record — the gate returns null.
  const schema = productSchema(product);

  return (
    <div className="py-6 sm:py-10">
      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}

      <Container>
        <Breadcrumb name={product.name} />

        {/* One article per product: everything inside describes *this* product,
            and the related rail below deliberately sits outside it. */}
        <article aria-labelledby="product-title">
          <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery
              images={product.images}
              video={product.video}
              productName={product.name}
            />

            <BuyBox product={product} />
          </div>

          <ProductDetails product={product} />
        </article>
      </Container>

      {related.length > 0 ? (
        <section className="mt-14 sm:mt-20">
          <Container>
            <SectionHeading eyebrow="More to see" title="Related products" />
            <div className="mt-6">
              <ProductGrid products={related} aria-label="Related products" />
            </div>
          </Container>
        </section>
      ) : null}
    </div>
  );
}

/** Shop → product. The category is text, not a link: `/category/[slug]` is Phase 3. */
function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
        <li>
          <AppLink
            href="/products"
            className="inline-flex min-h-11 items-center rounded transition-colors hover:text-ink"
          >
            Shop
          </AppLink>
        </li>
        <li aria-hidden="true">/</li>
        <li className="truncate" aria-current="page">
          {name}
        </li>
      </ol>
    </nav>
  );
}

function BuyBox({ product }: { product: ProductDetailData }) {
  const isComingSoon = product.availability === 'coming-soon';
  const price = formatTakaOrUndefined(product.priceMinor);
  const comparePrice = formatTakaOrUndefined(product.comparePriceMinor);

  return (
    <div className="lg:pt-2">
      {/* Category and the demo marker share one meta line: both are small
          context, and giving each its own row costs a line of vertical space
          that the price needs on a phone. */}
      {product.categoryLabel || product.isDemo ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {product.categoryLabel ? (
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted sm:text-xs">
              {product.categoryLabel}
            </p>
          ) : null}

          {product.isDemo ? (
            <span className="inline-flex items-center rounded-full bg-brand-navy px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-cream">
              Demo product — not for sale
            </span>
          ) : null}
        </div>
      ) : null}

      <h1
        id="product-title"
        className="mt-2 font-display text-[1.625rem] leading-[1.2] text-ink sm:text-[2.125rem]"
      >
        {product.name}
      </h1>

      {/**
       * The price position carries exactly one of three things, never two:
       * a real price pair, a Coming Soon marker, or an honest "not priced yet".
       * A Coming Soon product has no price at all — not ৳0, not a struck-through
       * reference, not an estimate (D-12).
       */}
      {isComingSoon ? (
        <p className="mt-3 inline-flex items-center rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted sm:mt-4">
          Coming soon
        </p>
      ) : price !== undefined ? (
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:mt-4">
          <span className="latin text-2xl font-bold text-ink sm:text-[1.75rem]">
            <span className="sr-only">Price </span>
            {price}
          </span>
          {comparePrice !== undefined ? (
            <del className="latin text-base text-ink-muted decoration-ink-muted/60">
              <span className="sr-only">Was </span>
              {comparePrice}
            </del>
          ) : null}
        </p>
      ) : (
        <p className="mt-3 text-sm font-medium text-ink-muted sm:mt-4">Price to be confirmed</p>
      )}

      {product.shortDescription ? (
        <p className="mt-4 text-base leading-relaxed text-ink-muted sm:mt-5">
          {product.shortDescription}
        </p>
      ) : null}

      <PurchaseArea isComingSoon={isComingSoon} />
    </div>
  );
}

/**
 * The purchase area, honestly.
 *
 * Cart and checkout arrive in Phase 4. Rather than a disabled "Add to Cart"
 * that teaches a customer the store is broken, this states where things stand
 * and offers the one action that genuinely works today (§11.1.1). Phase 4
 * replaces this block; nothing else on the page changes.
 */
function PurchaseArea({ isComingSoon }: { isComingSoon: boolean }) {
  return (
    <div className="mt-7 rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm font-semibold text-ink">
        {isComingSoon ? 'Not available to order yet' : 'Ordering is not open yet'}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        {isComingSoon
          ? // No price, no arrival date, no waiting list: none of the three has
            // been decided, and a promise about any of them would be invented.
            'This is one we have chosen but not confirmed yet — the price and the delivery details are still being worked out. Ask about it and we will tell you honestly where it stands.'
          : 'Online ordering and delivery are still being set up. Until then you can ask about this product directly and we will tell you honestly where it stands.'}
      </p>
      <AppLink
        href="/contact"
        className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
      >
        Ask about this product
      </AppLink>
    </div>
  );
}

function ProductDetails({ product }: { product: ProductDetailData }) {
  const hasDescription = product.descriptionParagraphs.length > 0;
  const hasBangla = product.descriptionBnParagraphs.length > 0;
  const hasFeatures = product.features.length > 0;
  const hasSpecs = product.specifications.length > 0;

  if (!hasDescription && !hasBangla && !hasFeatures && !hasSpecs) return null;

  return (
    <div className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
      <div className="max-w-2xl">
        {hasDescription ? (
          <section>
            <h2 className="font-display text-xl text-ink sm:text-2xl">About this product</h2>
            <div className="mt-4 space-y-4">
              {product.descriptionParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {hasBangla ? (
          /**
           * The Bangla explanation — exactly the content that earns Bangla
           * (D-02, §4.3): the paragraph a parent actually reads before
           * deciding. `<Bn>` applies `lang="bn"` and the Bengali face to this
           * run only; the page stays `lang="en"`.
           */
          <section className="mt-10 rounded-2xl bg-soft-sky/50 p-5 sm:p-6">
            <Bn as="h2" className="font-display text-lg text-ink sm:text-xl">
              বাংলায় সংক্ষেপে
            </Bn>
            <div className="mt-3 space-y-3">
              {product.descriptionBnParagraphs.map((paragraph) => (
                <Bn
                  as="p"
                  key={paragraph.slice(0, 40)}
                  className="text-[0.9375rem] leading-relaxed text-ink-muted"
                >
                  {paragraph}
                </Bn>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div>
        {hasFeatures ? (
          <section>
            <h2 className="font-display text-xl text-ink sm:text-2xl">What is included</h2>
            <ul className="mt-4 space-y-2.5">
              {product.features.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/**
         * Specifications render only from real attribute rows. Material,
         * origin, age suitability, certification and warranty are deliberately
         * absent: they exist as unverified supplier evidence and may never be
         * presented as fact (D-16, §7.2).
         */}
        {hasSpecs ? (
          <section className={hasFeatures ? 'mt-10' : undefined}>
            <h2 className="font-display text-xl text-ink sm:text-2xl">Specifications</h2>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {product.specifications.map((row) => (
                <div key={row.label} className="flex gap-4 py-3 text-sm">
                  <dt className="w-2/5 shrink-0 text-ink-muted">{row.label}</dt>
                  <dd className="text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
