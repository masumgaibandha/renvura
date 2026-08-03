import { z } from 'zod';

/**
 * Environment is validated in two tiers so that `npm run build` never needs a
 * database or an email provider:
 *
 *  - `publicEnv` is read at module load. It only contains values with safe
 *    defaults, and is what static rendering depends on.
 *  - `serverEnv()` is called lazily, at the moment a request actually needs a
 *    secret. A missing `MONGODB_URI` therefore fails that request, not the build.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('https://renvura.com'),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsedPublic.success) {
  throw new Error(
    `Invalid public environment: ${parsedPublic.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
  );
}

export const publicEnv = parsedPublic.data;

/** Site origin without a trailing slash. */
export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

const serverSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().min(1).optional(),
  EMAIL_PROVIDER: z.enum(['log']).default('log'),
  CONTACT_EMAIL_TO: z.string().default('hello@renvura.com'),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | undefined;

export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    CONTACT_EMAIL_TO: process.env.CONTACT_EMAIL_TO,
  });

  if (!parsed.success) {
    throw new EnvironmentError(
      `Invalid server environment: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/** True only on the real production deployment; drives robots.txt. */
export function isProductionSite(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview';
}
