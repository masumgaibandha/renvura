import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ACCENT_TOKENS } from '@/lib/catalogue/types';

/**
 * AgeBand — docs/PROJECT_SPECIFICATION.md §3.3, §7.5.
 *
 * Age is a **first-class navigation axis**, independent of category, and it
 * starts at newborn rather than at 2 because the store includes baby essentials
 * and feeding products (D-01).
 *
 * A product declares an age range in months; **band membership is derived**, so
 * re-banding never requires re-tagging products.
 *
 * **This file ships no bands.** The final set is a Phase 2B decision the founder
 * confirms (U-1, §11.1.2). The candidate set in §3.3 — 0–11 months, 1–2, 3–5,
 * 6–8, 9–12 years — is a suggestion for that conversation, not a default, and
 * hardcoding it here would be exactly the invented production data §11.1.2
 * forbids. Sequence validity is enforced by `@/lib/catalogue/age-bands`.
 */
const ageBandSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
    /** Inclusive lower bound, in months. */
    minMonths: { type: Number, required: true, min: 0 },
    /** Inclusive upper bound, in months. */
    maxMonths: { type: Number, required: true, min: 0 },
    /** Optional supporting line beneath the label (design direction §8.2). */
    supportingLine: { type: String, trim: true, maxlength: 200 },
    accentToken: { type: String, enum: ACCENT_TOKENS },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'age_bands' },
);

ageBandSchema.index({ slug: 1 }, { unique: true });
ageBandSchema.index({ isActive: 1, minMonths: 1 });

export type AgeBandDoc = InferSchemaType<typeof ageBandSchema>;

export const AgeBand: Model<AgeBandDoc> =
  (mongoose.models.AgeBand as Model<AgeBandDoc> | undefined) ??
  mongoose.model<AgeBandDoc>('AgeBand', ageBandSchema);
