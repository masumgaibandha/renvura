import {
  NON_PROBATIVE_SOURCE_TYPES,
  type ComplianceField,
  type EvidenceSourceType,
  type FieldIssue,
  type VerificationStatus,
} from '@/lib/catalogue/types';

/**
 * Compliance rules — docs/LOCKED_DECISIONS.md D-16, PROJECT_SPECIFICATION §7.2.
 *
 * Three rules, all absolute:
 *
 * 1. **A claim that is not `verified` is never rendered on the storefront.**
 *    Not `pending`, not "probably fine". Wrong safety or material information on
 *    a product a child uses is the highest-consequence failure in this project
 *    (§12.1).
 * 2. **Nothing may be inferred** from a product name, supplier marketing copy, a
 *    marketplace listing or a photograph. Evidence of those kinds is recordable
 *    — so the admin can show *what* backing exists — but cannot by itself carry
 *    a claim to `verified`.
 * 3. **Categories decide what is mandatory.** Higher-risk groups cannot publish
 *    until the applicable information is verified, and what applies is
 *    configuration confirmed by a qualified adviser, never asserted here.
 */

export type ComplianceProfile = {
  requiredFields?: readonly ComplianceField[];
  requiresVerification?: boolean;
};

export type EvidenceInput = {
  field?: ComplianceField;
  sourceType?: EvidenceSourceType;
  sourceRef?: string;
};

export type ComplianceInput = {
  manufacturer?: { name?: string } | null;
  supplier?: { name?: string } | null;
  countryOfOrigin?: string | null;
  materials?: readonly unknown[] | null;
  safetyWarnings?: readonly unknown[] | null;
  ageSafetyNote?: { en?: string; bn?: string } | null;
  certifications?: readonly unknown[] | null;
  testReports?: readonly unknown[] | null;
  batch?: { batchCode?: string } | null;
  warranty?: { periodMonths?: number } | null;
  evidence?: readonly EvidenceInput[] | null;
  verification?: { status?: VerificationStatus } | null;
};

/** Whether a single compliance field carries any content at all. */
export function hasComplianceField(
  compliance: ComplianceInput | null | undefined,
  field: ComplianceField,
): boolean {
  if (!compliance) return false;

  switch (field) {
    case 'manufacturer':
      return nonEmpty(compliance.manufacturer?.name);
    case 'supplier':
      return nonEmpty(compliance.supplier?.name);
    case 'countryOfOrigin':
      return nonEmpty(compliance.countryOfOrigin);
    case 'materials':
      return hasItems(compliance.materials);
    case 'safetyWarnings':
      return hasItems(compliance.safetyWarnings);
    case 'ageSafetyNote':
      return nonEmpty(compliance.ageSafetyNote?.en) || nonEmpty(compliance.ageSafetyNote?.bn);
    case 'certifications':
      return hasItems(compliance.certifications);
    case 'testReports':
      return hasItems(compliance.testReports);
    case 'batch':
      return nonEmpty(compliance.batch?.batchCode);
    case 'warranty':
      return typeof compliance.warranty?.periodMonths === 'number';
    default:
      return false;
  }
}

function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function hasItems(value: readonly unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0;
}

/** Evidence recorded for a field, ignoring entries with no source reference. */
export function evidenceFor(
  compliance: ComplianceInput | null | undefined,
  field: ComplianceField,
): EvidenceInput[] {
  return (compliance?.evidence ?? []).filter(
    (item) => item.field === field && nonEmpty(item.sourceRef),
  );
}

/**
 * Whether the recorded evidence for a field could support a verified claim.
 *
 * Supplier marketing, a marketplace listing and a photograph are recordable but
 * **non-probative** — at least one stronger source must exist (§7.2).
 */
export function hasProbativeEvidence(
  compliance: ComplianceInput | null | undefined,
  field: ComplianceField,
): boolean {
  return evidenceFor(compliance, field).some(
    (item) =>
      item.sourceType !== undefined && !NON_PROBATIVE_SOURCE_TYPES.includes(item.sourceType),
  );
}

/** The only state in which compliance content may reach the storefront. */
export function isComplianceVerified(compliance: ComplianceInput | null | undefined): boolean {
  return compliance?.verification?.status === 'verified';
}

/**
 * What the storefront is permitted to render.
 *
 * Returns an empty list unless the block is `verified`, so a caller cannot
 * accidentally render an unverified material list or safety warning by reading
 * the raw document. Phase 2B's product detail page reads *this*, never
 * `product.compliance` directly.
 */
export function renderableComplianceFields(
  compliance: ComplianceInput | null | undefined,
  fields: readonly ComplianceField[],
): ComplianceField[] {
  if (!isComplianceVerified(compliance)) return [];
  return fields.filter((field) => hasComplianceField(compliance, field));
}

/**
 * Checks a product's compliance block against its category's profile.
 *
 * Reports one issue per missing field — a checklist, not a flat rejection
 * (§7.3) — plus a single issue if verification is required and absent.
 */
export function validateAgainstProfile(
  compliance: ComplianceInput | null | undefined,
  profile: ComplianceProfile | null | undefined,
  { categoryName }: { categoryName?: string } = {},
): FieldIssue[] {
  const required = profile?.requiredFields ?? [];
  if (required.length === 0 && profile?.requiresVerification !== true) return [];

  const issues: FieldIssue[] = [];
  const detail = categoryName ? `required by category "${categoryName}"` : undefined;

  for (const field of required) {
    if (!hasComplianceField(compliance, field)) {
      issues.push({ field: `compliance.${field}`, code: 'complianceFieldMissing', detail });
      continue;
    }

    if (profile?.requiresVerification === true && !hasProbativeEvidence(compliance, field)) {
      issues.push({
        field: `compliance.${field}`,
        code: 'complianceEvidenceMissing',
        detail:
          'needs a document, lab report, certificate, supplier declaration or named person — supplier marketing, a marketplace listing or a photograph is not sufficient',
      });
    }
  }

  if (profile?.requiresVerification === true && !isComplianceVerified(compliance)) {
    issues.push({
      field: 'compliance.verification.status',
      code: 'complianceNotVerified',
      detail,
    });
  }

  return issues;
}
