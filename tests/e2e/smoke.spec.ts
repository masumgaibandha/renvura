import { expect, test } from '@playwright/test';

/**
 * Phase 1 smoke tests, run against a production build on a mobile viewport —
 * the primary device profile for this market.
 */

test('root redirects to the Bangla locale', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/bn$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
});

test('home renders server-side with brand, heading and footer contact', async ({ page }) => {
  const response = await page.goto('/bn');
  const html = (await response?.text()) ?? '';

  // §7.1: full HTML from the server, never a client-only shell.
  expect(html).toContain('শিশুর বিকাশে বিশেষজ্ঞের বাছাই');
  expect(html).toContain('01883-115898');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: '01883-115898' })).toHaveAttribute(
    'href',
    'tel:+8801883115898',
  );
  await expect(page.getByRole('link', { name: 'hello@renvura.com' })).toHaveAttribute(
    'href',
    'mailto:hello@renvura.com',
  );
});

test('English locale serves its own content and canonical', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('earns its place');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/en$/,
  );
});

test('every page carries canonical and hreflang alternates', async ({ page }) => {
  await page.goto('/bn/about');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/bn\/about$/);
  await expect(page.locator('link[rel="alternate"][hreflang="bn"]')).toHaveAttribute(
    'href',
    /\/bn\/about$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    /\/en\/about$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    'href',
    /\/bn\/about$/,
  );
});

test('language toggle switches locale and keeps the path', async ({ page }) => {
  // Started from /en because the toggle's accessible names are themselves
  // localised — on a Bangla page the label reads "বাংলায় দেখুন".
  await page.goto('/en/about');
  await page.getByRole('link', { name: 'Switch to Bangla' }).click();
  await expect(page).toHaveURL(/\/bn\/about$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
});

test('theme toggle switches and persists across reload', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveClass(/light/);

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('contact form validates before it submits', async ({ page }) => {
  await page.goto('/en/contact');

  await page.getByRole('button', { name: 'Send message' }).click();

  // Client-side validation blocks the request and shows an inline error.
  await expect(page.getByText('Please enter your name')).toBeVisible();

  await page.getByLabel('Your name').fill('A Parent');
  await page.getByLabel('Phone number').fill('12345');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Please enter a valid Bangladeshi mobile number')).toBeVisible();
});

test('pending policy pages render and are excluded from indexing', async ({ page }) => {
  await page.goto('/en/privacy');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy Policy');
  await expect(page.getByText('This policy is not published yet')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );
});

test('sitemap lists both locales and omits pending pages', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const xml = await response.text();
  expect(xml).toContain('/bn/about');
  expect(xml).toContain('/en/about');
  expect(xml).not.toContain('/privacy');
  expect(xml).not.toContain('/faq');
});

test('unknown routes render the branded 404', async ({ page }) => {
  const response = await page.goto('/en/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByText('This page could not be found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the homepage' })).toBeVisible();
});

test('mobile menu opens and navigates', async ({ page }) => {
  await page.goto('/en');

  await page.getByRole('button', { name: 'Open menu' }).click();
  // Scoped to the header: the footer carries a link with the same name.
  const menuLink = page
    .getByRole('banner')
    .getByRole('link', { name: 'About', exact: true });
  await expect(menuLink).toBeVisible();

  await menuLink.click();
  await expect(page).toHaveURL(/\/en\/about$/);
});
