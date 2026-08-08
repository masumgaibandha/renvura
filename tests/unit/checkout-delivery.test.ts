import { describe, expect, it } from 'vitest';
import {
  DHAKA_CITY_DELIVERY_CHARGE_MINOR,
  STANDARD_DELIVERY_CHARGE_MINOR,
  isDhakaCity,
  resolveDeliveryCharge,
} from '@/lib/checkout/delivery';
import { districtsForDivision } from '@/lib/checkout/address';

/**
 * §7 — the founder's final, settled delivery-pricing decision: ৳80 for Dhaka
 * City, ৳150 everywhere else in Bangladesh. The classification is the part
 * worth testing hardest — it is deliberately not `division === "Dhaka"` (see
 * `@/lib/checkout/delivery`'s module doc for why).
 */

describe('the flat rates', () => {
  it('matches the founder-approved amounts, in minor units', () => {
    expect(DHAKA_CITY_DELIVERY_CHARGE_MINOR).toBe(8_000); // ৳80
    expect(STANDARD_DELIVERY_CHARGE_MINOR).toBe(15_000); // ৳150
  });
});

describe('isDhakaCity', () => {
  it('is true only for the exact (Dhaka district, Dhaka City upazila) pair', () => {
    expect(isDhakaCity('Dhaka', 'Dhaka City')).toBe(true);
  });

  it('is false for the outlying upazilas that belong to Dhaka district itself', () => {
    // Savar, Dhamrai, Keraniganj, Nawabganj and Dohar are Dhaka *district*'s
    // real upazilas — semi-rural areas around the city, not the city itself.
    for (const upazila of ['Savar', 'Dhamrai', 'Keraniganj', 'Nawabganj', 'Dohar']) {
      expect(isDhakaCity('Dhaka', upazila)).toBe(false);
    }
  });

  it('is false for every other district in Dhaka division', () => {
    // The task's own warning, made concrete: Dhaka division contains many
    // districts that are not Dhaka city, and none of them should slip
    // through on division membership alone.
    const otherDhakaDivisionDistricts = districtsForDivision('Dhaka')
      .map((d) => d.name)
      .filter((name) => name !== 'Dhaka');

    expect(otherDhakaDivisionDistricts).toEqual(
      expect.arrayContaining(['Gazipur', 'Narayanganj', 'Manikganj', 'Tangail', 'Narsingdi']),
    );

    for (const district of otherDhakaDivisionDistricts) {
      expect(isDhakaCity(district, 'Dhaka City')).toBe(false);
    }
  });

  it('is false for an unrelated district/upazila pair', () => {
    expect(isDhakaCity('Gaibandha', 'Sundarganj')).toBe(false);
    expect(isDhakaCity('Chattogram', 'Sitakunda')).toBe(false);
  });
});

describe('resolveDeliveryCharge', () => {
  it('charges ৳80 for Dhaka City', () => {
    expect(resolveDeliveryCharge('Dhaka', 'Dhaka City')).toBe(DHAKA_CITY_DELIVERY_CHARGE_MINOR);
  });

  it('charges ৳150 for Dhaka district outside Dhaka City', () => {
    expect(resolveDeliveryCharge('Dhaka', 'Savar')).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
    expect(resolveDeliveryCharge('Dhaka', 'Keraniganj')).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
  });

  it('charges ৳150 for other Dhaka-division districts, even though they share the division', () => {
    expect(resolveDeliveryCharge('Gazipur', 'Gazipur Sadar')).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
    expect(resolveDeliveryCharge('Narayanganj', 'Narayanganj Sadar')).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
    expect(resolveDeliveryCharge('Manikganj', 'Manikganj Sadar')).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
  });

  it('charges ৳150 for a fully unrelated division', () => {
    expect(resolveDeliveryCharge('Gaibandha', 'Sundarganj')).toBe(STANDARD_DELIVERY_CHARGE_MINOR);
  });

  it('never returns anything other than the two founder-approved amounts', () => {
    const combinations: [string, string][] = [
      ['Dhaka', 'Dhaka City'],
      ['Dhaka', 'Savar'],
      ['Gazipur', 'Gazipur Sadar'],
      ['Gaibandha', 'Sundarganj'],
      ['Chattogram', 'Sitakunda'],
    ];
    for (const [district, upazila] of combinations) {
      expect([DHAKA_CITY_DELIVERY_CHARGE_MINOR, STANDARD_DELIVERY_CHARGE_MINOR]).toContain(
        resolveDeliveryCharge(district, upazila),
      );
    }
  });
});
