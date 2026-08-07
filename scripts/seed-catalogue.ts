import { config } from 'dotenv';
import { seedCatalogue } from '../src/lib/catalogue/seed';
import { countActiveDemoProducts } from '../src/lib/catalogue/repository';
import { connectToDatabase, disconnectFromDatabase } from '../src/lib/db/mongoose';
import { AgeBand } from '../src/lib/models/AgeBand';
import { Category } from '../src/lib/models/Category';
import { Product } from '../src/lib/models/Product';

/**
 * `npm run db:seed`
 *
 * Creates the protected demo catalogue: the initial category tree, the five
 * browsing age bands, and five demo/draft products built from the reference
 * folders.
 *
 * Refuses to run against the production site. Point `MONGODB_DB_NAME` at a
 * development database before running — demo records must never share a cluster
 * with real products (D-08).
 */
config({ path: '.env.local', quiet: true });
config({ quiet: true });

async function main(): Promise<void> {
  console.log('Seeding demo catalogue…');

  await connectToDatabase();
  await Promise.all([Category.syncIndexes(), AgeBand.syncIndexes(), Product.syncIndexes()]);

  const summary = await seedCatalogue();

  console.log(`  categories:     ${summary.categories}`);
  console.log(`  age bands:      ${summary.ageBands}`);
  console.log(`  products:       ${summary.products} (demo drafts)`);
  console.log(`  images staged:  ${summary.imagesStaged}`);
  console.log(`  videos staged:  ${summary.videosStaged}`);

  for (const warning of summary.warnings) console.log(`  note: ${warning}`);

  // Demo products are seeded as drafts, so this must stay at zero.
  console.log(`  active demo products: ${await countActiveDemoProducts()}`);
  console.log('Done. Records are isDemo:true, status:draft — not public, not indexed.');
}

main()
  .then(async () => {
    await disconnectFromDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Seed failed:');
    console.error(error instanceof Error ? error.message : error);
    await disconnectFromDatabase().catch(() => undefined);
    process.exit(1);
  });
