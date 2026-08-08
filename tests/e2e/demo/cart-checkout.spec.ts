import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Phase 4 — cart, checkout, express COD, order confirmation and tracking.
 *
 * Runs against the `demo-preview` project, the same posture as the rest of
 * `tests/e2e/demo/*`. Delivery pricing is now a settled founder decision
 * (৳80 Dhaka City, ৳150 everywhere else — `@/lib/checkout/delivery`), so
 * unlike the earlier Phase 4 pass, this file can and does exercise a
 * genuinely successful order end to end through the real browser: filling
 * the full checkout form, placing the order, and reading the resulting
 * confirmation page.
 *
 * Two real, verified locations anchor every address used below (confirmed
 * against `@/lib/checkout/address`):
 *   Dhaka City       → division Dhaka, district Dhaka, upazila "Dhaka City"
 *   Outside the city  → division Rangpur, district Gaibandha, upazila Sundarganj
 */

const AVAILABLE = {
  slug: 'rainbow-wooden-abacus-and-counting-stacker',
  name: 'Rainbow Wooden Abacus & Counting Stacker',
  price: '৳1,690',
};
const COMING_SOON_SLUG = 'kids-explorer-binoculars-outdoor-nature';

const DHAKA_CITY_ADDRESS = { division: 'Dhaka', district: 'Dhaka', upazila: 'Dhaka City' };
const OUTSIDE_DHAKA_CITY_ADDRESS = { division: 'Rangpur', district: 'Gaibandha', upazila: 'Sundarganj' };
const DHAKA_CITY_DELIVERY = '৳80';
const STANDARD_DELIVERY = '৳150';

/** Fills Division → District → Upazila through the real dependent selects. */
async function fillAddress(
  scope: Page | Locator,
  address: { division: string; district: string; upazila: string },
) {
  await scope.getByLabel('Division').selectOption(address.division);
  await scope.getByLabel('District').selectOption(address.district);
  await scope.getByLabel('Upazila').selectOption(address.upazila);
}

/** Fills the whole shipping address, including the street textarea. */
async function fillFullAddress(
  scope: Page | Locator,
  address: { division: string; district: string; upazila: string },
  street: string,
) {
  await fillAddress(scope, address);
  await scope.getByLabel('House, road and street address').fill(street);
}

async function gotoProduct(page: Page, slug: string) {
  const response = await page.goto(`/products/${slug}`);
  test.skip(
    response?.status() === 404,
    'demo catalogue is not seeded on this machine — run `npm run db:seed`',
  );
  expect(response?.status()).toBe(200);
}

/** Clears the cart before a test that needs to start from empty. */
async function clearCartStorage(page: Page) {
  await page.evaluate(() => window.localStorage.removeItem('renvura-cart-v1'));
}

test.describe('add to cart', () => {
  test('adds an available product and updates the header cart count', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();

    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await expect(page.getByText(/added .*to cart/i)).toBeVisible();

    const cartLink = page.getByRole('link', { name: /^Cart/ });
    await expect(cartLink).toBeVisible();
    await expect(cartLink.getByText('1')).toBeVisible();
  });

  test('quantity chosen on the product page is what gets added', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();

    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/cart');
    await expect(page.getByRole('group', { name: `Quantity for ${AVAILABLE.name}` }).getByText('3')).toBeVisible();
  });

  test('a Coming Soon product offers no Add to Cart or Buy Now control', async ({ page }) => {
    await gotoProduct(page, COMING_SOON_SLUG);

    await expect(page.getByRole('button', { name: 'Add to Cart' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Order via Cash on Delivery' })).toHaveCount(0);
  });
});

test.describe('cart page', () => {
  test('shows an honest empty state with no items', async ({ page }) => {
    await page.goto('/cart');
    await clearCartStorage(page);
    await page.reload();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse products' })).toBeVisible();
  });

  test('lists an added item with image, name, quantity and line total', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/cart');
    const list = page.getByRole('list', { name: 'Cart items' });
    await expect(list.getByText(AVAILABLE.name)).toBeVisible();
    await expect(list.getByText(AVAILABLE.price)).toBeVisible();
    await expect(page.getByText('Subtotal')).toBeVisible();
  });

  test('quantity controls update the line and the subtotal', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/cart');
    const quantityGroup = page.getByRole('group', { name: `Quantity for ${AVAILABLE.name}` });
    await quantityGroup.getByRole('button', { name: 'Increase quantity' }).click();

    await expect(quantityGroup.getByText('2')).toBeVisible();
    // 1,690 × 2 = 3,380 — both the subtotal and the line total move together.
    await expect(page.getByText('৳3,380').first()).toBeVisible();
  });

  test('remove takes the item out and returns to the empty state', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/cart');
    await page.getByRole('button', { name: `Remove ${AVAILABLE.name} from cart` }).click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test('persists across a full page reload', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/cart');
    await expect(page.getByRole('list', { name: 'Cart items' }).getByText(AVAILABLE.name)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('list', { name: 'Cart items' }).getByText(AVAILABLE.name)).toBeVisible();
  });

  test('"Empty cart" clears every line', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/cart');
    await page.getByRole('button', { name: 'Empty cart' }).click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });
});

