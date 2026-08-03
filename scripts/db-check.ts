import { config } from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../src/lib/db/mongoose';
import { ContactSubmission } from '../src/lib/models/ContactSubmission';
import { RateLimitHit } from '../src/lib/models/RateLimitHit';

/**
 * `npm run db:check`
 *
 * Connectivity and index verification, kept deliberately separate from the
 * build: `npm run build` must succeed with no database reachable.
 */
config({ path: '.env.local', quiet: true });
config({ quiet: true });

async function main(): Promise<void> {
  const started = Date.now();
  console.log('Connecting to MongoDB…');

  await connectToDatabase();

  const admin = mongoose.connection.db?.admin();
  if (!admin) throw new Error('No database handle after connect');
  await admin.ping();

  console.log(`Connected in ${Date.now() - started} ms`);
  console.log(`  host:     ${mongoose.connection.host}`);
  console.log(`  database: ${mongoose.connection.name}`);

  // Creates the TTL index on first run; a no-op afterwards.
  await ContactSubmission.syncIndexes();
  await RateLimitHit.syncIndexes();

  const counts = await Promise.all([
    ContactSubmission.estimatedDocumentCount(),
    RateLimitHit.estimatedDocumentCount(),
  ]);

  console.log(`  contact_submissions: ${counts[0]} document(s)`);
  console.log(`  rate_limit_hits:     ${counts[1]} document(s)`);
  console.log('Indexes synced. Database OK.');
}

main()
  .then(async () => {
    await disconnectFromDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Database check failed:');
    console.error(error instanceof Error ? error.message : error);
    await disconnectFromDatabase().catch(() => undefined);
    process.exit(1);
  });
