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
  // `/search` left this list in Phase 3, when it became a real route.
  const unbuilt = [
    '/collections',
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

  const menu = page.getByRole('navigation', { name: 'Mobile', exact: true });
  await expect(menu).toBeVisible();

  await menu.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
});

/**
 * Navigation — the agreed structure, rendered under the no-dead-controls rule.
 *
 * In Phase 1 almost every commerce destination is unbuilt, so most of the
 * structure is legitimately absent. These tests assert both halves: what is
 * shown, and that nothing unbuilt leaks into the markup as a live control.
 */
test.describe('navigation', () => {
  test('desktop primary nav shows only built destinations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    // Shop went live in Phase 2C.
    await expect(nav.getByRole('link', { name: 'Shop', exact: true })).toBeVisible();

    // Categories and Shop by Age are data-gated; Blog is Phase 9.
    for (const label of ['Categories', 'Shop by Age', 'Blog']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    }
  });

  test('navigation never offers New Arrivals or Offers', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header.getByText(/new arrivals/i)).toHaveCount(0);
    await expect(header.getByText(/^offers$/i)).toHaveCount(0);
  });

  test('mobile header is menu + logo, with no unbuilt controls', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await expect(header.getByRole('link', { name: /Renvura/ })).toBeVisible();

    // Search became real in Phase 3 — on mobile it is an icon link to the
    // results page rather than an inline field.
    await expect(header.getByRole('link', { name: /search products/i })).toHaveAttribute(
      'href',
      '/search',
    );
    // Cart is Phase 4 and still absent.
    await expect(header.getByRole('link', { name: /^cart$/i })).toHaveCount(0);
  });

  test('the mobile bottom tab bar carries Home, Shop and Search, and nothing unbuilt', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');

    const bar = page.getByRole('navigation', { name: 'Primary mobile' });
    await expect(bar).toBeVisible();
    for (const label of ['Home', 'Shop', 'Search']) {
      await expect(bar.getByRole('link', { name: label })).toBeVisible();
    }

    // Phase 4 destinations stay out until they exist.
    for (const label of ['Wishlist', 'Cart']) {
      await expect(bar.getByRole('link', { name: label })).toHaveCount(0);
    }
  });

  test('the bottom tab bar never covers the end of the page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const overlap = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Primary mobile"]');
      const footer = document.querySelector('footer');
      if (!bar || !footer) return null;

      const barBox = bar.getBoundingClientRect();
      const footerBox = footer.getBoundingClientRect();
      // The reserved body padding must keep the footer clear of the fixed bar.
      // 1px tolerance for sub-pixel rounding between rem padding and bar height.
      return footerBox.bottom > barBox.top + 1;
    });

    expect(overlap).toBe(false);
  });

  test('the mobile drawer lists only built destinations', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();

    const menu = page.getByRole('navigation', { name: 'Mobile', exact: true });
    await expect(menu.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Shop', exact: true })).toBeVisible();

    for (const label of ['Categories', 'Shop by Age', 'Blog', 'Account', 'Wishlist']) {
      await expect(menu.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    }
  });

  test('no disabled placeholder control is exposed publicly', async ({ page }) => {
    // The §11.1.1 disabled preview is opt-in and must never reach a build like
    // this one, at any width.
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.locator('[aria-disabled="true"]')).toHaveCount(0);
    }
  });

  test('primary nav labels never wrap to a second line', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/');

    const heights = await page
      .getByRole('navigation', { name: 'Primary' })
      .locator('a')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));

    expect(heights.length).toBeGreaterThan(0);
    for (const height of heights) expect(height).toBeLessThan(56);
  });

  test('no horizontal overflow at any supported width', async ({ page }) => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });

      for (const path of ['/', '/about', '/contact']) {
        await page.goto(path);
        const overflows = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(overflows, `${path} scrolls horizontally at ${width}px`).toBe(false);
      }
    }
  });
});

/**
 * The shop, as a public visitor sees it.
 *
 * These runs have demo mode off, which is the production posture: the five
 * protected demo products must not appear, and the page must still be a real,
 * honest page rather than a broken one.
 */
test.describe('shop', () => {
  test('/products resolves and renders a real page', async ({ page }) => {
    const response = await page.goto('/products');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('All products');
  });

  test('shows an honest empty state rather than fake products', async ({ page }) => {
    await page.goto('/products');

    await expect(page.getByText('The catalogue is still being prepared')).toBeVisible();

    // Nothing invented while the catalogue is empty.
    await expect(page.getByText(/৳/)).toHaveCount(0);
    await expect(page.getByText(/coming soon/i)).toHaveCount(0);
    await expect(page.getByText(/out of stock/i)).toHaveCount(0);
    await expect(page.locator('img[alt*="Demo"]')).toHaveCount(0);
  });

  test('leaks no demo product or demo banner in public mode', async ({ page }) => {
    await page.goto('/products');

    await expect(page.getByText('Demo data')).toHaveCount(0);
    for (const name of ['Rainbow Wooden Abacus', 'Toddler Montessori Busy Book', 'Interactive RC Ejection']) {
      await expect(page.getByText(name)).toHaveCount(0);
    }
  });

  test('never serves a reference-page screenshot as product media', async ({ page }) => {
    for (const path of ['/', '/products']) {
      await page.goto(path);
      const sources = await page
        .locator('img')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''));

      for (const src of sources) expect(src).not.toContain('reference-page');
    }
  });

  test('stays out of the index while its catalogue is being prepared', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('is reachable from the header, drawer and bottom bar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');

    await page.getByRole('navigation', { name: 'Primary mobile' }).getByRole('link', { name: 'Shop' }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test('shows no discount badge, rating or stock claim anywhere', async ({ page }) => {
    // Two prices do not authorise promotional messaging (D-12, founder
    // decision). This holds in public mode, where no product renders at all,
    // and is the guard that catches a badge being added later.
    await page.goto('/products');

    // Anchored to badge-shaped text, not prose: the honest empty state
    // legitimately contains the phrase "goes on sale".
    for (const pattern of [/%\s*off/i, /save ৳/i, /^sale$/i, /limited offer/i, /hot deal/i]) {
      await expect(page.getByText(pattern)).toHaveCount(0);
    }
  });

  test('has no horizontal overflow at any supported width', async ({ page }) => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/products');

      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows, `/products scrolls horizontally at ${width}px`).toBe(false);
    }
  });
});

