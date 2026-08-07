import { z } from 'zod';

/**
 * Validation messages are stable *codes*, not sentences, so the same schema
 * runs identically on the client and the server and the wording lives in one
 * place (`CONTACT_ERRORS` below).
 */

/** Bangladeshi mobile numbers: optional +88, then 01[3-9] and eight digits. */
export const BD_MOBILE_PATTERN = /^(?:\+?88)?01[3-9]\d{8}$/;

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(100, 'nameTooLong'),
  phone: z
    .string()
    .trim()
    .min(1, 'phoneRequired')
    .refine((value) => BD_MOBILE_PATTERN.test(value.replace(/[\s-]/g, '')), 'phoneInvalid'),
  email: z
    .union([z.literal(''), z.email('emailInvalid').max(254, 'emailInvalid')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  subject: z.string().trim().min(1, 'subjectRequired').max(150, 'subjectTooLong'),
  message: z
    .string()
    .trim()
    .min(1, 'messageRequired')
    .min(10, 'messageTooShort')
    .max(4000, 'messageTooLong'),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** Human wording for each validation code. English — the UI language (D-02). */
export const CONTACT_ERRORS: Record<string, string> = {
  nameRequired: 'Please enter your name',
  nameTooLong: 'That name is too long',
  phoneRequired: 'Please enter your phone number',
  phoneInvalid: 'Please enter a valid Bangladeshi mobile number',
  emailInvalid: 'Please enter a valid email address',
  subjectRequired: 'Please enter a subject',
  subjectTooLong: 'That subject is too long',
  messageRequired: 'Please enter a message',
  messageTooShort: 'Please write a little more so we can help',
  messageTooLong: 'That message is too long',
};

export function contactErrorMessage(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return CONTACT_ERRORS[code] ?? 'Please check this field';
}

/** Field name of the honeypot input. Hidden from users, tempting to bots. */
export const HONEYPOT_FIELD = 'website';

/** A human needs at least this long to fill the form in. */
export const MIN_FILL_MS = 3_000;
/** Beyond this the form is stale — most likely a replayed page. */
export const MAX_FORM_AGE_MS = 6 * 60 * 60 * 1000;

export type AntiSpamInput = {
  honeypot: string | undefined;
  startedAt: number | undefined;
  now: number;
};

export type AntiSpamResult = { ok: true } | { ok: false; reason: 'honeypot' | 'too-fast' | 'stale' };

/**
 * Honeypot plus timing check. Pure and unit-tested; deliberately silent about
 * which check failed in the response the client sees.
 */
export function checkAntiSpam({ honeypot, startedAt, now }: AntiSpamInput): AntiSpamResult {
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { ok: false, reason: 'honeypot' };
  }

  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) {
    return { ok: false, reason: 'stale' };
  }

  const elapsed = now - startedAt;
  if (elapsed < MIN_FILL_MS) return { ok: false, reason: 'too-fast' };
  if (elapsed > MAX_FORM_AGE_MS) return { ok: false, reason: 'stale' };

  return { ok: true };
}

/** Maps a Zod error onto `{ field: code }` for the client to translate. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
