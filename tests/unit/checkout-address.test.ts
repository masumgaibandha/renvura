import { describe, expect, it } from 'vitest';
import {
  DISTRICTS,
  DIVISIONS,
  DIVISION_NAMES,
  UPAZILAS,
  districtsForDivision,
  isValidLocationHierarchy,
  upazilasForDistrict,
} from '@/lib/checkout/address';

/**
 * §5, §6. The canonical Bangladesh location dataset and the hierarchy rules
 * every checkout surface (full checkout, Express COD) and the server both
 * depend on. `tests/unit/checkout-validation.test.ts` covers the Zod-level
 * wiring; this file covers the data itself.
 */

describe('the dataset', () => {
  it('covers all 8 divisions', () => {
    expect(DIVISIONS).toHaveLength(8);
    expect(DIVISION_NAMES).toEqual([
      'Chattogram',
      'Rajshahi',
      'Khulna',
      'Barishal',
      'Sylhet',
      'Dhaka',
      'Rangpur',
      'Mymensingh',
    ]);
  });

  it('covers all 64 districts', () => {
    expect(DISTRICTS).toHaveLength(64);
  });

  it('covers every district under a real division', () => {
    const divisionSlugs = new Set(DIVISIONS.map((division) => division.slug));
    for (const district of DISTRICTS) {
      expect(divisionSlugs.has(district.divisionSlug), `${district.name} has an unknown division`).toBe(true);
    }
  });

  it('covers every upazila under a real district', () => {
    const districtSlugs = new Set(DISTRICTS.map((district) => district.slug));
    for (const upazila of UPAZILAS) {
      expect(districtSlugs.has(upazila.districtSlug), `${upazila.name} has an unknown district`).toBe(true);
    }
  });

  it('covers a substantial, complete-looking set of upazilas', () => {
    // Real Bangladesh has ~495 upazilas; this pins "the dataset was not
    // truncated or half-copied" without hard-coding a brittle exact count.
    expect(UPAZILAS.length).toBeGreaterThan(480);
  });

  it('gives every division, district and upazila a unique slug within its own type', () => {
    for (const [label, entries] of [
      ['division', DIVISIONS],
      ['district', DISTRICTS],
      ['upazila', UPAZILAS],
    ] as const) {
      const slugs = entries.map((entry) => entry.slug);
      expect(new Set(slugs).size, `${label} slugs are not all unique`).toBe(slugs.length);
    }
  });

  it('keeps every district name globally unique', () => {
    const names = DISTRICTS.map((district) => district.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses current official English spellings for the districts that were renamed', () => {
    const names = DISTRICTS.map((d) => d.name);
    expect(names).toContain('Cumilla');
    expect(names).toContain("Cox's Bazar");
    expect(names).toContain('Barishal');
    expect(names).not.toContain('Comilla');
    expect(names).not.toContain('Coxsbazar');
  });
});

describe('districtsForDivision', () => {
  it('returns exactly the Rangpur division districts, matching the known set', () => {
    const names = districtsForDivision('Rangpur')
      .map((d) => d.name)
      .sort();
    expect(names).toEqual(
      ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'].sort(),
    );
  });

  it('returns nothing for an unknown division', () => {
    expect(districtsForDivision('Atlantis')).toEqual([]);
  });

  it('never returns a district belonging to a different division', () => {
    const rangpurDistricts = districtsForDivision('Rangpur').map((d) => d.name);
    expect(rangpurDistricts).not.toContain('Dhaka');
  });
});

describe('upazilasForDistrict', () => {
  it("returns exactly Gaibandha district's upazilas, matching the known set", () => {
    const names = upazilasForDistrict('Gaibandha')
      .map((u) => u.name)
      .sort();
    expect(names).toEqual(
      ['Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Sundarganj', 'Saghata', 'Phulchari'].sort(),
    );
  });

  it('returns nothing for an unknown district', () => {
    expect(upazilasForDistrict('Not A Real District')).toEqual([]);
  });

  it('scopes correctly even for a name that recurs across districts (e.g. Kaliganj)', () => {
    // "Kaliganj" is an upazila name shared by four different districts — the
    // lookup must return each district's own Kaliganj, not conflate them.
    const withKaliganj = DISTRICTS.filter((district) =>
      upazilasForDistrict(district.name).some((u) => u.name === 'Kaliganj'),
    );
    expect(withKaliganj.length).toBeGreaterThan(1);

    for (const district of withKaliganj) {
      const upazilas = upazilasForDistrict(district.name);
      expect(upazilas.filter((u) => u.name === 'Kaliganj')).toHaveLength(1);
    }
  });
});

describe('isValidLocationHierarchy', () => {
  it('accepts a real, correctly nested triple', () => {
    expect(isValidLocationHierarchy('Rangpur', 'Gaibandha', 'Sundarganj')).toBe(true);
    expect(isValidLocationHierarchy('Dhaka', 'Dhaka', 'Savar')).toBe(true);
  });

  it('rejects a real district paired with the wrong division', () => {
    // The task's own example: Division Rangpur, District Dhaka.
    expect(isValidLocationHierarchy('Rangpur', 'Dhaka', 'Savar')).toBe(false);
  });

  it('rejects a real upazila paired with the wrong district', () => {
    // The task's own example: District Gaibandha, Upazila Savar.
    expect(isValidLocationHierarchy('Rangpur', 'Gaibandha', 'Savar')).toBe(false);
  });

  it('rejects an unknown division, district or upazila outright', () => {
    expect(isValidLocationHierarchy('Atlantis', 'Gaibandha', 'Sundarganj')).toBe(false);
    expect(isValidLocationHierarchy('Rangpur', 'Not A District', 'Sundarganj')).toBe(false);
    expect(isValidLocationHierarchy('Rangpur', 'Gaibandha', 'Not An Upazila')).toBe(false);
  });

  it('is case-sensitive and exact — no partial or fuzzy match', () => {
    expect(isValidLocationHierarchy('rangpur', 'Gaibandha', 'Sundarganj')).toBe(false);
    expect(isValidLocationHierarchy('Rangpur', 'gaibandha', 'Sundarganj')).toBe(false);
  });
});
