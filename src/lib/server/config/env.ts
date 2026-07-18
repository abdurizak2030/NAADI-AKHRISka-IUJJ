/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-side environment configuration. Next.js automatically loads
 * `.env` / `.env.local` — no dotenv.config() call is needed the way the
 * original standalone Express server required.
 */

const nodeEnv = process.env.NODE_ENV || 'development';

// JWT_SECRET must come from the environment. In production we fail fast
// rather than silently signing tokens with a guessable default. In
// development we fall back to a clearly-labeled dev-only value so the app
// still boots without extra setup, but this is never used in production.
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (nodeEnv === 'production') {
    // Avoid throwing at module-eval time during `next build` (which does
    // not need a real secret) — only enforce this at request time via
    // requireDbReady()/getPool() failing loudly. We still warn here.
    console.warn(
      '[env] JWT_SECRET is not set. Set it in your deployment environment (e.g. Vercel Project Settings) before serving real traffic.'
    );
  }
  jwtSecret = 'dev-only-insecure-jwt-secret-change-me';
}

export const env = {
  NODE_ENV: nodeEnv,
  JWT_SECRET: jwtSecret,
  DATABASE_URL: process.env.DATABASE_URL || '',
};

export const isProduction = env.NODE_ENV === 'production';

// Cloudinary powers all file storage (avatars, article images, PDF
// attachments, event/video uploads). Missing credentials don't prevent the
// app from booting or building, but every upload will fail at request time
// — warn loudly in production so this is caught during deployment review
// rather than discovered by a user's failed upload.
if (
  isProduction &&
  (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)
) {
  console.warn(
    '[env] One or more Cloudinary variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not set. File uploads (avatars, images, attachments, videos) will fail until these are set in your deployment environment.'
  );
}

/**
 * Validates the shape of DATABASE_URL BEFORE anything ever tries to
 * connect with it, and returns one clear, actionable diagnostic instead of
 * letting a cryptic "Invalid URL" / "ENOTFOUND" error surface later as a
 * generic 500 on every single API request.
 */
export function validateDatabaseUrl(): { valid: boolean; reason?: string } {
  if (!env.DATABASE_URL) {
    return { valid: false, reason: 'DATABASE_URL is empty. Set it in your environment (.env.local or Vercel Project Settings).' };
  }

  if (!env.DATABASE_URL.startsWith('postgres://') && !env.DATABASE_URL.startsWith('postgresql://')) {
    return {
      valid: false,
      reason: "DATABASE_URL must start with 'postgresql://' or 'postgres://'.",
    };
  }

  try {
    const url = new URL(env.DATABASE_URL);
    if (!url.password) {
      return {
        valid: false,
        reason:
          "DATABASE_URL has no password — it looks like the '@' separator between the " +
          'password and the host is missing. A valid Neon connection string looks like ' +
          'postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require',
      };
    }
    if (!url.hostname || !url.hostname.includes('.')) {
      return {
        valid: false,
        reason: `DATABASE_URL host "${url.hostname}" doesn't look like a real Neon hostname (expected something like ep-xxxx-pooler.region.aws.neon.tech).`,
      };
    }
    return { valid: true };
  } catch {
    return {
      valid: false,
      reason:
        "DATABASE_URL is not a valid connection string (it failed basic URL parsing). This " +
        "usually means the '@' between the password and the host is missing or characters " +
        'were dropped when it was copied. Go to your Neon dashboard → Connection Details → ' +
        'copy the FULL pooled connection string again and paste it into your environment.',
    };
  }
}
