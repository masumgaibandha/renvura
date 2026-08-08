import { describe, expect, it } from 'vitest';
import { isValidBangladeshiMobile, normalizeBangladeshiMobile } from '@/lib/validation/phone';

describe('isValidBangladeshiMobile', () => {
  it.each([
    ['01712345678', true],
    ['01312345678', true],
    ['01912345678', true],
    ['+8801712345678', true],
    ['8801712345678', true],
    ['017 1234 5678', true],
    ['017-1234-5678', true],
    ['01212345678', false], // 012 is not an assigned operator prefix
    ['0171234567', false], // too short
    ['017123456789', false], // too long
    ['+8801212345678', false],
    ['not a phone', false],
    ['', false],
  ])('validates %s -> %s', (phone, expected) => {
    expect(isValidBangladeshiMobile(phone)).toBe(expected);
  });
});

describe('normalizeBangladeshiMobile', () => {
  it.each([
    ['01712345678', '01712345678'],
    ['+8801712345678', '01712345678'],
    ['8801712345678', '01712345678'],
    ['017-1234-5678', '01712345678'],
    ['017 1234 5678', '01712345678'],
  ])('normalises %s -> %s', (input, expected) => {
    expect(normalizeBangladeshiMobile(input)).toBe(expected);
  });

  it('returns undefined for anything invalid, never a best-effort guess', () => {
    expect(normalizeBangladeshiMobile('not a phone')).toBeUndefined();
    expect(normalizeBangladeshiMobile('01212345678')).toBeUndefined();
    expect(normalizeBangladeshiMobile('')).toBeUndefined();
  });

  it('always normalises to the eleven-digit 01XXXXXXXXX form', () => {
    const normalized = normalizeBangladeshiMobile('+8801987654321');
    expect(normalized).toHaveLength(11);
    expect(normalized).toMatch(/^01\d{9}$/);
  });
});
