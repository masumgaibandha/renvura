import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { assertDemoModeAllowed, DemoDataError } from '@/lib/catalogue/demo';
import { readImageMetadata } from '@/lib/catalogue/image-metadata';
import {
  AGE_BAND_SEEDS,
  CATEGORY_SEEDS,
  NEVER_STOREFRONT_MEDIA,
  PRODUCT_SEEDS,
  type ProductSeed,
} from '@/lib/catalogue/seed-data';
import { validateAgeBandSequence } from '@/lib/catalogue/age-bands';
import { isProductionSite } from '@/lib/env';
import { AgeBand } from '@/lib/models/AgeBand';
import { Category } from '@/lib/models/Category';
import { Product } from '@/lib/models/Product';

/**
 * Demo catalogue seeding — D-08, §3.5.
 *
 * Idempotent: every write is an upsert keyed on `slug`, so re-running updates
 * in place and never duplicates. Safe to run after editing `seed-data.ts`.
 *
 * Refuses to run on the production site, twice over: once through
 * `assertDemoModeAllowed()` and once through the explicit check below, because
 * this function *creates* the records the guard exists to keep out.
 *
 * Media is staged out of `assets/reference/products/` into
 * `public/demo-products/<slug>/`. Sources are read-only — never modified,
 * renamed or re-encoded. The staged copy is gitignored: it is regenerable demo
 * content and must not ship in a production deployment.
 */

const REFERENCE_ROOT = path.join(process.cwd(), 'assets', 'reference', 'products');
const STAGING_ROOT = path.join(process.cwd(), 'public', 'demo-products');
/** Public URL prefix for staged demo media. */
const STAGED_URL_PREFIX = '/demo-products';

export type SeedSummary = {
  categories: number;
  ageBands: number;
  products: number;
  imagesStaged: number;
  videosStaged: number;
  warnings: string[];
};

/** Copies a source file into staging unless an identical-sized copy exists. */
async function stageFile(source: string, destination: string): Promise<void> {
  const sourceStat = await stat(source);

  try {
    const existing = await stat(destination);
    if (existing.size === sourceStat.size) return;
  } catch {
    // Not staged yet.
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function seedProduct(
  seed: ProductSeed,
  categoryIds: Map<string, string>,
  summary: SeedSummary,
): Promise<void> {
  const folder = path.join(REFERENCE_ROOT, seed.folder);
  const stagingDir = path.join(STAGING_ROOT, seed.slug);

  const images: {
    url: string;
    alt: string;
    width: number;
    height: number;
    format: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];

  for (const [index, media] of seed.images.entries()) {
    if ((NEVER_STOREFRONT_MEDIA as readonly string[]).includes(media.file)) {
      throw new DemoDataError(
        `${seed.slug}: "${media.file}" may never be storefront media — it is internal sourcing reference.`,
      );
    }

    const source = path.join(folder, media.file);
    const buffer = await readFile(source);
    // Format and dimensions come from the bytes: extensions are unreliable in
    // this asset set (one `.jpg` holds PNG data).
    const meta = readImageMetadata(buffer);

    await stageFile(source, path.join(stagingDir, media.file));
    summary.imagesStaged += 1;

    images.push({
      url: `${STAGED_URL_PREFIX}/${seed.slug}/${media.file}`,
      alt: media.alt,
      width: meta.width,
      height: meta.height,
      format: meta.format,
      sortOrder: index,
      isPrimary: index === 0,
    });

    if (path.extname(media.file).toLowerCase().replace('.', '') !== meta.format.replace('jpeg', 'jpg')) {
      summary.warnings.push(
        `${seed.slug}/${media.file}: extension disagrees with actual format (${meta.format}); recorded the detected format.`,
      );
    }
  }

  const videos: { url: string; title?: string; sortOrder: number }[] = [];
  if (seed.video) {
    const source = path.join(folder, seed.video.file);
    try {
      await stageFile(source, path.join(stagingDir, seed.video.file));
      videos.push({ url: `${STAGED_URL_PREFIX}/${seed.slug}/${seed.video.file}`, title: seed.video.alt, sortOrder: 0 });
      summary.videosStaged += 1;
    } catch {
      summary.warnings.push(`${seed.slug}: video "${seed.video.file}" not found; skipped.`);
    }
  }

  const categoryId = categoryIds.get(seed.categorySlug);
  if (!categoryId) throw new DemoDataError(`${seed.slug}: unknown category "${seed.categorySlug}"`);

  await Product.findOneAndUpdate(
    { slug: seed.slug },
    {
      $set: {
        name: seed.name,
        slug: seed.slug,
        shortDescription: seed.shortDescription,
        description: seed.description,
        descriptionBn: seed.descriptionBn,
        category: categoryId,
        searchAliases: seed.searchAliases,
        attributes: seed.features.map((value) => ({ key: 'feature', labelEn: 'Includes', value })),
        images,
        videos: videos.length > 0 ? videos : undefined,
        seo: seed.seo,
        // Compliance: supplier observations only, recorded as non-probative
        // evidence and left explicitly unverified, so nothing here can ever
        // render on the storefront (§7.2, D-16).
        compliance: {
          evidence: seed.evidence,
          verification: { status: 'unverified', notes: 'Supplier listing observations only. No document or named responsible person has been obtained.' },
        },
        // Deliberately absent: priceMinor, sku, stock, ageRange,
        // developmentDomains, expertNote, milestones, ageGuidance. None of
        // these is founder-verified, and inventing any of them is exactly what
        // D-12 forbids.
        stockPolicy: 'track',
        status: 'draft',
        isDemo: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  summary.products += 1;
}

/**
 * Creates or updates the demo catalogue.
 *
 * @throws {DemoDataError} if run against the production site.
 */
export async function seedCatalogue(): Promise<SeedSummary> {
  assertDemoModeAllowed();

  if (isProductionSite()) {
    throw new DemoDataError(
      'Refusing to seed demo catalogue data on the production site. Demo products must never reach production (D-08).',
    );
  }

  const summary: SeedSummary = {
    categories: 0,
    ageBands: 0,
    products: 0,
    imagesStaged: 0,
    videosStaged: 0,
    warnings: [],
  };

  // Fail before writing anything if the configured bands are not a valid
  // contiguous, non-overlapping sequence (§3.3).
  const bandCheck = validateAgeBandSequence(AGE_BAND_SEEDS);
  if (!bandCheck.ok) {
    throw new DemoDataError(
      `Age band seed set is invalid: ${bandCheck.issues.map((issue) => `${issue.field} ${issue.code}`).join(', ')}`,
    );
  }

  // Parents first, so children can resolve their `parent` reference.
  const categoryIds = new Map<string, string>();
  const ordered = [...CATEGORY_SEEDS].sort((a, b) => (a.parentSlug ? 1 : 0) - (b.parentSlug ? 1 : 0));

  for (const seed of ordered) {
    const parentId = seed.parentSlug ? categoryIds.get(seed.parentSlug) : null;

    const doc = await Category.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          name: seed.name,
          slug: seed.slug,
          description: seed.description,
          parent: parentId ?? null,
          accentToken: seed.accentToken,
          searchAliases: seed.searchAliases,
          sortOrder: seed.sortOrder,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    categoryIds.set(seed.slug, String(doc?._id));
    summary.categories += 1;
  }

  for (const seed of AGE_BAND_SEEDS) {
    await AgeBand.findOneAndUpdate(
      { slug: seed.slug },
      { $set: { ...seed, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    summary.ageBands += 1;
  }

  for (const seed of PRODUCT_SEEDS) {
    await seedProduct(seed, categoryIds, summary);
  }

  return summary;
}
