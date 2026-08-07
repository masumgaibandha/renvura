import { z } from 'zod';
import {
  ACCENT_TOKENS,
  COMPLIANCE_FIELDS,
  EVIDENCE_SOURCE_TYPES,
  PRODUCT_BADGES,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  SAFETY_SEVERITIES,
  SKU_PATTERN,
  SLUG_PATTERN,
  STOCK_POLICIES,
  VERIFICATION_STATUSES,
} from '@/lib/catalogue/types';

/**
 * Catalogue input validation.
 *
 * **Division of responsibility, kept deliberately clean:**
 *
 *   Zod (here)        shape and type of untrusted input at the API boundary —
 *                     is this a string, is it in range, is the enum a member.
 *   Mongoose schema   storage shape, defaults, references, indexes. Lenient by
 *                     design so a draft always saves (§7.3).
 *   `catalogue/*`     the business rules — publish requirements, compliance
 *                     verification, age-band contiguity. Pure, shared, and the
 *                     single definition of each rule.
 *
 * Business rules are **not** duplicated into Zod. `productDraftSchema` will
 * happily accept a product with no name, because saving an incomplete draft is
 * a documented requirement; `validateForPublish()` is what refuses to make it
 * live. Encoding "name is required" here would break drafting.
 *
 * Messages are stable **codes**, matching `validation/contact.ts`, so wording
 * lives in one place and the same schema runs on client and server.
 */

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(200, 'slugTooLong')
  .refine((value) => SLUG_PATTERN.test(value), 'slugInvalid');

const sku = z
  .string()
  .trim()
  .toUpperCase()
  .max(60, 'skuTooLong')
  .refine((value) => SKU_PATTERN.test(value), 'skuInvalid');

/** Whole poisha. Rupee floats are rejected outright — money is never a float. */
const minorUnits = z.number().int('priceNotMinorUnits').min(0, 'priceMustBePositive');

const bilingual = z
  .object({
    en: z.string().trim().max(4000).optional(),
    bn: z.string().trim().max(4000).optional(),
  })
  .optional();

export const productImageSchema = z.object({
  url: z.string().trim().min(1, 'imageUrlRequired'),
  alt: z.string().trim().max(300).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().trim().toLowerCase().max(20).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
});

