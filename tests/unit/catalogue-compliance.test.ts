import { describe, expect, it } from 'vitest';
import {
  hasComplianceField,
  hasProbativeEvidence,
  isComplianceVerified,
  renderableComplianceFields,
  validateAgainstProfile,
  type ComplianceInput,
} from '@/lib/catalogue/compliance';
import { validateForPublish } from '@/lib/catalogue/publish';

/**
 * D-16 / §7.2. The highest-consequence rules in the catalogue: wrong safety or
 * material information on a product a child uses.
 */

const verifiedMaterials: ComplianceInput = {
  materials: [{ component: 'Body', material: 'Beech wood' }],
  evidence: [
    { field: 'materials', sourceType: 'lab-report', sourceRef: 'LAB-2026-114' },
  ],
  verification: { status: 'verified' },
};

describe('rendering', () => {
  it('withholds everything until the block is verified', () => {
    for (const status of ['unverified', 'pending', 'rejected'] as const) {
      const compliance: ComplianceInput = { ...verifiedMaterials, verification: { status } };
      expect(renderableComplianceFields(compliance, ['materials'])).toEqual([]);
    }
  });

  it('withholds a pending claim — "probably fine" is not a state', () => {
    const compliance: ComplianceInput = { ...verifiedMaterials, verification: { status: 'pending' } };
    expect(isComplianceVerified(compliance)).toBe(false);
    expect(renderableComplianceFields(compliance, ['materials'])).toEqual([]);
  });

  it('releases only verified fields that actually carry content', () => {
    expect(renderableComplianceFields(verifiedMaterials, ['materials', 'warranty'])).toEqual([
      'materials',
    ]);
  });

  it('withholds everything when there is no compliance block at all', () => {
    expect(renderableComplianceFields(undefined, ['materials'])).toEqual([]);
    expect(renderableComplianceFields(null, ['safetyWarnings'])).toEqual([]);
  });
});

describe('evidence quality', () => {
  it('does not accept supplier marketing as probative', () => {
    const compliance: ComplianceInput = {
      materials: [{ material: 'Wood' }],
      evidence: [{ field: 'materials', sourceType: 'supplier-marketing', sourceRef: 'listing copy' }],
    };
    expect(hasProbativeEvidence(compliance, 'materials')).toBe(false);
  });

  it('does not accept a marketplace listing or a photograph', () => {
    for (const sourceType of ['marketplace-listing', 'photograph'] as const) {
      const compliance: ComplianceInput = {
        materials: [{ material: 'Wood' }],
        evidence: [{ field: 'materials', sourceType, sourceRef: 'ref' }],
      };
      expect(hasProbativeEvidence(compliance, 'materials')).toBe(false);
    }
  });

  it.each(['document', 'lab-report', 'certificate', 'supplier-declaration', 'named-person'] as const)(
    'accepts %s as probative',
    (sourceType) => {
      const compliance: ComplianceInput = {
        materials: [{ material: 'Wood' }],
        evidence: [{ field: 'materials', sourceType, sourceRef: 'ref' }],
      };
      expect(hasProbativeEvidence(compliance, 'materials')).toBe(true);
    },
  );

  it('ignores evidence recorded against a different field', () => {
    const compliance: ComplianceInput = {
      materials: [{ material: 'Wood' }],
      evidence: [{ field: 'certifications', sourceType: 'lab-report', sourceRef: 'ref' }],
    };
    expect(hasProbativeEvidence(compliance, 'materials')).toBe(false);
  });
});

describe('field presence', () => {
  it('reads each field from its own shape', () => {
    expect(hasComplianceField({ manufacturer: { name: 'Acme' } }, 'manufacturer')).toBe(true);
    expect(hasComplianceField({ manufacturer: { name: '  ' } }, 'manufacturer')).toBe(false);
    expect(hasComplianceField({ countryOfOrigin: 'Bangladesh' }, 'countryOfOrigin')).toBe(true);
    expect(hasComplianceField({ materials: [] }, 'materials')).toBe(false);
    expect(hasComplianceField({ warranty: { periodMonths: 12 } }, 'warranty')).toBe(true);
    expect(hasComplianceField({ ageSafetyNote: { bn: 'সতর্কতা' } }, 'ageSafetyNote')).toBe(true);
  });
});

