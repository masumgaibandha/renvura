import { expect, test, type Page } from '@playwright/test';

/**
 * Product detail, rendered — the `demo-preview` project only.
 *
 * These run against `VERCEL_ENV=preview DEMO_MODE=1`, the single configuration
 * in which the protected demo catalogue resolves. Everything asserted here is a
 * property of the page itself: layout order, gallery behaviour, price
 * semantics, honest absence of claims, and the containment rules that must hold
 * even where demo content *is* allowed to render (noindex, no structured data).
 *
 * Without a seeded database there is nothing to render, so each test skips with
 * a stated reason rather than failing for an unrelated cause.
 */

const PRODUCT = {
  slug: '7-in-1-wooden-montessori-learning-board',
  name: '7-in-1 Wooden Montessori Learning Board',
  price: '৳2,490',
  comparePrice: '৳2,990',
};

/** Navigates, or skips the test when the demo catalogue is not seeded. */
async function gotoProduct(page: Page, slug = PRODUCT.slug) {
  const response = await page.goto(`/products/${slug}`);
  test.skip(
    response?.status() === 404,
    'demo catalogue is not seeded on this machine — run `npm run db:seed`',
  );
  expect(response?.status()).toBe(200);
}

test('a seeded product resolves and leads with its name', async ({ page }) => {
  await gotoProduct(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(PRODUCT.name);
});

test('is labelled as demo content wherever it renders', async ({ page }) => {
  await gotoProduct(page);

  await expect(page.getByText('Demo product — not for sale')).toBeVisible();
});

test('shows the selling price first and the reference price struck through', async ({ page }) => {
  await gotoProduct(page);

  await expect(page.getByText(PRODUCT.price).first()).toBeVisible();

  // `<del>` carries "no longer applies" semantically, so the meaning survives
  // without colour or size.
  const del = page.locator('del').first();
  await expect(del).toContainText(PRODUCT.comparePrice);

  // …and it must genuinely be the higher number, not a decorative strike.
  const [now, was] = await page.evaluate(() => {
    const text = (node: Element | null) => Number((node?.textContent ?? '').replace(/[^\d]/g, ''));
    const del = document.querySelector('del');
    const row = del?.closest('p');
    const strong = row?.querySelector('span');
    return [text(strong ?? null), text(del)];
  });
  expect(was).toBeGreaterThan(now);
});

test('states no discount, saving, rating, stock or urgency', async ({ page }) => {
  await gotoProduct(page);

  for (const pattern of [
    /%\s*off/i,
    /save ৳/i,
    /^sale$/i,
    /limited offer/i,
    /hot deal/i,
    /only \d+ left/i,
    /in stock/i,
    /out of stock/i,
    /\d+ reviews?/i,
    /hurry/i,
  ]) {
    await expect(page.getByText(pattern), `${pattern} must not appear`).toHaveCount(0);
  }

  // No rating widget of any kind.
  await expect(page.locator('[role="img"][aria-label*="star" i]')).toHaveCount(0);
});

test('offers no fake purchase control, and no dead control of any kind', async ({ page }) => {
  await gotoProduct(page);

  await expect(page.getByRole('button', { name: /add to cart/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /buy now/i })).toHaveCount(0);
  await expect(page.locator('[aria-disabled="true"]')).toHaveCount(0);

  // The one action that genuinely works today.
  await expect(page.getByRole('link', { name: 'Ask about this product' })).toHaveAttribute(
    'href',
    '/contact',
  );
});

test('every link on the page resolves to a real route', async ({ page, request }) => {
  await gotoProduct(page);

  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''));

  for (const href of [...new Set(hrefs)]) {
    expect((await request.get(href)).status(), `${href} is a dead link`).toBeLessThan(400);
  }
});