test.describe('checkout page', () => {
  test('an empty cart cannot reach a checkout form', async ({ page }) => {
    await page.goto('/checkout');
    await clearCartStorage(page);
    await page.reload();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place order' })).toHaveCount(0);
  });

  test('with items, shows the order summary and an honest pre-address delivery state', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/checkout');

    await expect(page.getByRole('heading', { name: 'Order summary' })).toBeVisible();
    await expect(page.getByText(AVAILABLE.name).first()).toBeVisible();
    await expect(page.getByText('Payment: Cash on Delivery')).toBeVisible();

    // Delivery is priced from the shipping address, never guessed before one
    // is chosen (§4) — the Place order button stays disabled until then.
    await expect(page.getByText('Select your delivery location')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place order' })).toBeDisabled();
  });

  test('shows ৳80 once a Dhaka City address is chosen, and unlocks Place order', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/checkout');
    await fillAddress(page, DHAKA_CITY_ADDRESS);

    await expect(page.getByText('Select your delivery location')).toHaveCount(0);
    const summary = page.locator('dl').filter({ hasText: 'Delivery' });
    await expect(summary.getByText(DHAKA_CITY_DELIVERY)).toBeVisible();
    // Subtotal ৳1,690 + delivery ৳80 = ৳1,770.
    await expect(summary.getByText('৳1,770')).toBeVisible();

    // Place order is still disabled until name, phone and street are filled too.
    await expect(page.getByRole('button', { name: 'Place order' })).toBeDisabled();
    await page.getByLabel('Your name').fill('Test Customer');
    await page.getByLabel('Phone number').fill('01712345678');
    await page.getByLabel('House, road and street address').fill('House 12, Road 5');
    await expect(page.getByRole('button', { name: 'Place order' })).toBeEnabled();
  });

  test('shows ৳150 for an address outside Dhaka City', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/checkout');
    await fillAddress(page, OUTSIDE_DHAKA_CITY_ADDRESS);

    const summary = page.locator('dl').filter({ hasText: 'Delivery' });
    await expect(summary.getByText(STANDARD_DELIVERY)).toBeVisible();
    // Subtotal ৳1,690 + delivery ৳150 = ৳1,840.
    await expect(summary.getByText('৳1,840')).toBeVisible();
  });

  test('required fields are validated before submission is attempted', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/checkout');
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect(page.getByLabel('Phone number')).toBeVisible();
    await expect(page.getByLabel('Division')).toBeVisible();
    await expect(page.getByLabel('District')).toBeVisible();
    await expect(page.getByLabel('Upazila')).toBeVisible();
  });

  test('placing an order redirects to a confirmation page with the server-calculated totals', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/checkout');
    await page.getByLabel('Your name').fill('Test Customer');
    await page.getByLabel('Phone number').fill('01712345678');
    await fillFullAddress(page, DHAKA_CITY_ADDRESS, 'House 12, Road 5');

    await page.getByRole('button', { name: 'Place order' }).click();
    await page.waitForURL(/\/order\/confirm\/.+/);

    await expect(page.getByRole('heading', { name: 'Thank you — your order is placed.' })).toBeVisible();
    const items = page.getByRole('list', { name: 'Ordered items' });
    await expect(items.getByText(AVAILABLE.name)).toBeVisible();
    await expect(items.getByText('Qty 2')).toBeVisible();

    // Qty 2 × ৳1,690 = ৳3,380 subtotal; + ৳80 Dhaka City delivery = ৳3,460.
    const summary = page.locator('dl').filter({ hasText: 'Total' });
    await expect(summary.getByText('৳3,380')).toBeVisible();
    await expect(summary.getByText(DHAKA_CITY_DELIVERY)).toBeVisible();
    await expect(summary.getByText('৳3,460')).toBeVisible();
    await expect(page.getByText('Payment method: Cash on Delivery')).toBeVisible();
    await expect(page.getByText('Dhaka City')).toBeVisible();
  });
});

