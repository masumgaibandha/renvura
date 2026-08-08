'use client';

import { FieldError, Label, TextArea, TextField } from '@heroui/react';
import { useId } from 'react';
import {
  DIVISIONS,
  districtsForDivision,
  upazilasForDistrict,
  type LocationOption,
} from '@/lib/checkout/address';
import { checkoutErrorMessage } from '@/lib/checkout/validation';

/**
 * Shipping address fields — §5, §6, §7.7. Shared by the full checkout form
 * and the express COD modal (`CheckoutForm`, `ExpressCodModal`), so there is
 * one address implementation, not two that could drift.
 *
 * Division, district and upazila are a **dependent** three-level hierarchy,
 * not three independent fields: choosing a division scopes the district
 * options to it, and choosing a district scopes the upazila options to it
 * (`@/lib/checkout/address`, the same dataset the server validates against).
 * All three are plain native `<select>`s, not HeroUI's React Aria Select —
 * a few hundred static options need none of that component's complexity, and
 * a native control is fully keyboard- and screen-reader-operable with no
 * extra work (§25).
 *
 * **The reset behaviour lives here, once**, not in each caller: changing the
 * division always clears district and upazila, and changing the district
 * always clears upazila — `onChange` receives the whole next address, already
 * correctly reset, so `CheckoutForm` and `ExpressCodModal` cannot implement
 * this differently or forget it (§4, §8).
 */
export type AddressValues = {
  division: string;
  district: string;
  upazila: string;
  street: string;
};

export function AddressFields({
  values,
  errors,
  onChange,
  idPrefix,
}: {
  values: AddressValues;
  errors: Partial<Record<keyof AddressValues, string>>;
  onChange: (next: AddressValues) => void;
  /** Keeps ids unique when this renders more than once on a page (modal + page, in tests). */
  idPrefix: string;
}) {
  const districts = values.division ? districtsForDivision(values.division) : [];
  const upazilas = values.district ? upazilasForDistrict(values.district) : [];

  return (
    <div className="space-y-5">
      <LocationSelect
        idPrefix={idPrefix}
        field="division"
        label="Division"
        placeholder="Select division"
        value={values.division}
        options={DIVISIONS}
        error={errors.division}
        onChange={(division) => onChange({ ...values, division, district: '', upazila: '' })}
      />

      <LocationSelect
        idPrefix={idPrefix}
        field="district"
        label="District"
        placeholder="Select district"
        disabledPlaceholder="Select division first"
        value={values.district}
        options={districts}
        disabled={values.division === ''}
        error={errors.district}
        onChange={(district) => onChange({ ...values, district, upazila: '' })}
      />

      <LocationSelect
        idPrefix={idPrefix}
        field="upazila"
        label="Upazila"
        placeholder="Select upazila"
        disabledPlaceholder="Select district first"
        value={values.upazila}
        options={upazilas}
        disabled={values.district === ''}
        error={errors.upazila}
        onChange={(upazila) => onChange({ ...values, upazila })}
      />

      <TextField
        name="street"
        value={values.street}
        onChange={(street) => onChange({ ...values, street })}
        isRequired
        isInvalid={Boolean(errors.street)}
        autoComplete="street-address"
        className="w-full"
      >
        <Label>House, road and street address</Label>
        <TextArea rows={2} placeholder="House number, road number, landmark" />
        {errors.street ? <FieldError>{checkoutErrorMessage(errors.street)}</FieldError> : null}
      </TextField>
    </div>
  );
}

function LocationSelect({
  idPrefix,
  field,
  label,
  placeholder,
  disabledPlaceholder,
  value,
  options,
  disabled = false,
  error,
  onChange,
}: {
  idPrefix: string;
  field: string;
  label: string;
  placeholder: string;
  disabledPlaceholder?: string;
  value: string;
  options: readonly LocationOption[];
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();
  const errorId = `${idPrefix}-${field}-error`;

  return (
    <div>
      <label htmlFor={`${idPrefix}-${field}-${inputId}`} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={`${idPrefix}-${field}-${inputId}`}
        name={field}
        required
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-1.5 block min-h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[--focus] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-muted"
      >
        <option value="" disabled>
          {disabled ? disabledPlaceholder : placeholder}
        </option>
        {options.map((option) => (
          <option key={option.slug} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {checkoutErrorMessage(error)}
        </p>
      ) : null}
    </div>
  );
}
