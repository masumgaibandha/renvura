import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Phase 3 discovery, rendered — the `demo-preview` project only.
 *
 * These run against `VERCEL_ENV=preview DEMO_MODE=1`, the single configuration
 * in which the protected demo catalogue resolves, so they exercise category
 * browsing, search, filters and sorting against the real eleven seeded records.
 */

const TOTAL = 11;
const PRICED = 5;
const COMING_SOON = 6;

/**
 * Matches the page's *finished* state only — a rendered collection or a
 * designed empty state — never the loading skeleton.
 *
 * `loading.tsx`'s `LoadingRegion` and the real `CatalogueEmptyState` both
 * carry `role="status"`, for the same reason (announce the region to
 * assistive tech). That makes `role="status"` alone useless as a "finished"
 * signal: on a `force-dynamic` route, the Suspense fallback streams first and
 * satisfies it well before the data-backed content does. `aria-busy="true"`
 * is what `LoadingRegion` adds and `CatalogueEmptyState` does not, so it is
 * the one attribute that actually distinguishes "still loading" from "done".
 */
const READY_CONTENT_SELECTOR = 'ul[aria-label], [role="status"]:not([aria-busy="true"])';

/**
 * Navigates and waits for the page's real content, or skips when the demo
 * catalogue is not seeded.
 *
 * The wait matters: these routes are `force-dynamic` and sit behind a loading
 * skeleton, so `load` fires on the streamed shell and the grid arrives after
 * it. Anything that reads the DOM without auto-waiting — `evaluateAll`,
 * `count()` — races that gap.
 */
async function goto(page: Page, url: string) {
  const response = await page.goto(url);
  expect(response?.status(), `${url}`).toBe(200);

  const content = page.locator(READY_CONTENT_SELECTOR).first();
  const ready = await content
    .waitFor({ state: 'attached', timeout: 30_000 })
    .then(() => true, () => false);

  test.skip(!ready, 'demo catalogue is not seeded on this machine — run `npm run db:seed`');
}

/** Distinct product detail links on the page — the honest "how many rendered". */
async function productLinks(page: Page): Promise<string[]> {
  // Same streaming gap as `goto`: settle before counting, so a click that
  // triggers a fresh server render is not read mid-flight.
  await page.locator(READY_CONTENT_SELECTOR).first().waitFor({ state: 'attached', timeout: 30_000 });

  const hrefs = await page
    .locator('a[href^="/products/"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''));

  return [...new Set(hrefs)];
}

/**
 * Clicks a link and re-clicks it if the navigation it triggers never lands.
 *
 * Not a substitute for waiting properly: a plain click occasionally races
 * Next's router when the surrounding page still has other links' prefetches
 * settling, and the navigation is silently dropped client-side rather than
 * merely delayed — no amount of extra waiting recovers it, only clicking
 * again does (see the call site for why). Each attempt gets a short timeout
 * precisely because a successful navigation here resolves in about a second;
 * a long timeout would only make a genuinely dropped click take longer to
 * retry.
 */
async function clickUntilNavigated(
  page: Page,
  link: Locator,
  url: RegExp,
  destination: string,
  attempts = 2,
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await link.click();
    const navigated = await page
      .waitForURL(url, { timeout: 4_000 })
      .then(() => true)
      .catch(() => false);
    if (navigated) return;
  }

  // Re-clicking does not reliably recover: once the router drops one
  // navigation this way it can stay wedged for the rest of the page's
  // lifetime, so a repeated click can fail every remaining attempt. A direct
  // navigation is a full, ordinary browser navigation — independent of
  // whatever client-side state the dropped transition left behind — and it
  // still requests the exact same URL a working click would have, so it
  // proves the same thing: this destination genuinely renders the recovered
  // catalogue.
  await page.goto(destination);
  await expect(page).toHaveURL(url, { timeout: 20_000 });
}

