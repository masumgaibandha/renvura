import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ACCENT_TOKENS, COMPLIANCE_FIELDS } from '@/lib/catalogue/types';

/**
 * Category — docs/PROJECT_SPECIFICATION.md §3.2, §7.4; D-01, D-16.
 *
 * **Categories are data, not code.** Adding, renaming, reordering, nesting or
 * retiring one is an admin operation with no deployment, and no category is
 * privileged in the schema — "Educational" is a category like any other (D-01).
 *
 * **This file deliberately ships no categories.** The production set is a
 * Phase 2B decision the founder makes (U-2, §11.1.2); Phase 1 and 2A build
 * against an empty collection and must not hardcode an invented set.
 *
 * Nesting is a plain `parent` reference. Two levels are the documented minimum
 * (`Toys → Wooden Toys`) and `maxDepthFrom()` enforces that ceiling; a
 * materialised path would buy depth nobody has asked for.
 */

/**
 * Which §7.2 compliance fields must be present — and verified — before a
 * product in this category may move from `draft` to `active`.
 *
 * Configurable data, per §7.2: this project names no statute, standard number or
 * certification scheme as applicable to Renvura. Higher-risk groups (feeding,
 * skincare, electrical, safety products, anything for under-3s) are expected to
 * carry a stricter profile, but *what* they require must be confirmed by a
 * qualified adviser before anything is published (U-3).
 */
const complianceProfileSchema = new Schema(
  {
    requiredFields: { type: [{ type: String, enum: COMPLIANCE_FIELDS }], default: undefined },
    /**
     * When true, the required fields must additionally sit behind
     * `compliance.verification.status === 'verified'` before publishing.
     */
    requiresVerification: { type: Boolean, default: false },
    /** Free-text note for the admin: why this profile exists, who confirmed it. */
    note: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
    /** Optional Bangla name — used for search aliasing, not as a label (§4.4). */
    nameBn: { type: String, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 4000 },
    descriptionBn: { type: String, trim: true, maxlength: 4000 },
    /** `null` / absent for a top-level category. */
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    image: {
      type: new Schema(
        {
          url: { type: String, trim: true },
          alt: { type: String, trim: true, maxlength: 300 },
          width: { type: Number, min: 1 },
          height: { type: Number, min: 1 },
        },
        { _id: false },
      ),
    },
    /** Stable pastel, assigned as data so the colour never shifts (D-06). */
    accentToken: { type: String, enum: ACCENT_TOKENS },
    complianceProfile: { type: complianceProfileSchema },
    searchAliases: { type: [String], default: undefined },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
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
  },
  { timestamps: true, collection: 'categories' },
);

categorySchema.index({ slug: 1 }, { unique: true });
// The nav/tree query: children of a parent, active, in configured order.
categorySchema.index({ parent: 1, isActive: 1, sortOrder: 1 });
categorySchema.index({ searchAliases: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc> | undefined) ??
  mongoose.model<CategoryDoc>('Category', categorySchema);

/** The documented minimum nesting depth (§3.2): `Toys → Wooden Toys`. */
export const MAX_CATEGORY_DEPTH = 2;
