import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoDataError } from '@/lib/catalogue/demo';
import { seedCatalogue } from '@/lib/catalogue/seed';

/**
 * The seed's safety behaviour. D-08 rates demo data reaching production as the
 * highest-impact catalogue risk, and the seed is the thing that creates it — so
 * it must refuse production before it touches the database.
 */

function setEnv({ production, demo }: { production: boolean; demo: boolean }) {
  vi.stubEnv('NODE_ENV', production ? 'production' : 'development');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('DEMO_MODE', demo ? '1' : '');
}

beforeEach(() => setEnv({ production: false, demo: false }));
afterEach(() => vi.unstubAllEnvs());

describe('production refusal', () => {
  it('refuses to seed on the production site', async () => {
    setEnv({ production: true, demo: false });

    // Rejects before connecting — no database work is attempted at all.
    await expect(seedCatalogue()).rejects.toThrow(DemoDataError);
    await expect(seedCatalogue()).rejects.toThrow(/never reach production/i);
  });

  it('refuses even when demo mode is explicitly requested in production', async () => {
    setEnv({ production: true, demo: true });

    await expect(seedCatalogue()).rejects.toThrow(DemoDataError);
  });
});
