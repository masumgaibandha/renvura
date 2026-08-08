import { config } from 'dotenv';
import { connectToDatabase, disconnectFromDatabase } from '../src/lib/db/mongoose';
import { formatTaka } from '../src/lib/catalogue/price';
import { Category } from '../src/lib/models/Category';
import { Product } from '../src/lib/models/Product';

/**
 * `npm run db:verify`
 *
 * Read-only inspection of the seeded demo catalogue. Prints what a reviewer
 * needs to confirm without opening a Mongo shell: which products exist, their
 * category, their price pair, their primary image, and that nothing is active
 * or non-demo.
 */
config({ path: '.env.local', quiet: true });
config({ quiet: true });

async function main(): Promise<void> {
  await connectToDatabase();

  const products = await Product.find({}).sort({ createdAt: 1 }).lean().exec();
  const categories = await Category.find({}).lean().exec();
  const names = new Map(categories.map((c) => [String(c._id), c.name]));

  console.log(`products in database: ${products.length}\n`);

  for (const p of products) {
    const primary = (p.images ?? []).find((i) => i.isPrimary) ?? (p.images ?? [])[0];
    const price = typeof p.priceMinor === 'number' ? formatTaka(p.priceMinor) : '—';
    const compare = typeof p.comparePriceMinor === 'number' ? formatTaka(p.comparePriceMinor) : '—';

    console.log(`  ${p.name}`);
    console.log(`    slug:     ${p.slug}`);
    console.log(`    category: ${p.category ? names.get(String(p.category)) : '—'}`);
    console.log(
      p.availability === 'coming-soon'
        ? '    price:    — (coming soon, deliberately unpriced)'
        : `    price:    ${price}  (was ${compare})`,
    );
    console.log(`    status:   ${p.status} · ${p.availability} · isDemo:${p.isDemo} · images:${(p.images ?? []).length} · videos:${(p.videos ?? []).length}`);
    console.log(`    primary:  ${primary?.url ?? '—'} ${primary?.width ?? '?'}x${primary?.height ?? '?'}`);
    console.log(`    sku:${p.sku ?? '—'} stock:${p.stock ?? '—'} ageRange:${p.ageRange ? 'SET' : '—'} verification:${p.compliance?.verification?.status ?? '—'}`);
  }

  // Retired slugs this seed no longer owns. Matched exactly, not by keyword:
  // "abacus" now appears legitimately in the approved name of product 3.
  const RETIRED_SLUGS = [
    'ten-row-wooden-abacus-with-number-cards',
    'wooden-fruit-and-number-learning-board',
    'felt-activity-book-with-carry-bag',
    'rainbow-bead-sorting-columns',
    'number-and-bead-matching-set',
    'two-player-remote-control-bumper-cars',
    'remote-control-bumper-cars-two-player-set',
  ];

  const stale = products.filter((p) => RETIRED_SLUGS.includes(p.slug ?? ''));
  const active = products.filter((p) => p.status === 'active');
  const nonDemo = products.filter((p) => p.isDemo !== true);

  // A Coming Soon product carrying a price is the failure mode worth naming:
  // it is the one state in which a customer could be shown a number nobody
  // approved (D-12).
  const pricedComingSoon = products.filter(
    (p) => p.availability === 'coming-soon' && typeof p.priceMinor === 'number',
  );

  console.log(`\nstale records from retired slugs: ${stale.length}`);
  console.log(`coming soon:          ${products.filter((p) => p.availability === 'coming-soon').length}`);
  console.log(`priced coming-soon:   ${pricedComingSoon.length}${pricedComingSoon.length > 0 ? '  ← MUST BE 0' : ''}`);
  console.log(`active products:      ${active.length}`);
  console.log(`non-demo products:    ${nonDemo.length}`);
  console.log(`categories:           ${categories.map((c) => c.slug).join(', ')}`);
}

main()
  .then(async () => {
    await disconnectFromDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    await disconnectFromDatabase().catch(() => undefined);
    process.exit(1);
  });
