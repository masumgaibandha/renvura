/**
 * Delivery charge — founder decision, docs/PROJECT_SPECIFICATION.md §7, U-6
 * (now settled).
 *
 * Two flat, nationwide rates — the whole rule:
 *
 *   Dhaka City                      ৳80
 *   Everywhere else in Bangladesh   ৳150
 *
 * No third "Dhaka suburban" tier, no per-district table — a flat split earns
 * exactly the complexity it needs and no more (§30).
 *
 * **Defining "Dhaka City" — read before changing this.** It is deliberately
 * **not** `division === "Dhaka"`: Dhaka division also contains Gazipur,
 * Narayanganj, Manikganj, Tangail and eight more districts that are not
 * Dhaka city, and charging every one of them the in-city rate would
 * undercharge real courier cost on every one of those deliveries. It is also
 * deliberately not "district === Dhaka", for a subtler reason — the
 * *district* named "Dhaka" is the wider Dhaka district, whose own five
 * upazilas (Savar, Dhamrai, Keraniganj, Nawabganj, Dohar) are its outlying,
 * semi-rural areas, not the city.
 *
 * The actual classification is the single **`(district: "Dhaka", upazila:
 * "Dhaka City")`** pair — `"Dhaka City"` being the one deliberately-added
 * entry documented in `@/lib/checkout/address` (the upazila-level source
 * dataset has no entry for the city corporation area at all, since it is
 * administered through thanas, a finer level the dataset does not cover).
 * This is the safest classification available without a thana-level
 * dataset: explicit and named, rather than an inferred "district is Dhaka
 * and the upazila isn't one of these five known exceptions" rule that would
 * silently misclassify any future upazila added to Dhaka district.
 *
 * **To adjust later** (e.g. once real courier zone data exists, or a
 * "Dhaka suburban" tier is wanted): change `isDhakaCity` and the two rate
 * constants below. Nothing else in the codebase encodes the rule — checkout,
 * Express COD and `createOrder()` all call `resolveDeliveryCharge()`.
 */

/** Minor units (poisha), matching every other money value in the app. */
export const DHAKA_CITY_DELIVERY_CHARGE_MINOR = 8_000; // ৳80
export const STANDARD_DELIVERY_CHARGE_MINOR = 15_000; // ৳150

const DHAKA_CITY_DISTRICT = 'Dhaka';
const DHAKA_CITY_UPAZILA = 'Dhaka City';

/**
 * Whether a validated (district, upazila) pair is Dhaka City for delivery
 * pricing purposes. Callers are expected to have already confirmed the pair
 * is a real, correctly nested location (`isValidLocationHierarchy` in
 * `@/lib/checkout/address`) — this function only classifies, it does not
 * validate.
 */
export function isDhakaCity(district: string, upazila: string): boolean {
  return district === DHAKA_CITY_DISTRICT && upazila === DHAKA_CITY_UPAZILA;
}

/**
 * The one canonical delivery-pricing function — checkout's live display,
 * the express COD modal's live display, and `createOrder()`'s authoritative
 * calculation all call this and nothing else (§1, §6).
 *
 * Pure and safe to call from client code (it is not a database read and
 * carries no secret) — the client uses it to *show* a fee, the server uses
 * it to *charge* one, and only the server's calculation ever reaches an
 * order (§3).
 */
export function resolveDeliveryCharge(district: string, upazila: string): number {
  return isDhakaCity(district, upazila) ? DHAKA_CITY_DELIVERY_CHARGE_MINOR : STANDARD_DELIVERY_CHARGE_MINOR;
}
