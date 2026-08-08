import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import {
  CATALOGUE_AVAILABILITIES,
  COMPLIANCE_FIELDS,
  EVIDENCE_SOURCE_TYPES,
  PRODUCT_BADGES,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  SAFETY_SEVERITIES,
  STOCK_POLICIES,
  VERIFICATION_STATUSES,
} from '@/lib/catalogue/types';

/**
 * Product — docs/PROJECT_SPECIFICATION.md §7.1, §7.2; D-01, D-16.
 *
 * TWO RULES SHAPE THIS ENTIRE SCHEMA.
 *
 * 1. **Draft freely, validate at publish (§7.3).** Only `status` and
 *    `stockPolicy` are `required` here. Everything else — name, price, SKU,
 *    images, category — is optional at the database level so the founder can add
 *    a name today and images next week without the write being rejected. The
 *    full requirement set is enforced by `validateForPublish()` at the
 *    transition to `active`, which reports a per-field checklist. Tightening
 *    `required` here would recreate exactly the failure §12.1 warns about:
 *    partial products going into a spreadsheet instead of the admin.
 *
 * 2. **Nothing child-development-specific is privileged (D-01).** A pack of
 *    feeding bibs and a fine-motor lacing set use the same document. The
 *    developmental block is nullable, absent by default, and never required by
 *    any form, route or component. `safetyWarnings` deliberately lives in the
 *    compliance block, not the developmental one — a bottle steriliser needs a
 *    safety warning and has no development domain.
 */

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * `width`/`height` are stored per image and are not optional in practice —
 * `next/image` needs real intrinsic dimensions to reserve space, and the CLS
 * budget is a launch gate (D-14). Inspection of the five reference products
 * found 600×600, 552×542, 1024×1024 and 1059×1008 *within the same product*, so
 * no square or uniform-size assumption is safe.
 *
 * `format` is recorded explicitly because file extensions lie: one reference
 * file named `.jpg` contains PNG data. Any future upload pipeline (Phase 6)
 * must sniff content, never trust the name.
 */
const productImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    /** Meaningful English alt text. Required to publish, not to draft (§10). */
    alt: { type: String, trim: true, maxlength: 300 },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    format: { type: String, trim: true, lowercase: true },
    sortOrder: { type: Number, default: 0 },
    /** Exactly one image should carry this; helpers fall back to sortOrder. */
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

/**
 * Optional product video. Each reference product ships one `demo.mp4` (3–15 MB),
 * which is why this exists — but it is never required, and a poster frame is
 * kept separately so a video never becomes an unreserved layout box.
 */
const productVideoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    title: { type: String, trim: true, maxlength: 200 },
    posterUrl: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/* Variants                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Deliberately a flat, flexible list rather than an option-matrix engine.
 *
 * `options` is an open key/value list (`{ name: 'Size', value: 'Large' }`), so
 * size, colour, style and pack quantity are data — none of them is named in the
 * schema. A variant overrides only what actually differs; anything left unset
 * falls back to the parent product. That covers the launch scope without a
 * Shopify-scale engine nobody has asked for.
 */
const variantOptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { _id: false },
);

const productVariantSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 200 },
    sku: { type: String, trim: true, uppercase: true, maxlength: 60 },
    options: { type: [variantOptionSchema], default: undefined },
    /** Minor units (poisha), like the parent. Unset = inherit parent price. */
    priceMinor: { type: Number, min: 0 },
    comparePriceMinor: { type: Number, min: 0 },
    /** Only meaningful when the parent `stockPolicy` is `track`. */
    stock: { type: Number, min: 0 },
    imageUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

/* -------------------------------------------------------------------------- */
/* Compliance block (§7.2, D-16)                                               */
/* -------------------------------------------------------------------------- */

const bilingualSchema = new Schema(
  {
    en: { type: String, trim: true, maxlength: 4000 },
    bn: { type: String, trim: true, maxlength: 4000 },
  },
  { _id: false },
);

const partySchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 200 },
    contact: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false },
);

/**
 * Every claim carries an evidence reference and the block carries a
 * verification state. A claim that is not `verified` is never rendered.
 */
