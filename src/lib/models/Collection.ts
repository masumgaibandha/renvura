import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Collection — docs/PROJECT_SPECIFICATION.md §7.6.
 *
 * Curated product groups, bundles and themed gift sets: where the founder's
 * curation shows (design direction §6.1). Kept deliberately simple for the
 * launch scope.
 *
 * Membership is either **manual** (`products[]`, the launch path) or **rule
 * based** (`rules`, evaluated at query time). `rules` is present so a seasonal
 * or automatic collection does not need a migration later; nothing evaluates it
 * in Phase 2A, and a collection with neither is simply empty rather than broken.
 */
const collectionRulesSchema = new Schema(
  {
    categories: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: undefined },
    ageBands: { type: [{ type: Schema.Types.ObjectId, ref: 'AgeBand' }], default: undefined },
    tags: { type: [String], default: undefined },
    /** Minor units (poisha), matching Product. */
    minPriceMinor: { type: Number, min: 0 },
    maxPriceMinor: { type: Number, min: 0 },
  },
  { _id: false },
);

const collectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 8000 },
    descriptionBn: { type: String, trim: true, maxlength: 8000 },
    heroImage: {
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
    products: { type: [{ type: Schema.Types.ObjectId, ref: 'Product' }], default: undefined },
    rules: { type: collectionRulesSchema },
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
  { timestamps: true, collection: 'collections' },
);

collectionSchema.index({ slug: 1 }, { unique: true });
collectionSchema.index({ isActive: 1, sortOrder: 1 });

export type CollectionDoc = InferSchemaType<typeof collectionSchema>;

export const Collection: Model<CollectionDoc> =
  (mongoose.models.Collection as Model<CollectionDoc> | undefined) ??
  mongoose.model<CollectionDoc>('Collection', collectionSchema);
