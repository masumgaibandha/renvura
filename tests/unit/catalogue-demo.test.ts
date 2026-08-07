import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertDemoModeAllowed,
  assertNoActiveDemoData,
  DemoDataError,
  demoModeEnabled,
  demoVisibilityFilter,
  isProductIndexable,
  mayEmitProductSchema,
} from '@/lib/catalogue/demo';

/**
 * D-08 / §3.5 / §12.1. "Demo data reaching production" is rated the
 * highest-impact catalogue risk — fake products shown as real destroys trust.
 *
 * The decision is explicit that `isDemo` is a label, not a safety mechanism, so
 * these tests exercise the *guard*, not the flag.
 */

/** `isProductionSite()` = NODE_ENV production AND not a Vercel preview. */
function setEnv({ production, demo }: { production: boolean; demo: boolean }) {
  vi.stubEnv('NODE_ENV', production ? 'production' : 'development');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('DEMO_MODE', demo ? '1' : '');
}

beforeEach(() => setEnv({ production: false, demo: false }));
afterEach(() => vi.unstubAllEnvs());

describe('demo mode', () => {
  it('is off unless explicitly enabled', () => {
    expect(demoModeEnabled()).toBe(false);
  });

  it('can be enabled in development', () => {
    setEnv({ production: false, demo: true });
    expect(demoModeEnabled()).toBe(true);
  });

  it('is impossible on the production site even when the flag is set', () => {
    setEnv({ production: true, demo: true });
    expect(demoModeEnabled()).toBe(false);
  });

  it('is available on a protected Vercel preview', () => {
    // D-08 permits protected preview environments; §11.1.1 and D-08 both treat
    // a non-publicly-reachable preview as a sanctioned location.
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('DEMO_MODE', '1');
    expect(demoModeEnabled()).toBe(true);
  });
});

describe('the production runtime guard', () => {
  it('throws loudly rather than silently disabling demo mode', () => {
    setEnv({ production: true, demo: true });

    // Silently falling back to "demo off" would let a misconfigured production
    // deployment quietly serve fake products.
    expect(() => assertDemoModeAllowed()).toThrow(DemoDataError);
    expect(() => assertDemoModeAllowed()).toThrow(/never reach production/i);
  });

  it('stays quiet in development', () => {
    setEnv({ production: false, demo: true });
    expect(() => assertDemoModeAllowed()).not.toThrow();
  });

  it('rejects active demo documents found in production', () => {
    setEnv({ production: true, demo: false });

    // Catches data that arrived without the flag — a restored dump, or a
    // mis-pointed MONGODB_URI.
    expect(() => assertNoActiveDemoData(3)).toThrow(DemoDataError);
    expect(() => assertNoActiveDemoData(3)).toThrow(/3 active demo product/);
  });

  it('accepts a clean production database', () => {
    setEnv({ production: true, demo: false });
    expect(() => assertNoActiveDemoData(0)).not.toThrow();
  });

  it('allows demo documents outside production', () => {
    setEnv({ production: false, demo: true });
    expect(() => assertNoActiveDemoData(12)).not.toThrow();
  });
});

describe('query visibility', () => {
  it('excludes demo records when demo mode is off', () => {
    expect(demoVisibilityFilter()).toEqual({ isDemo: { $ne: true } });
  });

  it('treats a document with no isDemo field as real, not missing', () => {
    // `$ne: true` rather than `isDemo: false`, so a legacy document written
    // before the field existed still appears.
    expect(demoVisibilityFilter()).toEqual({ isDemo: { $ne: true } });
  });

  it('imposes no filter when demo mode is on', () => {
    setEnv({ production: false, demo: true });
    expect(demoVisibilityFilter()).toEqual({});
  });
});

describe('indexing', () => {
  it('never indexes a demo product', () => {
    expect(isProductIndexable({ status: 'active', isDemo: true })).toBe(false);
  });

  it('never indexes a draft or an archived product', () => {
    expect(isProductIndexable({ status: 'draft' })).toBe(false);
    expect(isProductIndexable({ status: 'archived' })).toBe(false);
  });

  it('indexes a real active product', () => {
    expect(isProductIndexable({ status: 'active', isDemo: false })).toBe(true);
  });
});

describe('Product / Offer structured data', () => {
  it('is never emitted for a demo product, in any environment', () => {
    // Stricter than indexability by design: D-08 says "in any environment",
    // including local development.
    setEnv({ production: false, demo: true });
    expect(mayEmitProductSchema({ status: 'active', isDemo: true, priceMinor: 5000 })).toBe(false);
  });

  it('is never emitted for a draft or archived product', () => {
    expect(mayEmitProductSchema({ status: 'draft', priceMinor: 5000 })).toBe(false);
    expect(mayEmitProductSchema({ status: 'archived', priceMinor: 5000 })).toBe(false);
  });

  it('requires a real price — there is no priceless Offer', () => {
    expect(mayEmitProductSchema({ status: 'active', priceMinor: 0 })).toBe(false);
    expect(mayEmitProductSchema({ status: 'active' })).toBe(false);
  });

  it('is emitted for a real, published, priced product', () => {
    expect(mayEmitProductSchema({ status: 'active', isDemo: false, priceMinor: 89000 })).toBe(true);
  });
});
