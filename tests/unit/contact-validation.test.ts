import { describe, expect, it } from 'vitest';
import {
  MAX_FORM_AGE_MS,
  MIN_FILL_MS,
  checkAntiSpam,
  contactFormSchema,
  fieldErrorsFrom,
} from '@/lib/validation/contact';

const valid = {
  name: 'Abdullah Al Masum',
  phone: '01883115898',
  email: 'parent@example.com',
  subject: 'Question about age ranges',
  message: 'Which materials suit a three year old who is just starting to speak?',
  locale: 'bn' as const,
};

describe('contactFormSchema', () => {
  it('accepts a complete, valid submission', () => {
    const result = contactFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('treats email as optional and normalises an empty string to undefined', () => {
    const result = contactFormSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeUndefined();
  });

  it.each([
    ['01883115898', true],
    ['+8801883115898', true],
    ['8801712345678', true],
    ['01883-115898', true],
    ['01183115898', false],
    ['0188311589', false],
    ['018831158987', false],
    ['not a phone', false],
  ])('validates BD mobile %s -> %s', (phone, expected) => {
    expect(contactFormSchema.safeParse({ ...valid, phone }).success).toBe(expected);
  });

  it('reports stable error codes rather than sentences', () => {
    const result = contactFormSchema.safeParse({
      ...valid,
      name: '',
      phone: '',
      subject: '',
      message: 'short',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = fieldErrorsFrom(result.error);
    expect(errors).toMatchObject({
      name: 'nameRequired',
      phone: 'phoneRequired',
      subject: 'subjectRequired',
      message: 'messageTooShort',
    });
  });

  it('rejects an unknown locale', () => {
    expect(contactFormSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(false);
  });

  it('rejects over-long fields', () => {
    expect(contactFormSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false);
    expect(contactFormSchema.safeParse({ ...valid, message: 'a'.repeat(4001) }).success).toBe(
      false,
    );
  });
});

describe('checkAntiSpam', () => {
  const now = 1_000_000_000_000;
  const humanStart = now - (MIN_FILL_MS + 5_000);

  it('accepts a form filled in at human speed', () => {
    expect(checkAntiSpam({ honeypot: '', startedAt: humanStart, now })).toEqual({ ok: true });
  });

  it('rejects a filled honeypot', () => {
    expect(checkAntiSpam({ honeypot: 'https://spam.example', startedAt: humanStart, now })).toEqual({
      ok: false,
      reason: 'honeypot',
    });
  });

  it('rejects a form submitted faster than a person could type', () => {
    expect(checkAntiSpam({ honeypot: '', startedAt: now - 100, now })).toEqual({
      ok: false,
      reason: 'too-fast',
    });
  });

  it('rejects a stale form', () => {
    expect(
      checkAntiSpam({ honeypot: '', startedAt: now - (MAX_FORM_AGE_MS + 1), now }),
    ).toEqual({ ok: false, reason: 'stale' });
  });

  it('rejects a missing timestamp', () => {
    expect(checkAntiSpam({ honeypot: '', startedAt: undefined, now })).toEqual({
      ok: false,
      reason: 'stale',
    });
  });
});