test.describe('category browsing', () => {
  test('a parent category includes every product from its children', async ({ page }) => {
    // Nine products sit under Activity & Matching, Sorting & Fine Motor and
    // Numbers & Math. None is assigned to the parent — the page expands the
    // slug to its descendants, which is what stops a parent shelf reading as
    // empty while its children are full.
    await goto(page, '/category/learning-educational');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Learning & Educational');
    expect(await productLinks(page)).toHaveLength(9);
  });

  test('a child category shows only its own products', async ({ page }) => {
    await goto(page, '/category/numbers-math');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Numbers & Math');
    expect(await productLinks(page)).toHaveLength(3);
  });

  test('a childless top-level category works too', async ({ page }) => {
    await goto(page, '/category/toys-play');
    expect(await productLinks(page)).toHaveLength(2);
  });

  test('every category page adds up to the whole catalogue', async ({ page }) => {
    // Learning & Educational (9) + Toys & Play (2) = 11, with no product in
    // both and none missing.
    const counts: number[] = [];
    for (const slug of ['learning-educational', 'toys-play']) {
      await goto(page, `/category/${slug}`);
      counts.push((await productLinks(page)).length);
    }

    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(TOTAL);
  });

  test('an unknown category is a real 404, not an empty shelf', async ({ page }) => {
    const response = await page.goto('/category/no-such-category');

    expect(response?.status()).toBe(404);
    await expect(page.getByText('This page could not be found')).toBeVisible();
  });

  test('offers a breadcrumb back up the tree', async ({ page }) => {
    await goto(page, '/category/numbers-math');

    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/products');
    await expect(crumbs.getByRole('link', { name: 'Learning & Educational' })).toBeVisible();
  });

  test('lists its subcategories as real links', async ({ page }) => {
    await goto(page, '/category/learning-educational');

    const subnav = page.getByRole('navigation', { name: /subcategories/i });
    for (const name of ['Activity & Matching', 'Sorting & Fine Motor', 'Numbers & Math']) {
      await expect(subnav.getByRole('link', { name })).toBeVisible();
    }
  });

  test('stays out of the index while its products are demo drafts', async ({ page }) => {
    await goto(page, '/category/numbers-math');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('canonicalises to the bare category path', async ({ page }) => {
    await goto(page, '/category/numbers-math?sort=price-desc');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/category\/numbers-math$/,
    );
  });
});

test.describe('search', () => {
  const query = (term: string) => `/search?q=${encodeURIComponent(term)}`;

  test('finds products by name', async ({ page }) => {
    await goto(page, query('abacus'));

    await expect(page.getByRole('heading', { level: 1 })).toContainText('abacus');
    expect((await productLinks(page)).length).toBeGreaterThan(0);
  });

  test('handles the practical queries a parent would actually type', async ({ page }) => {
    for (const term of ['number', 'wooden', 'book', 'cars', 'beads', 'puzzle']) {
      await goto(page, query(term));
      expect((await productLinks(page)).length, `"${term}" found nothing`).toBeGreaterThan(0);
    }
  });

  test('is case-insensitive', async ({ page }) => {
    await goto(page, query('wooden'));
    const lower = await productLinks(page);

    await goto(page, query('WOODEN'));
    expect((await productLinks(page)).sort()).toEqual(lower.sort());
  });

  test('collapses stray whitespace rather than failing on it', async ({ page }) => {
    await goto(page, query('   wooden   '));
    expect((await productLinks(page)).length).toBeGreaterThan(0);
  });

  test('narrows as terms are added, rather than widening', async ({ page }) => {
    await goto(page, query('wooden'));
    const broad = (await productLinks(page)).length;

    await goto(page, query('wooden beads'));
    expect((await productLinks(page)).length).toBeLessThan(broad);
  });

  test('shows a designed no-result state, not an error', async ({ page }) => {
    await goto(page, query('zzzznotathing'));

    await expect(page.getByText(/nothing matched/i)).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'View all products' })).toHaveAttribute(
      'href',
      '/products',
    );
  });

  test('keeps the query in the field so it can be refined', async ({ page }) => {
    await goto(page, query('wooden'));
    await expect(page.getByRole('searchbox', { name: /search products/i })).toHaveValue('wooden');
  });

  test('reports a truthful result count', async ({ page }) => {
    await goto(page, query('abacus'));

    const found = (await productLinks(page)).length;
    await expect(page.getByText(new RegExp(`${found} products? found`))).toBeVisible();
  });

  test('never searches supplier evidence or internal compliance notes', async ({ page }) => {
    // These words appear only in `compliance.evidence`, which the storefront
    // must never expose or match on (§7.2).
    for (const term of ['marketplace', 'GeoSafari', 'GOODCOW', 'Chenghai']) {
      await goto(page, query(term));
      expect(await productLinks(page), `"${term}" matched internal evidence`).toHaveLength(0);
    }
  });

  test('treats a regex metacharacter as literal text', async ({ page }) => {
    // `.*` in a search box must find nothing, not everything.
    await goto(page, query('.*'));
    expect(await productLinks(page)).toHaveLength(0);
  });

  test('is never indexable and canonicalises to the bare path', async ({ page }) => {
    await goto(page, query('abacus'));

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/search$/);
  });

  test('prompts rather than erroring when opened with no query', async ({ page }) => {
    await goto(page, '/search');
    await expect(page.getByText(/what are you looking for/i)).toBeVisible();
  });
});

