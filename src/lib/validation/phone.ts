/**
 * Bangladeshi mobile number validation and normalisation.
 *
 * One definition shared by the contact form and checkout, so "what counts as a
 * valid Bangladeshi mobile number" cannot drift between the two. Accepts the
 * common ways a customer actually types a number — with or without `+88`/`88`,
 * with spaces or hyphens — and normalises everything to one canonical form
 * suitable for SMS and courier integration later (§4, U-8).
 */

/** Bangladeshi mobile numbers: optional +88/88, then 01[3-9] and eight digits. */
export const BD_MOBILE_PATTERN = /^(?:\+?88)?01[3-9]\d{8}$/;

/** Strips spaces and hyphens a customer might type between digits. */
function stripFormatting(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export function isValidBangladeshiMobile(value: string): boolean {
  return BD_MOBILE_PATTERN.test(stripFormatting(value.trim()));
}

/**
 * Normalises a valid Bangladeshi mobile number to `01XXXXXXXXX` — the local
 * eleven-digit form couriers and local SMS gateways expect.
 *
 * Returns `undefined` for anything that does not validate, so a caller never
 * accidentally stores or acts on a malformed number.
 */
export function normalizeBangladeshiMobile(value: string): string | undefined {
  const stripped = stripFormatting(value.trim());
  if (!BD_MOBILE_PATTERN.test(stripped)) return undefined;
  return stripped.replace(/^(?:\+?88)/, '');
}
