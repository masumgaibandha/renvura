import { describe, expect, it } from 'vitest';
import { ORDER_NUMBER_PATTERN, generateOrderNumber, isWellFormedOrderNumber } from '@/lib/checkout/order-number';

describe('generateOrderNumber', () => {
  it('produces RV-YYMMDD-XXXXXX from the given date', () => {
    const date = new Date(2026, 7, 8); // 8 August 2026 (month is 0-indexed)
    const orderNumber = generateOrderNumber(date, () => 0);
    expect(orderNumber).toMatch(/^RV-260808-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  });

  it('never emits the digits/letters that are easy to misread — 0, O, 1, I, L', () => {
    // The suffix alphabet is a fixed 32-symbol string; walk every position in
    // it (not just what one generated suffix happens to sample) so the
    // guarantee holds regardless of which characters a given call draws.
    const alphabetMatch = ORDER_NUMBER_PATTERN.source.match(/\[([^\]]+)\]/);
    expect(alphabetMatch).not.toBeNull();
    const alphabet = alphabetMatch?.[1] ?? '';
    expect(alphabet).not.toMatch(/[01OIL]/);

    // And confirm a real generated suffix only ever draws from that alphabet.
    const orderNumber = generateOrderNumber(new Date(2026, 0, 1));
    const suffix = orderNumber.split('-')[2] ?? '';
    for (const char of suffix) expect(alphabet).toContain(char);
  });

  it('is well-formed per its own pattern', () => {
    const orderNumber = generateOrderNumber();
    expect(isWellFormedOrderNumber(orderNumber)).toBe(true);
    expect(ORDER_NUMBER_PATTERN.test(orderNumber)).toBe(true);
  });

  it('varies with the random source, so two calls do not collide in practice', () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber(new Date(2026, 0, 1))));
    // Real `Math.random()` across 50 draws from a ~1 billion-combination
    // suffix space should not collide even once.
    expect(numbers.size).toBe(50);
  });
});

describe('isWellFormedOrderNumber', () => {
  it.each([
    ['RV-260808-A2B3C4', true],
    ['rv-260808-a2b3c4', true], // case-insensitive on input, uppercased before matching
    ['RV-2608-A2B3C4', false], // date too short
    ['RV-260808-A2B3', false], // suffix too short
    ['RV-260808-A0B1C1', false], // contains banned characters 0/1
    ['', false],
    ['not an order number', false],
  ])('%s -> %s', (value, expected) => {
    expect(isWellFormedOrderNumber(value)).toBe(expected);
  });
});