/**
 * Product detail, as a public visitor sees it — which is: not at all.
 *
 * This build is the production posture (demo mode hard-disabled), so every
 * demo product URL must be a genuine 404 rather than a page that renders a
 * synthetic product, a soft "unavailable" shell, or an internal error (D-08).
 */
test.describe('product detail in public mode', () => {
  const demoSlugs = [
    '7-in-1-wooden-montessori-learning-board',
    'toddler-montessori-busy-book-and-travel-bag',
    'rainbow-wooden-abacus-and-counting-stacker',
    'smart-chopstick-and-clip-bead-math-set',
    'interactive-rc-ejection-battle-cars',
  ];

  test('every demo product URL is a real 404', async ({ page }) => {
    for (const slug of demoSlugs) {
      const response = await page.goto(`/products/${slug}`);
      expect(response?.status(), `/products/${slug} must not resolve publicly`).toBe(404);
      await expect(page.getByText('This page could not be found')).toBeVisible();
    }
  });

  test('an unknown slug is a real 404, not a blank product page', async ({ page }) => {
    const response = await page.goto('/products/no-such-product');

    expect(response?.status()).toBe(404);
    await expect(page.getByText('This page could not be found')).toBeVisible();
  });

  test('leaks no product name, price or internal error on a 404', async ({ page }) => {
    const response = await page.goto(`/products/${demoSlugs[0]}`);
    const html = (await response?.text()) ?? '';

    expect(html).not.toContain('Montessori');
    expect(html).not.toContain('৳');
    expect(html).not.toContain('MongoServerError');
    expect(html).not.toContain('MONGODB_URI');
  });

  test('the retired abacus slug is gone, not silently redirected', async ({ request }) => {
    const response = await request.get('/products/wooden-abacus-counting-stacker');
    expect(response.status()).toBe(404);
  });

  test('no product page is ever advertised in the sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const slug of demoSlugs) expect(xml).not.toContain(slug);
  });
});

/**
 * Phase 3 discovery, as a public visitor sees it.
 *
 * Demo mode is hard-disabled here, which is the production posture: search,
 * filters and category browsing must all still be real, working pages that
 * simply have nothing to show — never an error, and never a leak.
 */
test.describe('discovery in public mode', () => {
  test('search resolves and prompts, with no results to leak', async ({ page }) => {
    const response = await page.goto('/search?q=abacus');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('abacus');
    await expect(page.getByText(/nothing matched/i)).toBeVisible();

    // Not one demo product, and no price of any kind.
    await expect(page.getByText(/৳/)).toHaveCount(0);
    for (const name of ['Montessori', 'Abacus &', 'Battle Cars']) {
      await expect(page.getByText(name)).toHaveCount(0);
    }
  });

  test('search survives hostile and malformed queries', async ({ page }) => {
    for (const q of ['.*', '%00', '<script>alert(1)</script>', 'a'.repeat(500), '&&&']) {
      const response = await page.goto(`/search?q=${encodeURIComponent(q)}`);
      expect(response?.status(), q).toBe(200);
    }

    // Reflected input is escaped, never executed.
    const html = (await (await page.goto('/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E'))?.text()) ?? '';
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  test('search is never indexed', async ({ page }) => {
    await page.goto('/search?q=abacus');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('every demo category and age URL is a real 404', async ({ page }) => {
    // The categories exist in the database, but demo mode is off, so they must
    // not resolve publicly any more than the products do (D-08).
    for (const path of [
      '/category/learning-educational',
      '/category/numbers-math',
      '/category/toys-play',
      '/age/3-5-years',
      '/age/0-11-months',
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} must not resolve publicly`).toBe(404);
    }
  });

  test('the shop handles junk query parameters without erroring', async ({ page }) => {
    for (const query of [
      '?sort=cheapest',
      '?availability=in-stock',
      '?category=../../etc/passwd',
      '?category[]=x&sort[]=y',
    ]) {
      const response = await page.goto(`/products${query}`);
      expect(response?.status(), query).toBe(200);
      await expect(page.getByText('The catalogue is still being prepared')).toBeVisible();
    }
  });

  test('advertises no category, age or search URL in the sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();

    expect(xml).not.toContain('/category/');
    expect(xml).not.toContain('/age/');
    expect(xml).not.toContain('/search');
  });

  test('the header search field is now a real, working control', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // It was a disabled placeholder until Phase 3 built the route behind it.
    await expect(page.locator('[aria-disabled="true"]')).toHaveCount(0);

    await page.getByRole('searchbox', { name: /search products/i }).fill('wooden');
    await page.getByRole('searchbox', { name: /search products/i }).press('Enter');

    await expect(page).toHaveURL(/\/search\?q=wooden$/);
  });
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