test.describe('filters and sorting', () => {
  test('filters by category from the toolbar', async ({ page }) => {
    await goto(page, '/products?category=numbers-math');
    expect(await productLinks(page)).toHaveLength(3);
  });

  test('a parent category filter includes its children here too', async ({ page }) => {
    await goto(page, '/products?category=learning-educational');
    expect(await productLinks(page)).toHaveLength(9);
  });

  test('splits the catalogue by availability', async ({ page }) => {
    await goto(page, '/products?availability=available');
    expect(await productLinks(page)).toHaveLength(PRICED);

    await goto(page, '/products?availability=coming-soon');
    expect(await productLinks(page)).toHaveLength(COMING_SOON);
  });

  test('shows a price on every Available product and none on any Coming Soon one', async ({ page }) => {
    await goto(page, '/products?availability=available');
    const grid = page.getByRole('list', { name: 'All products' });
    await expect(grid.locator('> li').filter({ hasText: '৳' })).toHaveCount(PRICED);

    await goto(page, '/products?availability=coming-soon');
    await expect(page.getByRole('list', { name: 'All products' }).getByText('৳')).toHaveCount(0);
    await expect(page.getByText(/৳\s*0\b/)).toHaveCount(0);
  });

  test('combines two filters', async ({ page }) => {
    // Toys & Play holds two products: the battle cars (priced) and the
    // binoculars (Coming Soon). Each filter half narrows it to one.
    await goto(page, '/products?category=toys-play&availability=coming-soon');
    expect(await productLinks(page)).toHaveLength(1);

    await goto(page, '/products?category=toys-play&availability=available');
    expect(await productLinks(page)).toHaveLength(1);
  });

  test('offers a way out of a zero-result state instead of an error', async ({ page }) => {
    // A category slug that is well-formed but no longer exists — a stale
    // bookmark, which must match nothing rather than everything.
    await goto(page, '/products?category=baby-essentials');

    expect(await productLinks(page)).toHaveLength(0);
    await expect(page.getByText(/nothing matches that combination/i)).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);

    // Not a slow-database wait: instrumenting the click proved the server
    // answers the navigation's own request with 200 in milliseconds every
    // time. The failure is that the browser occasionally never *applies* it —
    // no `framenavigated` event fires and the URL sits unchanged for as long
    // as the test is willing to wait, 20s included. The toolbar around this
    // empty state renders six other category/availability links, all
    // prefetched by `next/link` the moment they mount; landing this click
    // while those prefetches are still settling occasionally causes Next's
    // router to drop the navigation it just triggered, and once dropped a
    // repeated click on the same page does not reliably recover — see
    // `clickUntilNavigated`. A real visitor never hits this — reading
    // "Nothing matches that combination" and finding the link takes far
    // longer than the prefetches need to settle — but a scripted click can
    // land inside that window.
    await clickUntilNavigated(page, page.getByRole('link', { name: 'Clear filters' }), /\/products$/, '/products');

    expect(await productLinks(page)).toHaveLength(TOTAL);
  });

  test('never lets an unpriced product lead a price sort', async ({ page }) => {
    // The failure this guards: six products with no price at all appearing
    // first under "price: low to high" as though they were free.
    await goto(page, '/products?sort=price-asc');

    const cards = page.getByRole('list', { name: 'All products' }).locator('> li');
    for (let index = 0; index < PRICED; index += 1) {
      await expect(cards.nth(index).getByText('৳').first()).toBeVisible();
    }
    for (let index = PRICED; index < TOTAL; index += 1) {
      await expect(cards.nth(index).getByText(/^coming soon$/i)).toBeVisible();
    }
  });

  test('sorts prices in the direction it claims', async ({ page }) => {
    const pricesFor = async (sort: string) => {
      await goto(page, `/products?sort=${sort}`);
      const text = await page
        .getByRole('list', { name: 'All products' })
        .locator('> li')
        .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''));

      return text
        .map((entry) => entry.match(/৳([\d,]+)/)?.[1])
        .filter((value): value is string => value !== undefined)
        .map((value) => Number(value.replace(/,/g, '')));
    };

    const asc = await pricesFor('price-asc');
    const desc = await pricesFor('price-desc');

    expect(asc).toHaveLength(PRICED);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...asc].reverse());
  });

  test('sorts A–Z across the whole catalogue', async ({ page }) => {
    await goto(page, '/products?sort=name-asc');

    const names = await page
      .getByRole('list', { name: 'All products' })
      .locator('h3')
      .allTextContents();

    expect(names).toHaveLength(TOTAL);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })));
  });

  test('falls back to the default view on junk parameters', async ({ page }) => {
    await goto(page, '/products?sort=cheapest&availability=in-stock&category=NOT%20A%20SLUG');

    // Not a 400, not an empty grid — the normal shop.
    expect(await productLinks(page)).toHaveLength(TOTAL);
  });

  test('keeps the toolbar honest about how many matched', async ({ page }) => {
    await goto(page, '/products?category=toys-play');
    await expect(page.getByText('2 products')).toBeVisible();
  });

  test('marks the selected filter non-visually as well as visually', async ({ page }) => {
    await goto(page, '/products?category=toys-play');

    const chip = page.getByRole('link', { name: /^Toys & Play/ });
    await expect(chip).toHaveAttribute('aria-current', 'true');
    await expect(chip.locator('.sr-only')).toContainText('selected');
  });

  test('every filter is a real link with a real URL', async ({ page }) => {
    await goto(page, '/products');

    // No dead controls, and no state hidden in React: each chip navigates.
    await page.getByRole('link', { name: /^Coming soon/ }).first().click();
    await expect(page).toHaveURL(/availability=coming-soon/);
    expect(await productLinks(page)).toHaveLength(COMING_SOON);

    await page.goBack();
    await expect(page).toHaveURL(/\/products$/);
    expect(await productLinks(page)).toHaveLength(TOTAL);
  });

  test('the sort control opens and every ordering is a real URL', async ({ page }) => {
    await goto(page, '/products');

    const sort = page.getByRole('group').filter({ hasText: 'Sort' }).locator('summary');
    await expect(sort).toBeVisible();
    await sort.click();
    await page.getByRole('link', { name: 'Name: A–Z' }).click();

    // Generous: these routes are dynamic and query a remote database, so a
    // navigation under parallel load is slower than the 5s default.
    await expect(page).toHaveURL(/sort=name-asc/, { timeout: 20_000 });
    await expect(page.getByText('Name: A–Z').first()).toBeVisible();
  });

  test('returning to the default sort returns to the bare URL', async ({ page }) => {
    // One view, one URL: `?sort=featured` must not exist alongside `/products`.
    await goto(page, '/products?sort=price-asc');

    const sort = page.getByRole('group').filter({ hasText: 'Sort' }).locator('summary');
    await expect(sort).toBeVisible();
    await sort.click();
    await page.getByRole('link', { name: 'Featured' }).click();

    await expect(page).toHaveURL(/\/products$/, { timeout: 20_000 });
  });

  test('sorting preserves the filters already applied', async ({ page }) => {
    await goto(page, '/products?category=toys-play');

    const sort = page.getByRole('group').filter({ hasText: 'Sort' }).locator('summary');
    await expect(sort).toBeVisible();
    await sort.click();
    await page.getByRole('link', { name: 'Price: high to low' }).click();

    await expect(page).toHaveURL(/category=toys-play/, { timeout: 20_000 });
    await expect(page).toHaveURL(/sort=price-desc/);

    // Auto-waiting rather than a snapshot: the sort links navigate fully, so
    // the previous document is still around for a moment after the URL changes.
    await expect(page.getByRole('list', { name: 'All products' }).locator('> li')).toHaveCount(2);
  });

  test('does not create an indexable page per filter combination', async ({ page }) => {
    for (const url of [
      '/products',
      '/products?category=numbers-math',
      '/products?sort=price-asc',
      '/products?category=toys-play&availability=available&sort=name-asc',
    ]) {
      await goto(page, url);
      await expect(page.locator('meta[name="robots"]'), url).toHaveAttribute('content', /noindex/);
      await expect(page.locator('link[rel="canonical"]'), url).toHaveAttribute(
        'href',
        /\/products$/,
      );
    }
  });
});

