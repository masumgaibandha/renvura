import { describe, expect, it } from 'vitest';
import {
  bandForMonths,
  bandsForRange,
  validateAgeBandSequence,
  type AgeBandInput,
} from '@/lib/catalogue/age-bands';

/**
 * §3.3: bands are inclusive month ranges, contiguous and non-overlapping, so
 * every month value belongs to exactly one band.
 *
 * The candidate set below is the one §3.3 offers for the founder to confirm in
 * Phase 2B (U-1). It is used here as test data only — nothing in `src/` ships
 * it, because Phase 1/2A must not hardcode an invented production set.
 */
const candidateSet: AgeBandInput[] = [
  { slug: '0-11-months', label: '0–11 months', minMonths: 0, maxMonths: 11 },
  { slug: '1-2-years', label: '1–2 years', minMonths: 12, maxMonths: 35 },
  { slug: '3-5-years', label: '3–5 years', minMonths: 36, maxMonths: 71 },
  { slug: '6-8-years', label: '6–8 years', minMonths: 72, maxMonths: 107 },
  { slug: '9-12-years', label: '9–12 years', minMonths: 108, maxMonths: 155 },
];

const codesOf = (result: ReturnType<typeof validateAgeBandSequence>) =>
  result.ok ? [] : result.issues.map((issue) => issue.code);

describe('a valid contiguous sequence', () => {
  it('accepts the spec candidate set', () => {
    expect(validateAgeBandSequence(candidateSet)).toEqual({ ok: true });
  });

  it('accepts a single band', () => {
    expect(validateAgeBandSequence([candidateSet[0]!]).ok).toBe(true);
  });

  it('accepts an empty set — Phase 1 renders against no bands at all', () => {
    expect(validateAgeBandSequence([]).ok).toBe(true);
  });

  it('does not depend on input order', () => {
    expect(validateAgeBandSequence([...candidateSet].reverse()).ok).toBe(true);
  });
});

describe('overlap', () => {
  it('rejects the exact mistake the spec calls out', () => {
    // "0–12 months then 1–2 years is not [correct], because month 12 would fall
    // in both."
    const result = validateAgeBandSequence([
      { slug: 'a', label: '0–12 months', minMonths: 0, maxMonths: 12 },
      { slug: 'b', label: '1–2 years', minMonths: 12, maxMonths: 35 },
    ]);

    expect(result.ok).toBe(false);
    expect(codesOf(result)).toContain('bandsOverlap');
  });

  it('rejects a fully contained band', () => {
    const result = validateAgeBandSequence([
      { slug: 'a', minMonths: 0, maxMonths: 35 },
      { slug: 'b', minMonths: 12, maxMonths: 23 },
    ]);
    expect(codesOf(result)).toContain('bandsOverlap');
  });

  it('explains which band already covers the range', () => {
    const result = validateAgeBandSequence([
      { slug: 'a', label: 'Babies', minMonths: 0, maxMonths: 12 },
      { slug: 'b', label: 'Toddlers', minMonths: 12, maxMonths: 35 },
    ]);
    if (result.ok) throw new Error('expected failure');
    expect(result.issues[0]?.detail).toContain('Babies');
  });
});

describe('gaps', () => {
  it('rejects a gap in the live sequence', () => {
    const result = validateAgeBandSequence([
      { slug: 'a', minMonths: 0, maxMonths: 11 },
      { slug: 'b', minMonths: 24, maxMonths: 35 },
    ]);

    expect(codesOf(result)).toContain('bandsNotContiguous');
  });

  it('names the months that belong to no band', () => {
    const result = validateAgeBandSequence([
      { slug: 'a', minMonths: 0, maxMonths: 11 },
      { slug: 'b', minMonths: 24, maxMonths: 35 },
    ]);
    if (result.ok) throw new Error('expected failure');
    expect(result.issues[0]?.detail).toContain('12');
    expect(result.issues[0]?.detail).toContain('23');
  });

  it('tolerates a gap while a draft set is still being built', () => {
    const result = validateAgeBandSequence(
      [
        { slug: 'a', minMonths: 0, maxMonths: 11 },
        { slug: 'b', minMonths: 24, maxMonths: 35 },
      ],
      { requireContiguous: false },
    );
    expect(result.ok).toBe(true);
  });

  it('still rejects overlap even when contiguity is relaxed', () => {
    const result = validateAgeBandSequence(
      [
        { slug: 'a', minMonths: 0, maxMonths: 12 },
        { slug: 'b', minMonths: 12, maxMonths: 35 },
      ],
      { requireContiguous: false },
    );
    expect(codesOf(result)).toContain('bandsOverlap');
  });
});

describe('inactive bands', () => {
  it('are excluded, so a retired band creates no phantom gap', () => {
    const result = validateAgeBandSequence([
      { slug: 'a', minMonths: 0, maxMonths: 11 },
      { slug: 'retired', minMonths: 12, maxMonths: 23, isActive: false },
      { slug: 'b', minMonths: 12, maxMonths: 35 },
    ]);

    expect(result.ok).toBe(true);
  });
});

describe('malformed bands', () => {
  it('rejects a maximum below the minimum', () => {
    expect(codesOf(validateAgeBandSequence([{ slug: 'a', minMonths: 24, maxMonths: 12 }]))).toContain(
      'maxBeforeMin',
    );
  });

  it('rejects negative and non-integer months', () => {
    expect(codesOf(validateAgeBandSequence([{ slug: 'a', minMonths: -1, maxMonths: 12 }]))).toContain(
      'minMonthsInvalid',
    );
    expect(codesOf(validateAgeBandSequence([{ slug: 'a', minMonths: 0, maxMonths: 1.5 }]))).toContain(
      'maxMonthsInvalid',
    );
  });

  it('rejects duplicate slugs', () => {
    const result = validateAgeBandSequence([
      { slug: 'same', minMonths: 0, maxMonths: 11 },
      { slug: 'same', minMonths: 12, maxMonths: 23 },
    ]);
    expect(codesOf(result)).toContain('slugDuplicate');
  });
});

describe('derived membership', () => {
  it('places a month in exactly one band', () => {
    expect(bandForMonths(candidateSet, 11)?.slug).toBe('0-11-months');
    expect(bandForMonths(candidateSet, 12)?.slug).toBe('1-2-years');
  });

  it('returns nothing for an age outside every band', () => {
    expect(bandForMonths(candidateSet, 999)).toBeUndefined();
  });

  it('finds every band a product range touches', () => {
    // A product for 10–40 months spans three bands; re-banding later never
    // requires re-tagging the product (§3.3).
    const slugs = bandsForRange(candidateSet, 10, 40).map((band) => band.slug);
    expect(slugs).toEqual(['0-11-months', '1-2-years', '3-5-years']);
  });

  it('returns nothing for an inverted range', () => {
    expect(bandsForRange(candidateSet, 40, 10)).toEqual([]);
  });
});
