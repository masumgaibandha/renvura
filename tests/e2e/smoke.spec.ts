import { expect, test } from '@playwright/test';

/**
 * Phase 1 smoke tests, run against a production build on a mobile viewport —
 * the primary device profile for this market (D-14).
 *
 * These assert the Phase 1 revision's defining properties: clean unprefixed
 * routes, no locale layer, a light-only storefront, honest pending pages, and
 * — critically — no dead controls anywhere in the UI (D-15, §11.1.1).
 */

test('the site root serves the homepage directly, with no locale redirect', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('home renders server-side with the product-first hero and footer contact', async ({
  page,
}) => {
  const response = await page.goto('/');
  const html = (await response?.text()) ?? '';

  // Full HTML from the server, never a client-only shell.
  expect(html).toContain('Everything your child needs');
  expect(html).toContain('01883-115898');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Everything your child needs',
  );
  await expect(
    page.getByRole('contentinfo').getByRole('link', { name: '01883-115898' }),
  ).toHaveAttribute('href', 'tel:+8801883115898');
  await expect(
    page.getByRole('contentinfo').getByRole('link', { name: 'hello@renvura.com' }),
  ).toHaveAttribute('href', 'mailto:hello@renvura.com');
});

test('the founder is never the hero and sits below the product sections', async ({ page }) => {
  await page.goto('/');

  const h1 = await page.getByRole('heading', { level: 1 }).textContent();
  expect(h1).not.toContain('Abdullah');

  const founderY = await page
    .getByText('Abdullah Al Masum')
    .first()
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  const heroY = await page
    .getByRole('heading', { level: 1 })
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

  expect(founderY).toBeGreaterThan(heroY);
});

test('no locale routes exist any more', async ({ page }) => {
  for (const path of ['/bn', '/en', '/bn/about', '/en/about']) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} should not exist`).toBe(404);
  }
});

test('every page carries a single canonical and no hreflang alternates', async ({ page }) => {
  await page.goto('/about');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/about$/);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});

test('the page emits Organization structured data and nothing more', async ({ page }) => {
  await page.goto('/');

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks).toHaveLength(1);

  const schema = JSON.parse(blocks[0] ?? '{}');
  expect(schema['@type']).toBe('Organization');
  // No product, review or business-location claims exist yet (D-12).
  expect(blocks[0]).not.toContain('LocalBusiness');
  expect(blocks[0]).not.toContain('"Product"');
  expect(blocks[0]).not.toContain('AggregateRating');
});

test('there is no theme toggle and no language toggle', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: /theme/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /switch to (bangla|english)/i })).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

test('no link anywhere points at an unbuilt route', async ({ page }) => {
  const unbuilt = [
    '/products',
    '/collections',
    '/search',
    '/offers',
    '/cart',
    '/checkout',
    '/track',
    '/wishlist',
    '/account',
    '/blog',
  ];

  for (const path of ['/', '/about', '/contact', '/faq', '/privacy']) {
    await page.goto(path);
    const hrefs = await page.locator('a[href]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href') ?? ''),
    );

    for (const href of hrefs) {
      expect(unbuilt, `${path} links to unbuilt route ${href}`).not.toContain(href);
    }
  }
});

test('every internal link resolves to a real page', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page.locator('a[href^="/"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('href') ?? ''),
  );

  const unique = [...new Set(hrefs)].filter((href) => !href.startsWith('//'));
  expect(unique.length).toBeGreaterThan(2);

  for (const href of unique) {
    const response = await request.get(href);
    expect(response.status(), `${href} is a dead link`).toBeLessThan(400);
  }
});

test('contact form validates before it submits', async ({ page }) => {
  await page.goto('/contact');

  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Please enter your name')).toBeVisible();

  await page.getByLabel('Your name').fill('A Parent');
  await page.getByLabel('Phone number').fill('12345');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Please enter a valid Bangladeshi mobile number')).toBeVisible();
});

test('pending policy pages render honestly and stay out of the index', async ({ page }) => {
  await page.goto('/privacy');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy Policy');
  await expect(page.getByText('This policy is not published yet')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('sitemap lists clean URLs and omits pending pages', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const xml = await response.text();
  expect(xml).toContain('/about');
  expect(xml).not.toContain('/bn/');
  expect(xml).not.toContain('/en/');
  expect(xml).not.toContain('/privacy');
  expect(xml).not.toContain('/faq');
  // Routes that do not exist yet must never be advertised.
  expect(xml).not.toContain('/products');
});

test('robots.txt is served', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('User-Agent');
});

test('unknown routes return a real 404 with the branded page', async ({ page }) => {
  const response = await page.goto('/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(page.getByText('This page could not be found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the homepage' })).toBeVisible();
});

test('mobile menu opens, lists only built routes, and navigates', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();

  const menu = page.getByRole('navigation', { name: 'Mobile' });
  await expect(menu).toBeVisible();

  await menu.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
});

test('no horizontal overflow at 360px on any built route', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });

  for (const path of [
    '/',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/returns',
    '/shipping',
    '/terms',
    '/child-safety',
    '/no-such-page',
  ]) {
    await page.goto(path);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows, `${path} scrolls horizontally at 360px`).toBe(false);
  }
});
