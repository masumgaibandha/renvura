import { fail, ok, type FieldIssue, type ValidationResult } from '@/lib/catalogue/types';

/**
 * Bangladeshi taka pricing — the U-5 convention, settled here.
 *
 *   ৳1,250   prefix symbol · thousands separated · no decimals
 *
 * **Money is always integer minor units (poisha).** Nothing in this module
 * accepts or produces a float amount, so there is no path by which a rounding
 * error reaches a customer-facing price.
 *
 * TWO CUSTOMER-FACING PRICES, mapped onto the fields the model already has
 * (§7.1) rather than inventing parallel ones:
 *
 *   founder's "selling price"  →  `priceMinor`         the amount actually charged
 *   founder's "display price"  →  `comparePriceMinor`  the higher reference price
 *
 * The taka sign is a Latin-run character inside Bangla text, so wherever a
 * formatted price appears in a `lang="bn"` block it belongs in a `.latin`
 * span (§4.4).
 */

/** `2990` (taka) → `299000` (poisha). Rejects anything that is not whole taka. */
export function takaToMinorUnits(taka: number): number {
  if (!Number.isInteger(taka) || taka < 0) {
    throw new RangeError(`Price must be a whole, non-negative number of taka: received ${taka}`);
  }
  return taka * 100;
}

/** `249000` → `৳2,490`. Rounds to whole taka; poisha are never displayed. */
export function formatTaka(minorUnits: number): string {
  if (!Number.isFinite(minorUnits)) return '';
  const taka = Math.round(minorUnits / 100);
  return `৳${taka.toLocaleString('en-BD')}`;
}

/**
 * Formats a price only when one genuinely exists.
 *
 * Returns `undefined` rather than `৳0` for a missing or non-positive amount, so
 * a caller cannot render a free product where the founder simply has not
 * supplied a price (D-12).
 */
export function formatTakaOrUndefined(minorUnits: number | null | undefined): string | undefined {
  if (typeof minorUnits !== 'number' || !Number.isFinite(minorUnits) || minorUnits <= 0) {
    return undefined;
  }
  return formatTaka(minorUnits);
}

export type PricingInput = {
  /** What the customer actually pays. */
  priceMinor?: number | null;
  /** The higher reference price shown struck through. Optional. */
  comparePriceMinor?: number | null;
};

/**
 * Validates a price pair.
 *
 * Enforced here so the seed, the publish gate and any future admin form share
 * one definition instead of three drifting ones.
 */
export function validatePricing(input: PricingInput): ValidationResult {
  const issues: FieldIssue[] = [];
  const { priceMinor, comparePriceMinor } = input;

  if (typeof priceMinor !== 'number' || !Number.isFinite(priceMinor)) {
    issues.push({ field: 'priceMinor', code: 'priceRequired' });
  } else if (!Number.isInteger(priceMinor)) {
    issues.push({ field: 'priceMinor', code: 'priceNotMinorUnits' });
  } else if (priceMinor <= 0) {
    issues.push({ field: 'priceMinor', code: 'priceMustBePositive' });
  }

  if (comparePriceMinor !== undefined && comparePriceMinor !== null) {
    if (!Number.isInteger(comparePriceMinor)) {
      issues.push({ field: 'comparePriceMinor', code: 'priceNotMinorUnits' });
    } else if (comparePriceMinor <= 0) {
      issues.push({ field: 'comparePriceMinor', code: 'comparePriceMustBePositive' });
    } else if (typeof priceMinor === 'number' && comparePriceMinor < priceMinor) {
      // A "was" price below the "now" price is not a discount, it is a data
      // error — and shown to a customer it is a misleading claim (D-12).
      issues.push({ field: 'comparePriceMinor', code: 'comparePriceBelowPrice' });
    }
  }

  return issues.length > 0 ? fail(issues) : ok();
}

/**
 * The saving implied by the two prices.
 *
 * Deliberately **computed but not rendered**. Whether Renvura advertises a
 * percentage or an amount is a merchandising decision the founder has not
 * taken, and a discount badge invented by the code would be exactly the kind of
 * promotional claim D-12 rules out. This exists so that decision costs a line
 * of JSX rather than a data migration.
 */
export function savingsMinor(input: PricingInput): number | undefined {
  const { priceMinor, comparePriceMinor } = input;
  if (typeof priceMinor !== 'number' || typeof comparePriceMinor !== 'number') return undefined;
  if (comparePriceMinor <= priceMinor) return undefined;
  return comparePriceMinor - priceMinor;
}

/** Whole-percent saving, rounded down so it can never overstate. */
export function savingsPercent(input: PricingInput): number | undefined {
  const saving = savingsMinor(input);
  if (saving === undefined || typeof input.comparePriceMinor !== 'number') return undefined;
  return Math.floor((saving / input.comparePriceMinor) * 100);
}
