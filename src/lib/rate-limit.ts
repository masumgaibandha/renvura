import { connectToDatabase } from '@/lib/db/mongoose';
import { RateLimitHit } from '@/lib/models/RateLimitHit';

export type RateLimitRule = {
  bucket: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** Contact form: 5 submissions per IP per 15 minutes. */
export const CONTACT_RATE_LIMIT: RateLimitRule = {
  bucket: 'contact',
  limit: 5,
  windowMs: 15 * 60 * 1000,
};

/** Start of the fixed window containing `now`. Pure, so it is unit-tested. */
export function windowStartFor(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

export function buildRateLimitKey(
  bucket: string,
  identifier: string,
  windowStart: number,
): string {
  return `${bucket}:${identifier}:${windowStart}`;
}

/**
 * Records one hit and reports whether it is within the limit.
 *
 * A single atomic upsert+increment does the work, so concurrent requests from
 * the same client cannot race past the limit.
 */
export async function consumeRateLimit(
  rule: RateLimitRule,
  identifier: string,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  await connectToDatabase();

  const windowStart = windowStartFor(now, rule.windowMs);
  const expiresAt = new Date(windowStart + rule.windowMs);
  const key = buildRateLimitKey(rule.bucket, identifier, windowStart);

  const doc = await RateLimitHit.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { windowStart: new Date(windowStart), expiresAt },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  const count = doc?.count ?? 1;
  const allowed = count <= rule.limit;

  return {
    allowed,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((windowStart + rule.windowMs - now) / 1000),
  };
}
