import { fail, ok, type FieldIssue, type ValidationResult } from '@/lib/catalogue/types';

/**
 * Age-band sequence rules — docs/PROJECT_SPECIFICATION.md §3.3.
 *
 * Bands are **inclusive** month ranges. `minMonths` is inclusive, `maxMonths` is
 * inclusive, and the next band must start at the previous band's
 * `maxMonths + 1`. Bands must be contiguous and non-overlapping, so **every
 * month value belongs to exactly one band**.
 *
 * The worked example from the spec: `0–11 months` then `1–2 years` (12–35
 * months) is correct; `0–12 months` then `1–2 years` is not, because month 12
 * would fall in both.
 *
 * Only **active** bands take part. An inactive band is retired configuration and
 * must not create a phantom gap in the live sequence.
 */

export type AgeBandInput = {
  slug?: string;
  label?: string;
  minMonths?: number;
  maxMonths?: number;
  isActive?: boolean;
};

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

/** Validates one band in isolation: real, ordered, non-negative bounds. */
export function validateAgeBand(band: AgeBandInput, index = 0): FieldIssue[] {
  const at = (field: string) => `bands.${index}.${field}`;
  const issues: FieldIssue[] = [];

  if (!isFiniteInteger(band.minMonths) || band.minMonths < 0) {
    issues.push({ field: at('minMonths'), code: 'minMonthsInvalid' });
  }
  if (!isFiniteInteger(band.maxMonths) || band.maxMonths < 0) {
    issues.push({ field: at('maxMonths'), code: 'maxMonthsInvalid' });
  }

  if (
    isFiniteInteger(band.minMonths) &&
    isFiniteInteger(band.maxMonths) &&
    band.minMonths > band.maxMonths
  ) {
    issues.push({ field: at('maxMonths'), code: 'maxBeforeMin' });
  }

  return issues;
}

/**
 * Validates the whole active sequence.
 *
 * `requireContiguous` defaults to true because that is the documented
 * expectation for the live navigation set. It can be relaxed for a partially
 * configured draft set in the admin, where overlap is still an error but a gap
 * is merely work in progress.
 */
export function validateAgeBandSequence(
  bands: readonly AgeBandInput[],
  { requireContiguous = true }: { requireContiguous?: boolean } = {},
): ValidationResult {
  const issues: FieldIssue[] = [];

  bands.forEach((band, index) => {
    issues.push(...validateAgeBand(band, index));
  });

  // A malformed band makes sequence reasoning meaningless — report those first.
  if (issues.length > 0) return fail(issues);

  const active = bands
    .map((band, index) => ({ band, index }))
    .filter(({ band }) => band.isActive !== false)
    .sort((a, b) => (a.band.minMonths ?? 0) - (b.band.minMonths ?? 0));

  const slugs = new Set<string>();
  for (const { band, index } of active) {
    if (typeof band.slug === 'string' && band.slug !== '') {
      if (slugs.has(band.slug)) {
        issues.push({ field: `bands.${index}.slug`, code: 'slugDuplicate', detail: band.slug });
      }
      slugs.add(band.slug);
    }
  }

  for (let i = 1; i < active.length; i += 1) {
    const previous = active[i - 1]!;
    const current = active[i]!;
    const previousMax = previous.band.maxMonths!;
    const currentMin = current.band.minMonths!;

    if (currentMin <= previousMax) {
      issues.push({
        field: `bands.${current.index}.minMonths`,
        code: 'bandsOverlap',
        detail: `starts at ${currentMin}, but "${previous.band.label ?? previous.band.slug ?? 'previous band'}" already covers up to ${previousMax}`,
      });
      continue;
    }

    if (requireContiguous && currentMin !== previousMax + 1) {
      issues.push({
        field: `bands.${current.index}.minMonths`,
        code: 'bandsNotContiguous',
        detail: `months ${previousMax + 1}–${currentMin - 1} belong to no band`,
      });
    }
  }

  return issues.length > 0 ? fail(issues) : ok();
}

/** The single band a given age in months falls into, or `undefined`. */
export function bandForMonths<T extends AgeBandInput>(
  bands: readonly T[],
  months: number,
): T | undefined {
  return bands.find(
    (band) =>
      band.isActive !== false &&
      isFiniteInteger(band.minMonths) &&
      isFiniteInteger(band.maxMonths) &&
      months >= band.minMonths &&
      months <= band.maxMonths,
  );
}

/**
 * Every band a product's declared range touches.
 *
 * This is what "band membership is derived" means in practice (§3.3): the
 * product stores months, never a band reference, so re-banding never requires
 * re-tagging a single product.
 */
export function bandsForRange<T extends AgeBandInput>(
  bands: readonly T[],
  minMonths: number,
  maxMonths: number,
): T[] {
  if (minMonths > maxMonths) return [];

  return bands.filter(
    (band) =>
      band.isActive !== false &&
      isFiniteInteger(band.minMonths) &&
      isFiniteInteger(band.maxMonths) &&
      // Ranges intersect.
      band.minMonths <= maxMonths &&
      band.maxMonths >= minMonths,
  );
}
