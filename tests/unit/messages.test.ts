import { describe, expect, it } from 'vitest';
import bn from '../../messages/bn.json';
import en from '../../messages/en.json';
import { navRoutes, policyRoutes } from '@/lib/site';

type Json = Record<string, unknown>;

function flatten(value: Json, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    // `_meta` documents the translation review status; it is not a UI string.
    if (key.startsWith('_')) return [];
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? flatten(child as Json, path)
      : [path];
  });
}

const enKeys = flatten(en as Json).sort();
const bnKeys = flatten(bn as Json).sort();

describe('message catalogues', () => {
  it('define exactly the same keys in both locales', () => {
    expect(bnKeys).toEqual(enKeys);
  });

  it('leave no string empty', () => {
    for (const catalogue of [en, bn]) {
      for (const key of flatten(catalogue as Json)) {
        const value = key
          .split('.')
          .reduce<unknown>((node, part) => (node as Json)[part], catalogue);
        expect(typeof value, key).toBe('string');
        expect((value as string).trim().length, key).toBeGreaterThan(0);
      }
    }
  });

  it('cover every navigation label', () => {
    for (const route of navRoutes) {
      expect(enKeys).toContain(`nav.${route.navKey}`);
      expect(bnKeys).toContain(`nav.${route.navKey}`);
    }
  });

  it('cover every policy title and summary', () => {
    for (const policy of policyRoutes) {
      expect(enKeys).toContain(`policies.${policy.key}.title`);
      expect(enKeys).toContain(`policies.${policy.key}.summary`);
      expect(bnKeys).toContain(`policies.${policy.key}.title`);
    }
  });

  it('flags the Bangla catalogue as awaiting founder review', () => {
    // Guards against the first-pass translation being mistaken for approved copy.
    expect((bn as Json)._meta).toBeDefined();
  });
});
