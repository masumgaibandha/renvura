import type { Metadata } from 'next';
import { AgeRail } from '@/components/home/AgeRail';
import { ArticlesRail } from '@/components/home/ArticlesRail';
import { CatalogueStatus } from '@/components/home/CatalogueStatus';
import { CategoryRail } from '@/components/home/CategoryRail';
import { FounderTrust } from '@/components/home/FounderTrust';
import { Hero } from '@/components/home/Hero';
import { ProductRail } from '@/components/home/ProductRail';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { SupportSection } from '@/components/home/SupportSection';
import { WhyRenvura } from '@/components/home/WhyRenvura';
import {
  getAgeBands,
  getBestSellers,
  getCategoryTiles,
  getCustomerReviews,
  getFeaturedProducts,
  getHelpfulArticles,
  getNewArrivals,
} from '@/lib/content/storefront';
import { homepageSections, type HomepageSectionId } from '@/lib/homepage-sections';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: '/',
    title: 'Renvura — Children’s products for Bangladeshi families',
    description:
      'Learning and play, baby essentials, feeding, safety, clothing and school supplies for children — selected by a child-development specialist and explained in plain language.',
  });
}

/**
 * Product-first homepage.
 *
 * The section **order comes from configuration** (`homepageSections`), not from
 * the order of JSX in this file (D-10). This component's job is to resolve each
 * configured section id to a component and render the enabled ones in the
 * configured order.
 *
 * Every data-backed section returns `null` on an empty dataset, so in Phase 1 —
 * where categories, age bands, products, articles and reviews are all
 * deliberately empty (§11.1.2) — the page renders the hero, an honest catalogue
 * status, the trust row, the small founder block and support. Nothing is
 * invented to fill the gap (D-12).
 */
export default async function HomePage() {
  const [categories, ageBands, featured, bestSellers, newArrivals, articles, reviews] =
    await Promise.all([
      getCategoryTiles(),
      getAgeBands(),
      getFeaturedProducts(),
      getBestSellers(),
      getNewArrivals(),
      getHelpfulArticles(),
      getCustomerReviews(),
    ]);

  const hasMerchandising =
    categories.length > 0 || ageBands.length > 0 || featured.length > 0 || newArrivals.length > 0;

  const rendered: Record<HomepageSectionId, React.ReactNode> = {
    hero: <Hero />,
    categories: <CategoryRail categories={categories} />,
    ages: <AgeRail bands={ageBands} />,
    'featured-products': (
      <ProductRail
        eyebrow="Handpicked"
        title="Featured Products"
        products={featured}
        viewAllHref="/products"
      />
    ),
    // Needs real destination categories or collections; disabled in config
    // until Phase 2 provides them.
    'promo-banners': null,
    // Only ever populated from completed-order data (D-10).
    'best-sellers': (
      <ProductRail eyebrow="Popular" title="Best Sellers" products={bestSellers} />
    ),
    collections: null,
    'new-arrivals': (
      <ProductRail
        eyebrow="Just in"
        title="New arrivals"
        products={newArrivals}
        viewAllHref="/products"
      />
    ),
    offers: null,
    'why-renvura': <WhyRenvura />,
    founder: <FounderTrust />,
    articles: <ArticlesRail articles={articles} />,
    reviews: <ReviewsSection reviews={reviews} />,
    support: <SupportSection />,
  };

  return (
    <>
      {homepageSections
        .filter((section) => section.enabled)
        .map((section) => {
          const node = rendered[section.id];
          if (node === null) return null;
          return (
            <div key={section.id}>
              {node}
              {/* Explains the empty storefront while the catalogue is still
                  being prepared, in the position the first product grid will
                  eventually occupy. Disappears by itself once merchandising
                  data exists — no flag to remember. */}
              {section.id === 'hero' && !hasMerchandising ? <CatalogueStatus /> : null}
            </div>
          );
        })}
    </>
  );
}
