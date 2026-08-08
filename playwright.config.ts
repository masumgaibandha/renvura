import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Two servers, one build.
 *
 * `mobile-chrome` runs the production posture: demo mode is impossible, so the
 * five protected demo products must be invisible and their URLs must 404. That
 * is what most of the suite asserts.
 *
 * `demo-preview` runs the same build with `VERCEL_ENV=preview DEMO_MODE=1`,
 * which is the only configuration in which demo catalogue content resolves at
 * all — and therefore the only way to test what the product pages actually
 * render. It needs a reachable database with the seed applied
 * (`npm run db:seed`); the specs under `tests/e2e/demo` skip themselves with a
 * clear reason when the catalogue is empty, so a machine without a database
 * still gets a green, honest run rather than a wall of failures.
 *
 * One local-only caveat: both projects share a single `next build`, which runs
 * with production env, so statically prerendered pages — `/` and `/products` —
 * carry the empty catalogue baked in even on the demo server. Only dynamic
 * routes reflect runtime configuration here. A real Vercel preview builds with
 * `VERCEL_ENV=preview` and has no such split, so the demo specs assert against
 * dynamic surfaces only.
 */
const DEMO_PORT = 3101;
const demoBaseURL = `http://127.0.0.1:${DEMO_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chrome',
      testIgnore: '**/demo/**',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'demo-preview',
      testMatch: '**/demo/**',
      use: { ...devices['Pixel 7'], baseURL: demoBaseURL },
    },
  ],
  webServer: [
    {
      command: `npx next start --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SITE_URL: baseURL,
      },
    },
    {
      command: `npx next start --port ${DEMO_PORT}`,
      url: demoBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SITE_URL: demoBaseURL,
        // Exactly the protected-preview posture, never production.
        VERCEL_ENV: 'preview',
        DEMO_MODE: '1',
      },
    },
  ],
});
