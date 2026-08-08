/**
 * Shared catalogue vocabulary — docs/PROJECT_SPECIFICATION.md §7, D-16.
 *
 * Every union below is declared once, here, so the Mongoose schemas, the Zod
 * input schemas and the publish/compliance rules cannot drift apart.
 */

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * §7.1 status visibility rules:
 *   draft    — 404 to the public, never indexed, never in the sitemap
 *   active   — fully visible
 *   archived — direct URL only, marked unavailable, `noindex`, out of discovery
 */
export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/**
 * §7.1 stock modelling. `stockPolicy` is always required — it is the field that
 * decides whether a quantity is meaningful at all. A quantity is required only
 * for `track`; for the other two it is meaningless and must never be validated,
 * displayed as a count, or decremented.
 */
export const STOCK_POLICIES = ['track', 'always-in-stock', 'made-to-order'] as const;
export type StockPolicy = (typeof STOCK_POLICIES)[number];

export const PRODUCT_TYPES = ['single', 'bundle'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/**
 * Catalogue availability — **orthogonal to `status`**, and deliberately so.
 *
 * `status` answers "is this record published?"; availability answers "can a
 * customer buy it?". A product the founder has selected but not yet priced,
 * imported or committed to is a real catalogue entry that is simply not for
 * sale yet, and the honest way to model that is its own field:
 *
 *   available   — the normal state; price and purchase flow apply
 *   coming-soon — selected and shown, but not orderable and **not priced**
 *
 * The alternative — a zero price, a zero stock count, or an `archived` status —
 * would each encode the fact as a lie in a field that means something else, and
 * every price, stock and sitemap rule downstream would have to special-case it.
 * D-12 forbids the price version outright: `৳0` is not a price.
 */
export const CATALOGUE_AVAILABILITIES = ['available', 'coming-soon'] as const;
export type CatalogueAvailability = (typeof CATALOGUE_AVAILABILITIES)[number];

/** Derived where possible, never hand-typed (design direction §6.2). */
export const PRODUCT_BADGES = ['new', 'bestseller', 'offer'] as const;
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Supporting pastels (D-06). Assigned per category and age band as **data**, so
 * a category keeps the same colour everywhere it appears.
 */
export const ACCENT_TOKENS = [
  'soft-sky',
  'soft-mint',
  'soft-blush',
  'soft-lavender',
  'soft-sunshine',
] as const;
export type AccentToken = (typeof ACCENT_TOKENS)[number];

/* -------------------------------------------------------------------------- */
/* Compliance (D-16, §7.2)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The compliance fields a category may declare mandatory before a product in it
 * can be published. Deliberately a *configurable* list: this project names no
 * statute, standard number or certification scheme as applicable to Renvura
 * (§7.2 "Legal qualification"), it only holds and gates on verified data.
 */
export const COMPLIANCE_FIELDS = [
  'manufacturer',
  'supplier',
  'countryOfOrigin',
  'materials',
  'safetyWarnings',
  'ageSafetyNote',
  'certifications',
  'testReports',
  'batch',
  'warranty',
] as const;
export type ComplianceField = (typeof COMPLIANCE_FIELDS)[number];

/**
 * A claim is renderable on the storefront **only** at `verified`. Every other
 * state — including `pending` — is withheld (D-16).
 */
export const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SAFETY_SEVERITIES = ['info', 'caution', 'warning'] as const;
export type SafetySeverity = (typeof SAFETY_SEVERITIES)[number];

/**
 * Where a compliance claim came from. `supplier-marketing` and
 * `marketplace-listing` are represented so the admin can record that a claim's
 * only backing is unverifiable sales copy — which is exactly the evidence that
 * must never reach `verified` on its own (§7.2).
 */
export const EVIDENCE_SOURCE_TYPES = [
  'document',
  'lab-report',
  'certificate',
  'supplier-declaration',
  'supplier-marketing',
  'marketplace-listing',
  'photograph',
  'named-person',
] as const;
export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number];

/**
 * Evidence that cannot, by itself, support a verified claim. §7.2: "Nothing here
 * may be inferred from a product name, a supplier's marketing copy, a
 * marketplace listing or a photograph."
 */
export const NON_PROBATIVE_SOURCE_TYPES: readonly EvidenceSourceType[] = [
  'supplier-marketing',
  'marketplace-listing',
  'photograph',
];

/* -------------------------------------------------------------------------- */
/* Validation results                                                          */
/* -------------------------------------------------------------------------- */

/**
 * One problem with one field. Publishing reports a **per-field checklist** —
 * "what is missing before this can go live" — never a single flat rejection
 * (§7.3). `code` is stable and translatable; `message` lives in the UI layer.
 */
export type FieldIssue = {
  /** Dotted path, e.g. `images.0.alt` or `compliance.materials`. */
  field: string;
  code: string;
  /** Optional context, e.g. which category demanded the field. */
  detail?: string;
};

export type ValidationResult = { ok: true } | { ok: false; issues: FieldIssue[] };

export function ok(): ValidationResult {
  return { ok: true };
}

export function fail(issues: FieldIssue[]): ValidationResult {
  return { ok: false, issues };
}

/* -------------------------------------------------------------------------- */
/* Shared shapes                                                               */
/* -------------------------------------------------------------------------- */

/** English required, Bangla optional and silently omitted when absent (D-02). */
export type BilingualText = { en?: string; bn?: string };

/** Slugs are always English, even for a Bangla-named product (D-03, §4.4). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Conservative SKU shape: upper alphanumerics with `-` / `_` separators. */
export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;