export const productVideoSchema = z.object({
  url: z.string().trim().min(1, 'videoUrlRequired'),
  title: z.string().trim().max(200).optional(),
  posterUrl: z.string().trim().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const productVariantSchema = z.object({
  name: z.string().trim().max(200).optional(),
  sku: sku.optional(),
  options: z
    .array(z.object({ name: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(120) }))
    .optional(),
  priceMinor: minorUnits.optional(),
  comparePriceMinor: minorUnits.optional(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const complianceSchema = z.object({
  manufacturer: z.object({ name: z.string().trim().max(200).optional(), contact: z.string().trim().max(300).optional() }).optional(),
  supplier: z.object({ name: z.string().trim().max(200).optional(), contact: z.string().trim().max(300).optional() }).optional(),
  countryOfOrigin: z.string().trim().max(100).optional(),
  materials: z
    .array(
      z.object({
        component: z.string().trim().max(120).optional(),
        material: z.string().trim().max(120).optional(),
        note: z.string().trim().max(300).optional(),
      }),
    )
    .optional(),
  safetyWarnings: z
    .array(
      z.object({
        en: z.string().trim().max(1000).optional(),
        bn: z.string().trim().max(1000).optional(),
        severity: z.enum(SAFETY_SEVERITIES).optional(),
      }),
    )
    .optional(),
  ageSafetyNote: bilingual,
  certifications: z
    .array(
      z.object({
        scheme: z.string().trim().max(120).optional(),
        reference: z.string().trim().max(200).optional(),
        issuedBy: z.string().trim().max(200).optional(),
        issuedAt: z.coerce.date().optional(),
        expiresAt: z.coerce.date().optional(),
        documentUrl: z.string().trim().optional(),
      }),
    )
    .optional(),
  testReports: z
    .array(
      z.object({
        labName: z.string().trim().max(200).optional(),
        reportRef: z.string().trim().max(200).optional(),
        testedAt: z.coerce.date().optional(),
        documentUrl: z.string().trim().optional(),
      }),
    )
    .optional(),
  batch: z
    .object({
      batchCode: z.string().trim().max(120).optional(),
      manufacturedAt: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional(),
    })
    .optional(),
  warranty: z
    .object({
      periodMonths: z.number().int().min(0).optional(),
      terms: bilingual,
      provider: z.string().trim().max(200).optional(),
    })
    .optional(),
  evidence: z
    .array(
      z.object({
        field: z.enum(COMPLIANCE_FIELDS),
        sourceType: z.enum(EVIDENCE_SOURCE_TYPES),
        sourceRef: z.string().trim().min(1, 'evidenceSourceRequired').max(500),
        documentUrl: z.string().trim().optional(),
        capturedAt: z.coerce.date().optional(),
      }),
    )
    .optional(),
  verification: z
    .object({
      status: z.enum(VERIFICATION_STATUSES).optional(),
      verifiedBy: z.string().trim().max(200).optional(),
      verifiedAt: z.coerce.date().optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .optional(),
});

/**
 * A product as accepted for **saving**, at any completeness.
 *
 * Only `status`, `stockPolicy` and `productType` have defaults; everything else
 * may be absent. This is what makes "draft freely" true at the API boundary
 * (§7.3) — the publish gate lives elsewhere.
 */
export const productDraftSchema = z.object({
  status: z.enum(PRODUCT_STATUSES).default('draft'),
  stockPolicy: z.enum(STOCK_POLICIES).default('track'),
  productType: z.enum(PRODUCT_TYPES).default('single'),

  name: z.string().trim().max(250).optional(),
  slug: slug.optional(),
  description: z.string().trim().max(20000).optional(),
  descriptionBn: z.string().trim().max(20000).optional(),
  shortDescription: z.string().trim().max(600).optional(),
  priceMinor: minorUnits.optional(),
  comparePriceMinor: minorUnits.optional(),
  sku: sku.optional(),
  brand: z.string().trim().max(150).optional(),
  stock: z.number().int().min(0).optional(),

  category: z.string().trim().optional(),
  categories: z.array(z.string().trim()).optional(),
  collections: z.array(z.string().trim()).optional(),
  tags: z.array(z.string().trim().max(60)).optional(),
  searchAliases: z.array(z.string().trim().max(120)).optional(),

  images: z.array(productImageSchema).optional(),
  videos: z.array(productVideoSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
  attributes: z
    .array(
      z.object({
        key: z.string().trim().max(80).optional(),
        labelEn: z.string().trim().max(120).optional(),
        value: z.string().trim().max(500).optional(),
        unit: z.string().trim().max(30).optional(),
      }),
    )
    .optional(),
  badges: z.array(z.enum(PRODUCT_BADGES)).optional(),
  weightGrams: z.number().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isDemo: z.boolean().optional(),

  // Optional child-development block — absent by default (D-01, §3.4).
  ageRange: z
    .object({ minMonths: z.number().int().min(0), maxMonths: z.number().int().min(0) })
    .refine((range) => range.minMonths <= range.maxMonths, 'ageRangeInverted')
    .optional(),
  developmentDomains: z.array(z.string().trim().max(80)).optional(),
  expertNote: bilingual,
  milestones: z.array(z.object({ en: z.string().trim().max(4000).optional(), bn: z.string().trim().max(4000).optional() })).optional(),
  ageGuidance: bilingual,

  compliance: complianceSchema.optional(),

  seo: z
    .object({
      metaTitle: z.string().trim().max(200).optional(),
      metaDescription: z.string().trim().max(400).optional(),
      ogImage: z.string().trim().optional(),
    })
    .optional(),
});

export type ProductDraftInput = z.infer<typeof productDraftSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(150),
  slug,
  nameBn: z.string().trim().max(150).optional(),
  description: z.string().trim().max(4000).optional(),
  descriptionBn: z.string().trim().max(4000).optional(),
  parent: z.string().trim().nullable().optional(),
  image: z
    .object({
      url: z.string().trim().optional(),
      alt: z.string().trim().max(300).optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
    .optional(),
  accentToken: z.enum(ACCENT_TOKENS).optional(),
  complianceProfile: z
    .object({
      requiredFields: z.array(z.enum(COMPLIANCE_FIELDS)).optional(),
      requiresVerification: z.boolean().optional(),
      note: z.string().trim().max(1000).optional(),
    })
    .optional(),
  searchAliases: z.array(z.string().trim().max(120)).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  seo: z
    .object({
      metaTitle: z.string().trim().max(200).optional(),
      metaDescription: z.string().trim().max(400).optional(),
      ogImage: z.string().trim().optional(),
    })
    .optional(),
});

export const ageBandInputSchema = z
  .object({
    label: z.string().trim().min(1, 'labelRequired').max(100),
    slug,
    minMonths: z.number().int().min(0, 'minMonthsInvalid'),
    maxMonths: z.number().int().min(0, 'maxMonthsInvalid'),
    supportingLine: z.string().trim().max(200).optional(),
    accentToken: z.enum(ACCENT_TOKENS).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((band) => band.minMonths <= band.maxMonths, {
    message: 'maxBeforeMin',
    path: ['maxMonths'],
  });

export const collectionInputSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(200),
  slug,
  description: z.string().trim().max(8000).optional(),
  descriptionBn: z.string().trim().max(8000).optional(),
  heroImage: z
    .object({
      url: z.string().trim().optional(),
      alt: z.string().trim().max(300).optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
    .optional(),
  products: z.array(z.string().trim()).optional(),
  rules: z
    .object({
      categories: z.array(z.string().trim()).optional(),
      ageBands: z.array(z.string().trim()).optional(),
      tags: z.array(z.string().trim().max(60)).optional(),
      minPriceMinor: minorUnits.optional(),
      maxPriceMinor: minorUnits.optional(),
    })
    .optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  seo: z
    .object({
      metaTitle: z.string().trim().max(200).optional(),
      metaDescription: z.string().trim().max(400).optional(),
      ogImage: z.string().trim().optional(),
    })
    .optional(),
});

/** Wording for the codes this module emits. English — the admin language. */
export const CATALOGUE_ERRORS: Record<string, string> = {
  nameRequired: 'Enter a name',
  labelRequired: 'Enter a label',
  slugInvalid: 'Use lowercase English letters, numbers and hyphens only',
  slugTooLong: 'That slug is too long',
  skuInvalid: 'Use uppercase letters, numbers, hyphens and underscores only',
  skuTooLong: 'That SKU is too long',
  priceNotMinorUnits: 'Price must be a whole number of poisha',
  priceMustBePositive: 'Price cannot be negative',
  imageUrlRequired: 'This image has no file',
  videoUrlRequired: 'This video has no file',
  evidenceSourceRequired: 'Record where this claim comes from',
  ageRangeInverted: 'The maximum age must not be below the minimum',
  minMonthsInvalid: 'Enter a whole number of months',
  maxMonthsInvalid: 'Enter a whole number of months',
  maxBeforeMin: 'The maximum must not be below the minimum',
};

export function catalogueErrorMessage(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return CATALOGUE_ERRORS[code] ?? 'Check this field';
}
