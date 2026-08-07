import { validateAgainstProfile, type ComplianceInput, type ComplianceProfile } from '@/lib/catalogue/compliance';
import {
  fail,
  ok,
  SKU_PATTERN,
  SLUG_PATTERN,
  type FieldIssue,
  type ProductStatus,
  type StockPolicy,
  type ValidationResult,
} from '@/lib/catalogue/types';

/**
 * Publish validation — docs/PROJECT_SPECIFICATION.md §7.3, D-16.
 *
 * **Validation gates the transition to `active`, never the write.** A product
 * can always be saved as a draft with nothing but `status` and `stockPolicy`;
 * partial work is preserved so the founder can add a name today and images next
 * week. That is why the Mongoose schema is lenient and this function is strict.
 *
 * Failures come back as a **per-field checklist** — "what is missing before this
 * can go live" — never a single generic rejection. Un-publishing is always
 * allowed and is never validated.
 */

export type ProductImageInput = {
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type PublishableProduct = {
  status?: ProductStatus;
  name?: string;
  slug?: string;
  description?: string;
  priceMinor?: number;
  sku?: string;
  category?: unknown;
  images?: readonly ProductImageInput[] | null;
  stockPolicy?: StockPolicy;
  stock?: number;
  compliance?: ComplianceInput | null;
};

export type PublishContext = {
  /** The primary category's profile, if it declares one. */
  complianceProfile?: ComplianceProfile | null;
  categoryName?: string;
};

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Everything required to move a product to `active` (§7.3):
 * name · description · a real price · SKU · at least one image with alt text ·
 * a primary category · a valid stock policy (plus a quantity when `track`) ·
 * every compliance field the category requires, verified where required.
 */
export function validateForPublish(
  product: PublishableProduct,
  context: PublishContext = {},
): ValidationResult {
  const issues: FieldIssue[] = [];

  if (!isNonEmpty(product.name)) {
    issues.push({ field: 'name', code: 'nameRequired' });
  }

  if (!isNonEmpty(product.slug)) {
    issues.push({ field: 'slug', code: 'slugRequired' });
  } else if (!SLUG_PATTERN.test(product.slug)) {
    // Slugs are always English and URL-clean, even for a Bangla-named product.
    issues.push({ field: 'slug', code: 'slugInvalid' });
  }

  if (!isNonEmpty(product.description)) {
    issues.push({ field: 'description', code: 'descriptionRequired' });
  }

  // "A real founder-supplied price" (§7.1). Zero is not a price, and a
  // non-integer means someone passed rupees where poisha were expected.
  if (typeof product.priceMinor !== 'number' || !Number.isFinite(product.priceMinor)) {
    issues.push({ field: 'priceMinor', code: 'priceRequired' });
  } else if (!Number.isInteger(product.priceMinor)) {
    issues.push({ field: 'priceMinor', code: 'priceNotMinorUnits' });
  } else if (product.priceMinor <= 0) {
    issues.push({ field: 'priceMinor', code: 'priceMustBePositive' });
  }

  if (!isNonEmpty(product.sku)) {
    issues.push({ field: 'sku', code: 'skuRequired' });
  } else if (!SKU_PATTERN.test(product.sku)) {
    issues.push({ field: 'sku', code: 'skuInvalid' });
  }

  if (product.category === undefined || product.category === null || product.category === '') {
    issues.push({ field: 'category', code: 'categoryRequired' });
  }

  issues.push(...validateImagesForPublish(product.images));
  issues.push(...validateStockForPublish(product));

  issues.push(
    ...validateAgainstProfile(product.compliance, context.complianceProfile, {
      categoryName: context.categoryName,
    }),
  );

  return issues.length > 0 ? fail(issues) : ok();
}

/** At least one image, each with a URL and meaningful alt text (§10). */
export function validateImagesForPublish(
  images: readonly ProductImageInput[] | null | undefined,
): FieldIssue[] {
  if (!Array.isArray(images) || images.length === 0) {
    return [{ field: 'images', code: 'imageRequired' }];
  }

  const issues: FieldIssue[] = [];

  images.forEach((image, index) => {
    if (!isNonEmpty(image.url)) {
      issues.push({ field: `images.${index}.url`, code: 'imageUrlRequired' });
    }
    if (!isNonEmpty(image.alt)) {
      issues.push({ field: `images.${index}.alt`, code: 'imageAltRequired' });
    }
    // Reserved dimensions are a CLS-budget requirement, not a nicety (D-14).
    if (typeof image.width !== 'number' || typeof image.height !== 'number') {
      issues.push({ field: `images.${index}.width`, code: 'imageDimensionsRequired' });
    }
  });

  return issues;
}

/**
 * Stock rules (§7.1).
 *
 * `stockPolicy` is always required. A quantity is required **only** for `track`
 * — it is meaningless for `always-in-stock` and `made-to-order`, and supplying
 * one there is a modelling error worth reporting rather than silently keeping.
 */
export function validateStockForPublish(product: PublishableProduct): FieldIssue[] {
  const issues: FieldIssue[] = [];

  if (product.stockPolicy === undefined) {
    issues.push({ field: 'stockPolicy', code: 'stockPolicyRequired' });
    return issues;
  }

  if (product.stockPolicy === 'track') {
    if (typeof product.stock !== 'number' || !Number.isFinite(product.stock)) {
      issues.push({ field: 'stock', code: 'stockRequiredWhenTracked' });
    } else if (!Number.isInteger(product.stock) || product.stock < 0) {
      issues.push({ field: 'stock', code: 'stockInvalid' });
    }
  } else if (typeof product.stock === 'number') {
    issues.push({ field: 'stock', code: 'stockNotApplicable' });
  }

  return issues;
}

/**
 * Whether a product may currently be added to a cart.
 *
 * Availability derives from the policy, never from a bare quantity — which is
 * what makes a future checkout stock check safe for all three policies.
 */
export function isPurchasable(product: PublishableProduct): boolean {
  if (product.status !== 'active') return false;

  switch (product.stockPolicy) {
    case 'track':
      return typeof product.stock === 'number' && product.stock > 0;
    case 'always-in-stock':
    case 'made-to-order':
      return true;
    default:
      return false;
  }
}

/** Human wording for each publish code. English — the admin language (§4.2). */
export const PUBLISH_ERRORS: Record<string, string> = {
  nameRequired: 'Add a product name',
  slugRequired: 'Add a URL slug',
  slugInvalid: 'Use lowercase English letters, numbers and hyphens only',
  descriptionRequired: 'Add a description',
  priceRequired: 'Add a real price',
  priceNotMinorUnits: 'Price must be a whole number of poisha',
  priceMustBePositive: 'Price must be greater than zero',
  skuRequired: 'Add a SKU',
  skuInvalid: 'Use uppercase letters, numbers, hyphens and underscores only',
  categoryRequired: 'Choose a primary category',
  imageRequired: 'Add at least one image',
  imageUrlRequired: 'This image has no file',
  imageAltRequired: 'Describe this image for screen readers and search',
  imageDimensionsRequired: 'This image is missing its width and height',
  stockPolicyRequired: 'Choose a stock policy',
  stockRequiredWhenTracked: 'Add a stock quantity, or change the stock policy',
  stockInvalid: 'Stock must be a whole number of zero or more',
  stockNotApplicable: 'This stock policy does not use a quantity — remove it',
  complianceFieldMissing: 'This category requires this compliance information',
  complianceEvidenceMissing: 'This claim needs a verifiable source',
  complianceNotVerified: 'Compliance for this category must be verified before publishing',
};

export function publishErrorMessage(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return PUBLISH_ERRORS[code] ?? 'Check this field';
}
