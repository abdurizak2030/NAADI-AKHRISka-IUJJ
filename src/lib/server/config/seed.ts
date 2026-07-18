/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Configuration for the one-time data seeded into a brand-new database
 * (the default admin account + the public "about the club" content).
 *
 * Nothing here is hardcoded — every value is read from the environment,
 * so no real name, email address, phone number, or password ever lives
 * in source code. Non-sensitive display content falls back to a clearly
 * generic placeholder if its environment variable isn't set (so a fresh
 * database still seeds successfully); the admin account has no fallback
 * credentials at all — see `getAdminSeed()` below.
 */

function env(name: string, fallback = ''): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export interface AdminSeed {
  email: string;
  password: string;
  name: string;
}

/**
 * Returns the admin account to seed, or `null` if seeding should be
 * skipped. On purpose there is NO fallback email/password: an admin
 * account is a real credential, not display content, so it is only ever
 * created when the deployer explicitly provides one via the environment.
 *
 * Set these before first boot (e.g. in `.env.local`, or your platform's
 * environment variable settings):
 *   ADMIN_EMAIL     - login email for the seeded admin account
 *   ADMIN_PASSWORD  - initial password (change it after first login)
 *   ADMIN_NAME      - display name (optional, defaults to "Administrator")
 */
export function getAdminSeed(): AdminSeed | null {
  const email = env('ADMIN_EMAIL');
  const password = env('ADMIN_PASSWORD');
  if (!email || !password) return null;
  return { email, password, name: env('ADMIN_NAME', 'Administrator') };
}

/** Public "club settings" content seeded once so the site isn't empty on first run. */
export function getClubSettingsSeed() {
  return {
    clubName: env('SEED_CLUB_NAME', 'Reading Club'),
    clubArabicName: env('SEED_CLUB_ARABIC_NAME', ''),
    contactEmail: env('SEED_CONTACT_EMAIL', ''),
    contactPhone: env('SEED_CONTACT_PHONE', ''),
    address: env('SEED_ADDRESS', ''),
    whatsappChannelUrl: env('SEED_WHATSAPP_URL', ''),
    whatsappGroupUrl: env('SEED_WHATSAPP_URL', ''),
    telegramChannelUrl: env('SEED_TELEGRAM_URL', ''),
  };
}

/** Public "founder" section content seeded once so the site isn't empty on first run. */
export function getFounderSeed() {
  return {
    name: env('SEED_FOUNDER_NAME', ''),
    title: env('SEED_FOUNDER_TITLE', ''),
    bio: env('SEED_FOUNDER_BIO', ''),
    imageUrl: env('SEED_FOUNDER_IMAGE_URL', ''),
    message: env('SEED_FOUNDER_MESSAGE', ''),
  };
}

/** Public "member of the month" content seeded once so the site isn't empty on first run. */
export function getMemberOfMonthSeed() {
  return {
    name: env('SEED_MEMBER_NAME', ''),
    avatarUrl: env('SEED_MEMBER_AVATAR_URL', ''),
    achievement: env('SEED_MEMBER_ACHIEVEMENT', ''),
    bio: env('SEED_MEMBER_BIO', ''),
    month: env('SEED_MEMBER_MONTH', ''),
  };
}