test.describe('shipping address — dependent Division → District → Upazila selects', () => {
  async function openCheckoutWithItem(page: Page) {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await page.goto('/checkout');
  }

  test('offers all 8 divisions, with district and upazila starting disabled', async ({ page }) => {
    await openCheckoutWithItem(page);

    const divisionOptions = await page.getByLabel('Division').locator('option').allTextContents();
    for (const name of [
      'Dhaka',
      'Chattogram',
      'Rajshahi',
      'Khulna',
      'Barishal',
      'Sylhet',
      'Rangpur',
      'Mymensingh',
    ]) {
      expect(divisionOptions, `missing division ${name}`).toContain(name);
    }

    await expect(page.getByLabel('District')).toBeDisabled();
    await expect(page.getByLabel('Upazila')).toBeDisabled();
  });

  test('shows helpful disabled placeholders before the parent is chosen', async ({ page }) => {
    await openCheckoutWithItem(page);

    await expect(page.getByLabel('District').locator('option').first()).toHaveText('Select division first');
    await expect(page.getByLabel('Upazila').locator('option').first()).toHaveText('Select district first');
  });

  test('selecting a division scopes the district list to it, and enables the field', async ({ page }) => {
    await openCheckoutWithItem(page);
    await page.getByLabel('Division').selectOption('Rangpur');

    const district = page.getByLabel('District');
    await expect(district).toBeEnabled();

    const districtNames = await district.locator('option').allTextContents();
    for (const name of [
      'Rangpur',
      'Dinajpur',
      'Gaibandha',
      'Kurigram',
      'Lalmonirhat',
      'Nilphamari',
      'Panchagarh',
      'Thakurgaon',
    ]) {
      expect(districtNames, `missing district ${name}`).toContain(name);
    }
    // A district from a different division must never leak into the list.
    expect(districtNames).not.toContain('Dhaka');
  });

  test('selecting a district scopes the upazila list to it, and enables the field', async ({ page }) => {
    await openCheckoutWithItem(page);
    await page.getByLabel('Division').selectOption('Rangpur');
    await page.getByLabel('District').selectOption('Gaibandha');

    const upazila = page.getByLabel('Upazila');
    await expect(upazila).toBeEnabled();

    const upazilaNames = await upazila.locator('option').allTextContents();
    for (const name of [
      'Gaibandha Sadar',
      'Gobindaganj',
      'Palashbari',
      'Sadullapur',
      'Sundarganj',
      'Saghata',
    ]) {
      expect(upazilaNames, `missing upazila ${name}`).toContain(name);
    }
    // An upazila from a different district must never leak into the list.
    expect(upazilaNames).not.toContain('Savar');
  });

  test('changing division clears the already-chosen district and upazila', async ({ page }) => {
    await openCheckoutWithItem(page);
    await page.getByLabel('Division').selectOption('Rangpur');
    await page.getByLabel('District').selectOption('Gaibandha');
    await page.getByLabel('Upazila').selectOption('Sundarganj');

    await page.getByLabel('Division').selectOption('Dhaka');

    await expect(page.getByLabel('District')).toHaveValue('');
    await expect(page.getByLabel('Upazila')).toHaveValue('');
    await expect(page.getByLabel('Upazila')).toBeDisabled();
  });

  test('changing district clears only the already-chosen upazila', async ({ page }) => {
    await openCheckoutWithItem(page);
    await page.getByLabel('Division').selectOption('Rangpur');
    await page.getByLabel('District').selectOption('Gaibandha');
    await page.getByLabel('Upazila').selectOption('Sundarganj');

    await page.getByLabel('District').selectOption('Kurigram');

    await expect(page.getByLabel('District')).toHaveValue('Kurigram');
    await expect(page.getByLabel('Upazila')).toHaveValue('');
    // Kurigram's own upazilas are offered — Sundarganj (Gaibandha's) is not
    // silently retained as a stale, mismatched selection (§4).
    const upazilaNames = await page.getByLabel('Upazila').locator('option').allTextContents();
    expect(upazilaNames).not.toContain('Sundarganj');
  });

  test('never shows the obsolete "Area, upazila or thana" label', async ({ page }) => {
    await openCheckoutWithItem(page);

    await expect(page.getByText('Area, upazila or thana')).toHaveCount(0);
    await expect(page.getByText(/area\s*\/\s*upazila\s*\/\s*thana/i)).toHaveCount(0);
    await expect(page.getByText('Upazila', { exact: true })).toBeVisible();
  });
});