const evidenceSchema = new Schema(
  {
    /** Which compliance field this evidence backs. */
    field: { type: String, enum: COMPLIANCE_FIELDS, required: true },
    sourceType: { type: String, enum: EVIDENCE_SOURCE_TYPES, required: true },
    sourceRef: { type: String, required: true, trim: true, maxlength: 500 },
    documentUrl: { type: String, trim: true },
    capturedAt: { type: Date },
  },
  { _id: false },
);

const complianceSchema = new Schema(
  {
    manufacturer: { type: partySchema },
    supplier: { type: partySchema },
    countryOfOrigin: { type: String, trim: true, maxlength: 100 },
    materials: {
      type: [
        new Schema(
          {
            component: { type: String, trim: true, maxlength: 120 },
            material: { type: String, trim: true, maxlength: 120 },
            note: { type: String, trim: true, maxlength: 300 },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    safetyWarnings: {
      type: [
        new Schema(
          {
            en: { type: String, trim: true, maxlength: 1000 },
            bn: { type: String, trim: true, maxlength: 1000 },
            severity: { type: String, enum: SAFETY_SEVERITIES, default: 'caution' },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    /** e.g. small-parts / choking guidance. */
    ageSafetyNote: { type: bilingualSchema },
    certifications: {
      type: [
        new Schema(
          {
            scheme: { type: String, trim: true, maxlength: 120 },
            reference: { type: String, trim: true, maxlength: 200 },
            issuedBy: { type: String, trim: true, maxlength: 200 },
            issuedAt: { type: Date },
            expiresAt: { type: Date },
            documentUrl: { type: String, trim: true },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    testReports: {
      type: [
        new Schema(
          {
            labName: { type: String, trim: true, maxlength: 200 },
            reportRef: { type: String, trim: true, maxlength: 200 },
            testedAt: { type: Date },
            documentUrl: { type: String, trim: true },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    batch: {
      type: new Schema(
        {
          batchCode: { type: String, trim: true, maxlength: 120 },
          manufacturedAt: { type: Date },
          expiresAt: { type: Date },
        },
        { _id: false },
      ),
    },
    warranty: {
      type: new Schema(
        {
          periodMonths: { type: Number, min: 0 },
          terms: { type: bilingualSchema },
          provider: { type: String, trim: true, maxlength: 200 },
        },
        { _id: false },
      ),
    },
    evidence: { type: [evidenceSchema], default: undefined },
    verification: {
      type: new Schema(
        {
          status: { type: String, enum: VERIFICATION_STATUSES, default: 'unverified' },
          verifiedBy: { type: String, trim: true, maxlength: 200 },
          verifiedAt: { type: Date },
          notes: { type: String, trim: true, maxlength: 2000 },
        },
        { _id: false },
      ),
    },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/* Product                                                                     */
/* -------------------------------------------------------------------------- */

const productSchema = new Schema(
  {
    // --- Always required, even on a draft (§7.1) --------------------------
    status: { type: String, enum: PRODUCT_STATUSES, required: true, default: 'draft' },
    stockPolicy: { type: String, enum: STOCK_POLICIES, required: true, default: 'track' },
    /**
     * Whether a customer can buy this yet — separate from `status` (see
     * `CATALOGUE_AVAILABILITIES`). Required with a default so no document can
     * be ambiguous: a missing value would have to be guessed at every render.
     * `coming-soon` products carry no price, and the storefront never invents
     * one for them.
     */
    availability: {
      type: String,
      enum: CATALOGUE_AVAILABILITIES,
      required: true,
      default: 'available',
    },

    // --- Required to publish, optional while drafting ----------------------
    name: { type: String, trim: true, maxlength: 250 },
    slug: { type: String, trim: true, lowercase: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 20000 },
    /** Minor units (poisha) — integers only, never a float rupee amount. */
    priceMinor: { type: Number, min: 0 },
    sku: { type: String, trim: true, uppercase: true, maxlength: 60 },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    images: { type: [productImageSchema], default: undefined },
    /** Meaningful only when `stockPolicy` is `track` (§7.1). */
    stock: { type: Number, min: 0 },

    // --- Optional core -----------------------------------------------------
    /** The detailed Bangla explanation a parent reads before deciding (D-02). */
    descriptionBn: { type: String, trim: true, maxlength: 20000 },
    shortDescription: { type: String, trim: true, maxlength: 600 },
    /** Only when a real prior price existed (D-12). */
    comparePriceMinor: { type: Number, min: 0 },
    brand: { type: String, trim: true, maxlength: 150 },
    categories: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: undefined },
    collections: { type: [{ type: Schema.Types.ObjectId, ref: 'Collection' }], default: undefined },
    tags: { type: [String], default: undefined },
    /**
     * Bangla terms, transliterations and common misspellings, so a shopper
     * typing Bangla finds an English-named product (§4.4). Indexed for search
     * only — never rendered as a label.
     */
    searchAliases: { type: [String], default: undefined },
    videos: { type: [productVideoSchema], default: undefined },
    variants: { type: [productVariantSchema], default: undefined },
    /** Generic spec rows — the extension point for material, dimensions, etc. */
    attributes: {
      type: [
        new Schema(
          {
            key: { type: String, trim: true, maxlength: 80 },
            labelEn: { type: String, trim: true, maxlength: 120 },
            value: { type: String, trim: true, maxlength: 500 },
            unit: { type: String, trim: true, maxlength: 30 },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    badges: { type: [{ type: String, enum: PRODUCT_BADGES }], default: undefined },
    weightGrams: { type: Number, min: 0 },
    isFeatured: { type: Boolean, default: false },
    /**
     * Populated by the review system only (Phase 12). Never seeded, never
     * estimated — `AggregateRating` depends on it being real (D-12).
     */
    ratingSummary: {
      type: new Schema(
        { average: { type: Number, min: 0, max: 5 }, count: { type: Number, min: 0 } },
        { _id: false },
      ),
    },
    seo: {
      type: new Schema(
        {
          metaTitle: { type: String, trim: true, maxlength: 200 },
          metaDescription: { type: String, trim: true, maxlength: 400 },
          ogImage: { type: String, trim: true },
        },
        { _id: false },
      ),
    },

    // --- Bundles -----------------------------------------------------------
    productType: { type: String, enum: PRODUCT_TYPES, required: true, default: 'single' },
    bundleItems: {
      type: [
        new Schema(
          {
            product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            qty: { type: Number, min: 1, default: 1 },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },

    // --- Optional child-development block (D-01, §3.4) ---------------------
    // Entirely nullable marketing/guidance content. A product carrying none of
    // it must render a complete, professional page with no empty headings.
    ageRange: {
      type: new Schema(
        { minMonths: { type: Number, min: 0 }, maxMonths: { type: Number, min: 0 } },
        { _id: false },
      ),
    },
    developmentDomains: { type: [String], default: undefined },
    expertNote: { type: bilingualSchema },
    milestones: { type: [bilingualSchema], default: undefined },
    ageGuidance: { type: bilingualSchema },

    // --- Optional compliance block (D-16, §7.2) ----------------------------
    compliance: { type: complianceSchema },

    // --- Demo data (D-08) --------------------------------------------------
    /**
     * A **label, not a safety mechanism**. Containment is the separate
     * development database plus the runtime guard in `@/lib/catalogue/demo`.
     */
    isDemo: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: 'products' },
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                     */
/* -------------------------------------------------------------------------- */

// Partial uniqueness: a draft may legitimately have no slug or SKU yet, and a
// plain unique index would collide on the second such draft.
productSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: 'string' } } },
);
productSchema.index(
  { sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $type: 'string' } } },
);

// The base storefront listing: active, non-demo, newest first. Availability is
// part of the key because every grid orders sellable products ahead of
// coming-soon ones.
productSchema.index({ status: 1, isDemo: 1, availability: 1, createdAt: -1 });
// Category and collection listing pages.
productSchema.index({ category: 1, status: 1 });
productSchema.index({ collections: 1, status: 1 });
// Age navigation — band membership is derived from the month range (§3.3).
productSchema.index({ 'ageRange.minMonths': 1, 'ageRange.maxMonths': 1, status: 1 });
// Homepage featured grid; partial so the index stays small.
productSchema.index(
  { status: 1, isFeatured: 1 },
  { partialFilterExpression: { isFeatured: true } },
);
// Bangla alias lookup (Phase 3). A multikey index, not a text index — the
// full-text strategy is a Phase 3 decision and may be Atlas Search instead.
productSchema.index({ searchAliases: 1 });
// Demo purge and the production guard's "is any demo product active?" check.
productSchema.index({ isDemo: 1, status: 1 }, { partialFilterExpression: { isDemo: true } });

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc> | undefined) ??
  mongoose.model<ProductDoc>('Product', productSchema);