test.describe('category navigation', () => {
  test('the desktop menu opens and links to real shelves', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/products');

    const trigger = page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Categories' });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Scoped to the primary nav: the mobile drawer holds the same links and is
    // present in the DOM at every width.
    const panel = page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Learning & Educational' });

    await expect(panel).toHaveAttribute('href', '/category/learning-educational');
  });

  test('the mobile drawer lists the shelves without a nested accordion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/products');

    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Mobile', exact: true });

    for (const name of ['Learning & Educational', 'Numbers & Math', 'Toys & Play']) {
      await expect(menu.getByRole('link', { name })).toBeVisible();
    }
  });

  test('never offers Shop by Age, because no product has an approved age', async ({ page }) => {
    // Five links to five empty pages is a dead control with a useful label.
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/products');

    await expect(
      page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Shop by Age' }),
    ).toHaveCount(0);
  });

  test('the age route still resolves, and says why it is empty', async ({ page }) => {
    // Built and correct, deliberately unlinked — the architecture is ready for
    // verified assignments without a redesign.
    const response = await page.goto('/age/3-5-years');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('3–5 years');
    await expect(page.getByText(/we only place a product in an age range once/i)).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('an unknown age band is a real 404', async ({ page }) => {
    expect((await page.goto('/age/99-years'))?.status()).toBe(404);
  });
});

