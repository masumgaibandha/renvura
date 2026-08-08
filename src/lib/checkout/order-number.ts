/**
 * Customer-facing order references — §13. Never the raw MongoDB `_id`.
 *
 * `RV-YYMMDD-XXXXXX`: a date a customer or the founder can read at a glance,
 * plus six characters from a 32-symbol alphabet (`36^6`-scale, ~1.07 billion
 * combinations) that excludes the digits/letters people misread on a phone —
 * `0/O`, `1/I/L`. The suffix is also what keeps an order reference from being
 * sequentially guessable (§22 "no enumerating orders"): `/order/confirm/[ref]`
 * treats a correct order number as proof enough to view that one order, the
 * same way a checkout session link would.
 *
 * Collisions are handled by the order service retrying generation on a unique
 * index violation, not by this function — it stays pure and unit-testable.
 */

const ORDER_NUMBER_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const SUFFIX_LENGTH = 6;

export function generateOrderNumber(date: Date = new Date(), randomFn: () => number = Math.random): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  let suffix = '';
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) {
    suffix += ORDER_NUMBER_ALPHABET[Math.floor(randomFn() * ORDER_NUMBER_ALPHABET.length)];
  }

  return `RV-${yy}${mm}${dd}-${suffix}`;
}

/** What a well-formed order number looks like — used to reject junk before a database lookup. */
export const ORDER_NUMBER_PATTERN = /^RV-\d{6}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export function isWellFormedOrderNumber(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value.trim().toUpperCase());
}
