import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Persistent fixed-window rate limiting.
 *
 * Deliberately stored in MongoDB rather than in process memory: every serverless
 * instance sees the same counter, and an in-memory limiter would reset on each
 * cold start — which is no limiter at all in production.
 *
 * Expired windows are removed by a TTL index on `expiresAt`.
 */
const rateLimitHitSchema = new Schema(
  {
    /** `${bucket}:${identifier}:${windowStart}` */
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    windowStart: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'rate_limit_hits', versionKey: false },
);

rateLimitHitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitHitDoc = InferSchemaType<typeof rateLimitHitSchema>;

export const RateLimitHit: Model<RateLimitHitDoc> =
  (mongoose.models.RateLimitHit as Model<RateLimitHitDoc> | undefined) ??
  mongoose.model<RateLimitHitDoc>('RateLimitHit', rateLimitHitSchema);