describe('category compliance profiles', () => {
  it('imposes nothing when the category declares no profile', () => {
    expect(validateAgainstProfile(undefined, undefined)).toEqual([]);
    expect(validateAgainstProfile(undefined, { requiredFields: [] })).toEqual([]);
  });

  it('reports each missing required field separately', () => {
    const issues = validateAgainstProfile(undefined, {
      requiredFields: ['manufacturer', 'materials', 'safetyWarnings'],
    });

    expect(issues).toHaveLength(3);
    expect(issues.map((issue) => issue.field)).toEqual([
      'compliance.manufacturer',
      'compliance.materials',
      'compliance.safetyWarnings',
    ]);
  });

  it('names the category that demanded the field', () => {
    const issues = validateAgainstProfile(undefined, { requiredFields: ['materials'] }, {
      categoryName: 'Feeding',
    });
    expect(issues[0]?.detail).toContain('Feeding');
  });

  it('demands verification when the profile requires it', () => {
    const issues = validateAgainstProfile(
      { materials: [{ material: 'Wood' }], verification: { status: 'pending' } },
      { requiredFields: ['materials'], requiresVerification: true },
    );

    expect(issues.map((issue) => issue.code)).toContain('complianceNotVerified');
  });

  it('demands probative evidence, not just a filled-in field', () => {
    const issues = validateAgainstProfile(
      {
        materials: [{ material: 'Wood' }],
        evidence: [{ field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'listing' }],
        verification: { status: 'verified' },
      },
      { requiredFields: ['materials'], requiresVerification: true },
    );

    expect(issues.map((issue) => issue.code)).toContain('complianceEvidenceMissing');
  });

  it('passes when the field, its evidence and the verification are all real', () => {
    expect(
      validateAgainstProfile(verifiedMaterials, {
        requiredFields: ['materials'],
        requiresVerification: true,
      }),
    ).toEqual([]);
  });
});

describe('publishing under a strict category profile', () => {
  const product = {
    status: 'draft' as const,
    name: 'Silicone feeding spoon',
    slug: 'silicone-feeding-spoon',
    description: 'A spoon.',
    priceMinor: 25000,
    sku: 'RV-SPOON-01',
    category: 'feeding',
    images: [{ url: '/s.jpg', alt: 'A silicone feeding spoon', width: 600, height: 600 }],
    stockPolicy: 'track' as const,
    stock: 4,
  };

  it('blocks a higher-risk product whose compliance is unverified', () => {
    const result = validateForPublish(product, {
      complianceProfile: { requiredFields: ['manufacturer', 'materials'], requiresVerification: true },
      categoryName: 'Feeding',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.code)).toContain('complianceFieldMissing');
    expect(result.issues.map((issue) => issue.code)).toContain('complianceNotVerified');
  });

  it('allows the same product once compliance is real and verified', () => {
    const result = validateForPublish(
      {
        ...product,
        compliance: {
          manufacturer: { name: 'Acme Ltd' },
          materials: [{ component: 'Bowl', material: 'Food-grade silicone' }],
          evidence: [
            { field: 'manufacturer', sourceType: 'supplier-declaration', sourceRef: 'DEC-9' },
            { field: 'materials', sourceType: 'lab-report', sourceRef: 'LAB-77' },
          ],
          verification: { status: 'verified' },
        },
      },
      {
        complianceProfile: { requiredFields: ['manufacturer', 'materials'], requiresVerification: true },
        categoryName: 'Feeding',
      },
    );

    expect(result).toEqual({ ok: true });
  });

  it('publishes an ordinary product with no compliance profile at all', () => {
    expect(validateForPublish(product).ok).toBe(true);
  });
});
