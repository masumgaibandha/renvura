import { describe, expect, it } from 'vitest';
import { CONTACT_RATE_LIMIT, buildRateLimitKey, windowStartFor } from '@/lib/rate-limit';

describe('fixed-window rate limiting', () => {
  const windowMs = 15 * 60 * 1000;

  it('anchors a window to its start', () => {
    expect(windowStartFor(windowMs * 3, windowMs)).toBe(windowMs * 3);
    expect(windowStartFor(windowMs * 3 + 1, windowMs)).toBe(windowMs * 3);
    expect(windowStartFor(windowMs * 4 - 1, windowMs)).toBe(windowMs * 3);
  });

  it('moves to the next window at the boundary', () => {
    expect(windowStartFor(windowMs * 4, windowMs)).toBe(windowMs * 4);
  });

  it('keys requests per bucket, client and window', () => {
    expect(buildRateLimitKey('contact', '203.0.113.9', 900_000)).toBe(
      'contact:203.0.113.9:900000',
    );
  });

  it('gives different clients independent keys in the same window', () => {
    const start = windowStartFor(Date.now(), windowMs);
    expect(buildRateLimitKey('contact', 'a', start)).not.toBe(
      buildRateLimitKey('contact', 'b', start),
    );
  });

  it('configures the contact form limit', () => {
    expect(CONTACT_RATE_LIMIT).toMatchObject({ bucket: 'contact', limit: 5, windowMs });
  });
});