test.describe('media gallery', () => {
  test('renders mapped media only, never a reference screenshot', async ({ page }) => {
    await gotoProduct(page);

    // Scoped to the gallery: the related rail legitimately shows other
    // products' media.
    const sources = await page
      .locator('img')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''));

    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) expect(src).not.toContain('reference-page');

    const gallery = await page
      .getByRole('list', { name: 'Product media' })
      .locator('img')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''));

    expect(gallery.length).toBeGreaterThan(0);
    for (const src of gallery) {
      // Gallery media comes from this product's staged directory and nowhere else.
      expect(decodeURIComponent(src)).toContain(`/demo-products/${PRODUCT.slug}/`);
    }
  });

  test('reserves the frame before images load, so nothing shifts', async ({ page }) => {
    await gotoProduct(page);

    const main = page.locator('img').first();
    await expect(main).toHaveAttribute('width', /\d+/);
    await expect(main).toHaveAttribute('height', /\d+/);
  });

  test('is keyboard operable and marks the selection non-visually', async ({ page }) => {
    await gotoProduct(page);

    const thumbs = page.getByRole('list', { name: 'Product media' }).getByRole('button');
    const count = await thumbs.count();
    test.skip(count < 2, 'product has a single media item');

    const second = thumbs.nth(1);
    await second.focus();
    await expect(second).toBeFocused();
    await second.press('Enter');

    // Selection is announced, not merely tinted.
    await expect(second).toHaveAttribute('aria-current', 'true');
    await expect(second.locator('.sr-only')).toContainText('(selected)');
  });

  test('gives every thumbnail a comfortable tap target', async ({ page }) => {
    await gotoProduct(page);

    const boxes = await page
      .getByRole('list', { name: 'Product media' })
      .getByRole('button')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));

    for (const width of boxes) expect(width).toBeGreaterThanOrEqual(44);
  });

  test('includes the mapped video, muted of autoplay and cheap to load', async ({ page }) => {
    await gotoProduct(page);

    const play = page
      .getByRole('list', { name: 'Product media' })
      .getByRole('button', { name: /video/i })
      .first();
    test.skip((await play.count()) === 0, 'product has no mapped video');

    await play.click();

    const video = page.locator('video');
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).not.toHaveAttribute('autoplay', /.*/);
    // Never playing on its own.
    expect(await video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  });
});

test.describe('product content', () => {
  test('renders no empty section headings', async ({ page }) => {
    await gotoProduct(page);

    const headings = page.getByRole('heading', { level: 2 });
    for (let index = 0; index < (await headings.count()); index += 1) {
      const text = (await headings.nth(index).textContent())?.trim() ?? '';
      expect(text.length, 'a section heading rendered with no label').toBeGreaterThan(0);
    }
  });

  test('gives the Bangla explanation a Bangla language attribute', async ({ page }) => {
    await gotoProduct(page);

    const bangla = page.locator('[lang="bn"]').first();
    test.skip((await bangla.count()) === 0, 'product has no Bangla description');

    await expect(bangla).toBeVisible();
    // The page itself stays English (D-02): only the Bangla run is marked.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('asserts no material, origin, age, safety, certification or warranty', async ({ page }) => {
    await gotoProduct(page);

    // Scoped to `main`: site chrome is not a product claim, and the header's
    // data-gated "Shop by Age" link is navigation, not a suitability statement.
    const main = page.getByRole('main');

    for (const pattern of [
      /\bnon-toxic\b/i,
      /\bBPA[- ]free\b/i,
      /\bCE certified\b/i,
      /\bfood[- ]grade\b/i,
      /\bmade in\b/i,
      /\bwarranty\b/i,
      /\bsuitable for ages?\b/i,
      /\b\d+\+?\s*(years?|months?)\s*(old|\+)/i,
    ]) {
      await expect(main.getByText(pattern), `${pattern} is an unverified claim`).toHaveCount(0);
    }
  });

  test('makes no age or safety claim about the battle cars', async ({ page }) => {
    // Its supplier evidence conflicts with the 0–12 brand target and the
    // question is unresolved, so the page must resolve it by saying nothing.
    await gotoProduct(page, 'interactive-rc-ejection-battle-cars');

    // Scoped to this product's own article. The related rail below it is
    // outside, and another product's founder-approved name containing
    // "Toddler" says nothing about these cars.
    const article = page.getByRole('article', { name: 'Interactive RC Ejection Battle Cars' });

    for (const pattern of [/\bages?\b/i, /\btoddler/i, /\bbaby\b/i, /\bsafe\b/i, /\bsafety\b/i]) {
      await expect(article.getByText(pattern), `${pattern} must not appear`).toHaveCount(0);
    }
  });
});

