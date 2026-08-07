/**
 * Bangladeshi taka formatting — the U-5 convention, settled here.
 *
 *   ৳1,250   prefix symbol · thousands separated · no decimals
 *
 * Prices are stored as integer minor units (poisha) and only ever become a
 * display string at the edge. `ProductCard` already formats this way; this is
 * the shared implementation the Phase 2C surfaces use so the convention is
 * defined once.
 *
 * The taka sign is a Latin-run character in Bangla text, so anywhere this
 * appears inside a `lang="bn"` block it belongs in a `.latin` span (§4.4).
 */

/** `89000` → `৳890`. Rounds to the nearest taka; poisha are never displayed. */
export function formatTaka(minorUnits: number): string {
  if (!Number.isFinite(minorUnits)) return '';
  const taka = Math.round(minorUnits / 100);
  return `৳${taka.toLocaleString('en-BD')}`;
}

/**
 * Formats a price only when one genuinely exists.
 *
 * Returns `undefined` rather than `৳0` for a missing price, so a caller cannot
 * accidentally render a free product where the founder simply has not supplied
 * a price yet (D-12). None of the Phase 2B demo products carries one.
 */
export function formatTakaOrUndefined(minorUnits: number | null | undefined): string | undefined {
  if (typeof minorUnits !== 'number' || !Number.isFinite(minorUnits) || minorUnits <= 0) {
    return undefined;
  }
  return formatTaka(minorUnits);
}