test.describe('express COD (Buy Now)', () => {
  test('opens with the chosen product and quantity, and an honest pre-address delivery state', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);

    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await page.getByRole('button', { name: 'Order via Cash on Delivery' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(AVAILABLE.name)).toBeVisible();
    await expect(dialog.getByText('Qty 2')).toBeVisible();
    await expect(dialog.getByText('Select your delivery location')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Place order' })).toBeDisabled();
  });

  test('shows the same ৳80/৳150 fee CheckoutForm would show, once an address is chosen', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await page.getByRole('button', { name: 'Order via Cash on Delivery' }).click();

    const dialog = page.getByRole('dialog');
    await fillAddress(dialog, DHAKA_CITY_ADDRESS);
    await expect(dialog.getByText(DHAKA_CITY_DELIVERY)).toBeVisible();
    await expect(dialog.getByText('Total (COD)')).toBeVisible();
    // Single unit: ৳1,690 + ৳80 = ৳1,770.
    await expect(dialog.getByText('৳1,770')).toBeVisible();

    await dialog.getByLabel('Division').selectOption(OUTSIDE_DHAKA_CITY_ADDRESS.division);
    await dialog.getByLabel('District').selectOption(OUTSIDE_DHAKA_CITY_ADDRESS.district);
    await dialog.getByLabel('Upazila').selectOption(OUTSIDE_DHAKA_CITY_ADDRESS.upazila);
    await expect(dialog.getByText(STANDARD_DELIVERY)).toBeVisible();
    await expect(dialog.getByText('৳1,840')).toBeVisible();
  });

  test('placing an express order redirects to a confirmation page with the server-calculated totals', async ({
    page,
  }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Order via Cash on Delivery' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Your name').fill('Test Customer');
    await dialog.getByLabel('Phone number').fill('01712345678');
    await fillFullAddress(dialog, OUTSIDE_DHAKA_CITY_ADDRESS, 'House 4, Road 2');

    await dialog.getByRole('button', { name: 'Place order' }).click();
    await page.waitForURL(/\/order\/confirm\/.+/);

    await expect(page.getByRole('heading', { name: 'Thank you — your order is placed.' })).toBeVisible();
    const summary = page.locator('dl').filter({ hasText: 'Total' });
    await expect(summary.getByText(STANDARD_DELIVERY)).toBeVisible();
    // ৳1,690 + ৳150 = ৳1,840.
    await expect(summary.getByText('৳1,840')).toBeVisible();

    // Express COD never adds the product to the shared cart (§16).
    await page.goto('/cart');
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test('cancel closes the dialog without adding anything to the cart', async ({ page }) => {
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();

    await page.getByRole('button', { name: 'Order via Cash on Delivery' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.goto('/cart');
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });
});

test.describe('order tracking', () => {
  test('the bare form page renders', async ({ page }) => {
    // Not asserting indexability here: demo mode forces `noindex` site-wide
    // (D-08), so this posture cannot show `/track`'s real, registry-level
    // indexable status — `tests/unit/seo-metadata.test.ts` pins that instead.
    await page.goto('/track');
    await expect(page.getByRole('heading', { name: 'Track your order' })).toBeVisible();
  });

  test('requires both fields, and reports an unknown pairing generically', async ({ page }) => {
    await page.goto('/track');

    await page.getByLabel('Order number').fill('RV-000101-ZZZZZZ');
    await page.getByLabel('Phone number used for the order').fill('01712345678');
    await page.getByRole('button', { name: 'Track order' }).click();

    await expect(
      page.getByText(/we could not find an order matching that order number and phone/i),
    ).toBeVisible();
  });
});

test.describe('order confirmation', () => {
  test('an unknown order reference is a real 404, not a leaked "not found" page', async ({ page }) => {
    const response = await page.goto('/order/confirm/RV-000101-ZZZZZZ');
    expect(response?.status()).toBe(404);
  });
});

test.describe('SEO', () => {
  test('cart and checkout are noindex and excluded from the sitemap', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    await page.goto('/checkout');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    const sitemap = await page.request.get('/sitemap.xml');
    const body = await sitemap.text();
    expect(body).not.toContain('/cart<');
    expect(body).not.toContain('/checkout<');
  });
});

test.describe('security — /api/orders resists client manipulation and rejects invalid input', () => {
  test('rejects a Coming Soon product and an unknown product in the same request', async ({ page }) => {
    // One request, deliberately: `createOrder()` collects every item
    // rejection in a single pass (`tests/unit/checkout-pricing.test.ts`
    // covers that directly), so this single call is enough to pin both
    // rejection codes — and it keeps this security block's total call count
    // to `/api/orders` well inside the local rate-limit budget these tests
    // all share (`ORDER_RATE_LIMIT`, §12).
    const response = await page.request.post('/api/orders', {
      data: {
        customer: { name: 'Test Customer', phone: '01712345678' },
        shippingAddress: { division: 'Dhaka', district: 'Dhaka', upazila: 'Savar', street: 'House 1' },
        items: [
          { slug: COMING_SOON_SLUG, quantity: 1 },
          { slug: 'this-product-does-not-exist', quantity: 1 },
        ],
        idempotencyKey: crypto.randomUUID(),
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, code: 'itemsRejected' });
    expect(body.rejections).toEqual(
      expect.arrayContaining([
        { slug: COMING_SOON_SLUG, code: 'comingSoon' },
        { slug: 'this-product-does-not-exist', code: 'productNotFound' },
      ]),
    );
  });

  test('rejects an absurd quantity', async ({ page }) => {
    // Caught by the Zod shape itself (§22 "sane quantity limits") before it
    // ever reaches the catalogue-pricing rejection path — a request this
    // malformed never gets as far as a database read. The pricing layer's
    // own quantity check (unreachable from HTTP, since Zod already enforces
    // the identical bound) is covered directly in
    // `tests/unit/checkout-pricing.test.ts`.
    const response = await page.request.post('/api/orders', {
      data: {
        customer: { name: 'Test Customer', phone: '01712345678' },
        shippingAddress: { division: 'Dhaka', district: 'Dhaka', upazila: 'Savar', street: 'House 1' },
        items: [{ slug: AVAILABLE.slug, quantity: 999 }],
        idempotencyKey: crypto.randomUUID(),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('validation');
  });

  test('ignores every client-supplied price field — item price, delivery, subtotal, total and COD amount', async ({
    page,
  }) => {
    // One request combining every manipulation vector at once — item unit
    // price and every order-level total — is a strictly stronger proof than
    // two separate requests, and it keeps this file's total `/api/orders`
    // call count inside the shared local rate-limit budget (§12,
    // `ORDER_RATE_LIMIT`). Dhaka City address, so this also pins the ৳80
    // founder-approved rate against an injected ৳0.01 delivery charge.
    const response = await page.request.post('/api/orders', {
      data: {
        customer: { name: 'Test Customer', phone: '01712345678' },
        shippingAddress: { division: 'Dhaka', district: 'Dhaka', upazila: 'Dhaka City', street: 'House 1' },
        items: [{ slug: AVAILABLE.slug, quantity: 1, unitPriceMinor: 1, priceMinor: 1 }],
        // None of these are real order fields — a manipulated request trying
        // to smuggle its own totals in must have no effect at all (§3, §9).
        deliveryChargeMinor: 1,
        subtotalMinor: 1,
        totalMinor: 1,
        codAmountMinor: 1,
        idempotencyKey: crypto.randomUUID(),
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.ok).toBe(true);

    const confirmation = await page.goto(`/order/confirm/${body.orderNumber}`);
    expect(confirmation?.status()).toBe(200);
    // The real catalogue price, the real Dhaka City rate (৳80) and the real
    // computed total (৳1,770) — none of the injected ৳0.01 figures.
    const summary = page.locator('dl').filter({ hasText: 'Total' });
    await expect(summary.getByText(AVAILABLE.price)).toBeVisible();
    await expect(summary.getByText(DHAKA_CITY_DELIVERY)).toBeVisible();
    await expect(summary.getByText('৳1,770')).toBeVisible();
    await expect(page.getByText(/pay.*৳1,770.*when your order arrives/i)).toBeVisible();
  });

  test('rejects a real district paired with the wrong division', async ({ page }) => {
    // Gaibandha is a real district, but it belongs to Rangpur division —
    // pairing it with Dhaka must be rejected, not silently accepted (§6).
    const response = await page.request.post('/api/orders', {
      data: {
        customer: { name: 'Test Customer', phone: '01712345678' },
        shippingAddress: { division: 'Rangpur', district: 'Dhaka', upazila: 'Savar', street: 'House 1' },
        items: [{ slug: AVAILABLE.slug, quantity: 1 }],
        idempotencyKey: crypto.randomUUID(),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('validation');
    expect(body.fieldErrors).toMatchObject({ 'shippingAddress.district': 'districtInvalid' });
  });

  test('rejects a real upazila paired with the wrong district', async ({ page }) => {
    // Savar is a real upazila, but it belongs to Dhaka district — pairing it
    // with Gaibandha must be rejected (§6).
    const response = await page.request.post('/api/orders', {
      data: {
        customer: { name: 'Test Customer', phone: '01712345678' },
        shippingAddress: { division: 'Rangpur', district: 'Gaibandha', upazila: 'Savar', street: 'House 1' },
        items: [{ slug: AVAILABLE.slug, quantity: 1 }],
        idempotencyKey: crypto.randomUUID(),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('validation');
    expect(body.fieldErrors).toMatchObject({ 'shippingAddress.upazila': 'upazilaInvalid' });
  });

  test('rejects malformed input with a 400, not a 500', async ({ page }) => {
    const response = await page.request.post('/api/orders', {
      data: { customer: { name: '', phone: 'not-a-phone' }, items: [] },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('responsive — §27', () => {
  const urls = ['/cart', '/checkout', '/track'];

  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`never scrolls horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });

      await gotoProduct(page, AVAILABLE.slug);
      await clearCartStorage(page);
      await page.reload();
      await page.getByRole('button', { name: 'Add to Cart' }).click();

      for (const url of urls) {
        await page.goto(url);
        const overflows = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(overflows, `${url} scrolls horizontally at ${width}px`).toBe(false);
      }
    });
  }

  test('the mobile bottom bar never covers the checkout submit button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoProduct(page, AVAILABLE.slug);
    await clearCartStorage(page);
    await page.reload();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await page.goto('/checkout');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const overlap = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Primary mobile"]');
      const button = Array.from(document.querySelectorAll('button')).find((el) =>
        el.textContent?.includes('Place order'),
      );
      if (!bar || !button) return null;
      return button.getBoundingClientRect().bottom > bar.getBoundingClientRect().top;
    });

    expect(overlap).toBe(false);
  });

  test('quantity controls stay comfortable touch targets on a 360px phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoProduct(page, AVAILABLE.slug);

    const increase = page.getByRole('button', { name: 'Increase quantity' });
    const box = await increase.boundingBox();
    expect(box?.width, 'quantity button width').toBeGreaterThanOrEqual(44);
    expect(box?.height, 'quantity button height').toBeGreaterThanOrEqual(44);
  });
});