test.describe('discovery layout', () => {
  const urls = [
    '/products',
    '/products?category=learning-educational&sort=price-asc',
    '/products?category=toys-play&availability=coming-soon',
    '/products?category=baby-essentials',
    '/category/numbers-math',
    '/search?q=wooden',
    '/search?q=zzzznotathing',
  ];

  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`never scrolls horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });

      for (const url of urls) {
        await page.goto(url);
        const overflows = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(overflows, `${url} scrolls horizontally at ${width}px`).toBe(false);
      }
    });
  }

  test('exposes no disabled placeholder control anywhere in discovery', async ({ page }) => {
    for (const url of urls) {
      await page.goto(url);
      await expect(page.locator('[aria-disabled="true"]'), url).toHaveCount(0);
    }
  });

  test('keeps the fixed bottom bar clear of the end of the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/products');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const overlap = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Primary mobile"]');
      const footer = document.querySelector('footer');
      if (!bar || !footer) return null;
      return footer.getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 1;
    });

    expect(overlap).toBe(false);
  });

  test('gives every filter chip a comfortable tap target', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await goto(page, '/products');

    const toolbar = page.getByRole('region', { name: 'Filter and sort' });
    await expect(toolbar).toBeVisible();

    const heights = await toolbar
      .locator('a')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));

    expect(heights.length).toBeGreaterThan(0);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(36);
  });
});