test.describe('containment and SEO', () => {
  test('stays out of the index even where demo content may render', async ({ page }) => {
    await gotoProduct(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('emits no Product or Offer structured data', async ({ page }) => {
    await gotoProduct(page);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    for (const block of blocks) {
      expect(block).not.toContain('"Product"');
      expect(block).not.toContain('"Offer"');
      expect(block).not.toContain('AggregateRating');
    }
  });

  test('carries a clean, locale-free canonical and social metadata', async ({ page }) => {
    await gotoProduct(page);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/products/${PRODUCT.slug}$`),
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  });

  test('is never advertised in the sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).not.toContain(PRODUCT.slug);
  });
});

test.describe('related products', () => {
  test('never lists the product you are already looking at', async ({ page }) => {
    await gotoProduct(page);

    const rail = page.getByRole('list', { name: 'Related products' });
    test.skip((await rail.count()) === 0, 'catalogue too small for a related rail');

    await expect(rail.getByRole('link', { name: PRODUCT.name })).toHaveCount(0);
    await expect(rail.locator('> li')).not.toHaveCount(0);
  });

  test('stays a short rail rather than a second full grid', async ({ page }) => {
    await gotoProduct(page);

    const rail = page.getByRole('list', { name: 'Related products' });
    test.skip((await rail.count()) === 0, 'catalogue too small for a related rail');

    expect(await rail.locator('> li').count()).toBeLessThanOrEqual(4);
  });
});

/**
 * Coming Soon products — founder-selected, deliberately unpriced.
 *
 * The whole point of the state is that nothing about it may be invented: no
 * price, no ৳0, no struck-through reference, no stock, no arrival date, no way
 * to order. These assert the absence, which is the part that actually matters.
 */
test.describe('coming soon', () => {
  const COMING_SOON = {
    slug: '10-row-wooden-abacus-and-math-learning-frame',
    name: '10-Row Wooden Abacus & Math Learning Frame',
  };

  test('has a real detail page with its media and copy', async ({ page }) => {
    await gotoProduct(page, COMING_SOON.slug);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COMING_SOON.name);
    await expect(page.getByRole('list', { name: 'Product media' }).locator('img')).not.toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'About this product' })).toBeVisible();
  });

  test('shows a Coming soon marker instead of a price', async ({ page }) => {
    await gotoProduct(page, COMING_SOON.slug);

    const article = page.getByRole('article', { name: COMING_SOON.name });
    await expect(article.getByText(/^coming soon$/i)).toBeVisible();
  });

  test('renders no price, no ৳0 and no struck-through reference', async ({ page }) => {
    await gotoProduct(page, COMING_SOON.slug);

    const article = page.getByRole('article', { name: COMING_SOON.name });
    await expect(article.getByText(/৳/)).toHaveCount(0);
    await expect(article.locator('del')).toHaveCount(0);
    await expect(article.getByText(/৳\s*0\b/)).toHaveCount(0);
  });

  test('offers no way to order it, and no dead control', async ({ page }) => {
    await gotoProduct(page, COMING_SOON.slug);

    await expect(page.getByRole('button', { name: /add to cart/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /buy now/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /notify|pre-?order|reserve/i })).toHaveCount(0);
    await expect(page.locator('[aria-disabled="true"]')).toHaveCount(0);

    // The one action that works is the same honest one every product has.
    await expect(page.getByRole('link', { name: 'Ask about this product' })).toHaveAttribute(
      'href',
      '/contact',
    );
  });

  test('promises no arrival date, stock or rating', async ({ page }) => {
    await gotoProduct(page, COMING_SOON.slug);

    const article = page.getByRole('article', { name: COMING_SOON.name });
    for (const pattern of [
      /in stock/i,
      /out of stock/i,
      /pre-?order/i,
      /waiting list/i,
      /available (from|on) /i,
      /\d+ reviews?/i,
      /%\s*off/i,
    ]) {
      await expect(article.getByText(pattern), `${pattern} must not appear`).toHaveCount(0);
    }
  });

  test('emits no Product or Offer schema and stays out of the index', async ({ page }) => {
    await gotoProduct(page, COMING_SOON.slug);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    for (const block of blocks) expect(block).not.toContain('"Product"');
  });
});

/**
 * Waits for the shop grid, or skips when the demo catalogue is not seeded.
 *
 * `/products` is server-rendered per request and sits behind a loading
 * skeleton, so the grid arrives after the shell — an immediate `count()` races
 * it and reads zero.
 */
async function shopGrid(page: Page) {
  const grid = page.getByRole('list', { name: 'All products' });
  const seeded = await grid.waitFor({ state: 'attached', timeout: 15_000 }).then(
    () => true,
    () => false,
  );

  test.skip(!seeded, 'demo catalogue is not seeded on this machine — run `npm run db:seed`');
  return grid;
}

test.describe('the shop grid', () => {
  test('holds all eleven products in one continuous grid', async ({ page }) => {
    const response = await page.goto('/products');
    test.skip(response?.status() !== 200, 'shop unavailable');

    const grid = await shopGrid(page);
    await expect(grid.locator('> li')).toHaveCount(11);
  });

  test('leads with the priced products and never shows ৳0', async ({ page }) => {
    const response = await page.goto('/products');
    test.skip(response?.status() !== 200, 'shop unavailable');

    const grid = await shopGrid(page);

    const cards = grid.locator('> li');
    await expect(cards).toHaveCount(11);

    // The first five carry a price; the last six carry the Coming soon marker.
    for (let index = 0; index < 5; index += 1) {
      await expect(cards.nth(index).getByText(/৳/).first()).toBeVisible();
    }
    for (let index = 5; index < 11; index += 1) {
      await expect(cards.nth(index).getByText(/^coming soon$/i)).toBeVisible();
      await expect(cards.nth(index).getByText(/৳/)).toHaveCount(0);
    }

    await expect(page.getByText(/৳\s*0\b/)).toHaveCount(0);
  });

  test('has no horizontal overflow with eleven mixed cards', async ({ page }) => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto('/products');
      test.skip(response?.status() !== 200, 'shop unavailable');

      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows, `/products scrolls horizontally at ${width}px`).toBe(false);
    }
  });
});

test.describe('layout', () => {
  test('orders the mobile page media → title → price → summary → details', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoProduct(page);

    // Scoped to `main` so "the first image" is the gallery, not the header logo.
    const top = (selector: string) =>
      page
        .getByRole('main')
        .locator(selector)
        .first()
        .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

    const image = await top('img');
    const heading = await top('h1');
    const price = await top('del');
    const details = await top('h2');

    expect(image, 'media leads the mobile page').toBeLessThan(heading);
    expect(heading, 'the name precedes the price').toBeLessThan(price);
    expect(price, 'details follow the price').toBeLessThan(details);
  });

  test('does not scroll horizontally at any supported width', async ({ page }) => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoProduct(page);

      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows, `product detail scrolls horizontally at ${width}px`).toBe(false);
    }
  });

  test('keeps the fixed bottom bar clear of the end of the page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoProduct(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const overlap = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Primary mobile"]');
      const footer = document.querySelector('footer');
      if (!bar || !footer) return null;

      return footer.getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 1;
    });

    expect(overlap).toBe(false);
  });

  /**
   * Product cards are links again (Phase 2D), and clicking one must land on
   * that product.
   *
   * Exercised through the related rail rather than `/products`: the shop page
   * is statically prerendered, so in this local setup — a production build
   * started with preview env — it holds the empty state baked in at build time.
   * On a real Vercel preview the build itself runs with `VERCEL_ENV=preview`
   * and the shop renders products. The related rail is server-rendered per
   * request, so it reflects runtime configuration and tests the same behaviour
   * without that caveat.
   */
  test('a product card is a working link to that product', async ({ page }) => {
    await gotoProduct(page);

    const rail = page.getByRole('list', { name: 'Related products' });
    test.skip((await rail.count()) === 0, 'catalogue too small for a related rail');

    const card = rail.getByRole('link').first();
    const href = await card.getAttribute('href');
    expect(href).toMatch(/^\/products\/[a-z0-9-]+$/);

    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(PRODUCT.name);
  });
});
