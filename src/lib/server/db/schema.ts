/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creates every table this app needs directly in Neon PostgreSQL. This is
 * the single source of truth for the runtime schema and mirrors
 * `database.sql` at the project root (which also seeds demo/default data
 * and is meant to be run once by hand via `psql`). Running this at server
 * boot makes the app self-healing on a brand new database, while
 * `database.sql` remains the canonical, human-readable reference.
 */

import { getPool } from './pool';
import { getAdminSeed, getClubSettingsSeed, getFounderSeed, getMemberOfMonthSeed } from '../config/seed';

let ensurePromise: Promise<void> | null = null;
let schemaReady = false;
let schemaError: string | null = null;

/** True once every table has been created/verified successfully. */
export function isSchemaReady(): boolean {
  return schemaReady;
}

/** The most recent schema-setup failure reason, if any — surfaced by /api/health. */
export function getSchemaError(): string | null {
  return schemaError;
}

export async function ensureSchema(): Promise<void> {
  if (ensurePromise) return ensurePromise;

  ensurePromise = runSchemaSetup()
    .then(() => {
      schemaReady = true;
      schemaError = null;
    })
    .catch((err) => {
      // Don't permanently cache a failed attempt — if this was a transient
      // issue (e.g. Neon waking up from idle), the next call (e.g. a manual
      // retry) should be able to try again instead of forever replaying the
      // same cached rejection.
      ensurePromise = null;
      schemaReady = false;
      schemaError = err instanceof Error ? err.message : String(err);
      throw err;
    });

  return ensurePromise;
}

async function runSchemaSetup(): Promise<void> {
    const pool = getPool();

    // pgcrypto is only used as a convenience for seeding the default admin
    // password below. Some roles/plans may not be allowed to create
    // extensions — that must never block the rest of the schema from being
    // created, so this is best-effort with its own try/catch. If it fails,
    // we fall back to hashing the seed password with bcryptjs in JS instead
    // (see the seeding block near the bottom of this function).
    let pgcryptoAvailable = true;
    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    } catch (err) {
      pgcryptoAvailable = false;
      console.warn(
        '[db] Could not create the pgcrypto extension (this is fine — falling back to bcryptjs for the seed admin password):',
        err instanceof Error ? err.message : err
      );
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             TEXT PRIMARY KEY DEFAULT ('u_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        email          TEXT NOT NULL,
        password_hash  TEXT NOT NULL,
        name           TEXT NOT NULL,
        role           TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
        student_id     TEXT,
        department     TEXT,
        avatar_url     TEXT,
        bio            TEXT,
        title          TEXT,
        achievements   JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_verified    BOOLEAN NOT NULL DEFAULT true,
        is_active      BOOLEAN NOT NULL DEFAULT true,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
      CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id             TEXT PRIMARY KEY DEFAULT ('art_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        title          TEXT NOT NULL,
        content        TEXT NOT NULL,
        summary        TEXT,
        author_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
        author_name    TEXT NOT NULL,
        category       TEXT DEFAULT '',
        language       TEXT NOT NULL DEFAULT 'Somali' CHECK (language IN ('Somali', 'Arabic', 'English')),
        status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED')),
        published_at   TIMESTAMPTZ,
        likes_count    INTEGER NOT NULL DEFAULT 0,
        comments_count INTEGER NOT NULL DEFAULT 0,
        image_url      TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      -- Cover image column, added after the initial release — kept as a
      -- separate ALTER so upgrading an existing database doesn't require
      -- dropping the articles table.
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE articles ALTER COLUMN summary DROP NOT NULL;
      ALTER TABLE articles ALTER COLUMN category DROP NOT NULL;
      ALTER TABLE articles ALTER COLUMN category SET DEFAULT '';
      UPDATE articles SET category = '' WHERE category IS NULL;
      CREATE TABLE IF NOT EXISTS article_images (
        id          TEXT PRIMARY KEY DEFAULT ('img_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        article_id  TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        image_url   TEXT NOT NULL,
        alt_text    TEXT NOT NULL DEFAULT '',
        is_featured BOOLEAN NOT NULL DEFAULT true,
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS article_images_featured_unique_idx ON article_images (article_id) WHERE is_featured;
      CREATE INDEX IF NOT EXISTS article_images_article_idx ON article_images (article_id, sort_order ASC);
      CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);
      CREATE INDEX IF NOT EXISTS articles_created_idx ON articles (created_at DESC);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id          TEXT PRIMARY KEY DEFAULT ('c_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        article_id  TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        author_id   TEXT,
        author_name TEXT NOT NULL,
        avatar_url  TEXT,
        content     TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS comments_article_idx ON comments (article_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS likes (
        article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        user_key   TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (article_id, user_key)
      );
      CREATE INDEX IF NOT EXISTS likes_article_idx ON likes (article_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pdfs (
        id            TEXT PRIMARY KEY DEFAULT ('pdf_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        title         TEXT NOT NULL,
        author        TEXT NOT NULL,
        description   TEXT NOT NULL DEFAULT '',
        category      TEXT NOT NULL DEFAULT 'General Studies',
        cover_url     TEXT NOT NULL DEFAULT '',
        download_url  TEXT NOT NULL DEFAULT '#',
        pages_count   INTEGER NOT NULL DEFAULT 0,
        language      TEXT NOT NULL DEFAULT 'Somali',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id            TEXT PRIMARY KEY DEFAULT ('vid_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        title         TEXT NOT NULL,
        description   TEXT NOT NULL DEFAULT '',
        youtube_id    TEXT,
        video_url     TEXT,
        thumbnail_url TEXT,
        duration      TEXT NOT NULL DEFAULT '00:00',
        speaker       TEXT NOT NULL DEFAULT '',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      -- Thumbnail column, added after the initial release — kept as a
      -- separate ALTER so upgrading an existing database doesn't requirezz
      -- dropping the videos table.
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS talks (
        id          TEXT PRIMARY KEY DEFAULT ('tlk_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        audio_url   TEXT,
        speaker     TEXT NOT NULL,
        duration    TEXT NOT NULL DEFAULT '00:00',
        date        DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id          TEXT PRIMARY KEY DEFAULT ('gal_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        title       TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        image_url   TEXT NOT NULL,
        category    TEXT NOT NULL DEFAULT 'General',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id          TEXT PRIMARY KEY DEFAULT ('evt_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        location    TEXT NOT NULL DEFAULT '',
        date        DATE NOT NULL,
        time        TEXT NOT NULL,
        speaker     TEXT,
        image       TEXT,
        visibility  TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
        status      TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'COMPLETED')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'PUBLIC';
      CREATE TABLE IF NOT EXISTS event_registrations (
        event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_email    TEXT NOT NULL,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (event_id, user_email)
      );
      CREATE TABLE IF NOT EXISTS contact_messages (
        id          TEXT PRIMARY KEY DEFAULT ('cmsg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        name        TEXT NOT NULL,
        email       TEXT NOT NULL,
        message     TEXT NOT NULL,
        is_read     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS roadmap (
        id          TEXT PRIMARY KEY DEFAULT ('rn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        step        INTEGER NOT NULL,
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('COMPLETED', 'IN_PROGRESS', 'LOCKED')),
        quarter     TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS roadmap_progress (
        id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        start_date DATE NOT NULL DEFAULT DATE '2025-11-09',
        end_date   DATE NOT NULL DEFAULT DATE '2026-11-09',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id          TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
        user_name   TEXT NOT NULL,
        user_role   TEXT NOT NULL DEFAULT 'MEMBER',
        user_title  TEXT,
        avatar_url  TEXT,
        content     TEXT NOT NULL DEFAULT '',
        attachment_url  TEXT,
        attachment_name TEXT,
        attachment_type TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_title TEXT;
      -- Attachment columns, added after the initial release — kept as
      -- separate ALTERs so upgrading an existing database doesn't require
      -- dropping the chat_messages table.
      ALTER TABLE chat_messages ALTER COLUMN content DROP NOT NULL;
      ALTER TABLE chat_messages ALTER COLUMN content SET DEFAULT '';
      ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
      ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
      ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
      CREATE TABLE IF NOT EXISTS notifications (
        id          TEXT PRIMARY KEY DEFAULT ('not_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        user_id     TEXT NOT NULL DEFAULT 'all',
        title       TEXT NOT NULL,
        message     TEXT NOT NULL,
        read        BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id         TEXT PRIMARY KEY DEFAULT ('tst_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        name       TEXT NOT NULL,
        role       TEXT NOT NULL DEFAULT '',
        content    TEXT NOT NULL,
        avatar_url TEXT NOT NULL DEFAULT ''
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_settings (
        id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        club_name             TEXT NOT NULL DEFAULT '',
        club_arabic_name      TEXT NOT NULL DEFAULT '',
        contact_email         TEXT NOT NULL DEFAULT '',
        contact_phone         TEXT NOT NULL DEFAULT '',
        address               TEXT NOT NULL DEFAULT '',
        whatsapp_channel_url  TEXT,
        whatsapp_group_url    TEXT,
        telegram_channel_url  TEXT,
        tiktok_url            TEXT,
        facebook_url          TEXT,
        x_url                 TEXT,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS whatsapp_channel_url TEXT;
      ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
      ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT;
      ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS x_url TEXT;
      CREATE TABLE IF NOT EXISTS article_settings (
        id                 INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        publishing_enabled BOOLEAN NOT NULL DEFAULT true,
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS founder_info (
        id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        name       TEXT NOT NULL DEFAULT '',
        title      TEXT NOT NULL DEFAULT '',
        bio        TEXT NOT NULL DEFAULT '',
        image_url  TEXT NOT NULL DEFAULT '',
        message    TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS member_of_month (
        id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        name        TEXT NOT NULL DEFAULT '',
        avatar_url  TEXT NOT NULL DEFAULT '',
        achievement TEXT NOT NULL DEFAULT '',
        bio         TEXT NOT NULL DEFAULT '',
        month       TEXT NOT NULL DEFAULT ''
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id         TEXT PRIMARY KEY DEFAULT ('log_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        user_id    TEXT,
        user_name  TEXT NOT NULL,
        action     TEXT NOT NULL,
        details    TEXT NOT NULL DEFAULT '',
        timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs (timestamp DESC);
    `);

    // Seed the default administrator only if the users table is empty AND
    // credentials were actually provided via the environment. There is
    // intentionally no built-in fallback email/password: an admin account
    // is a real credential, not display content, so it is only ever
    // created when ADMIN_EMAIL + ADMIN_PASSWORD are explicitly set (e.g.
    // in `.env.local` locally, or your platform's environment variable
    // settings in production). See src/lib/server/config/seed.ts.
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count === 0) {
      const adminSeed = getAdminSeed();
      if (!adminSeed) {
        console.warn(
          '[db] users table is empty and no admin account was seeded — set ADMIN_EMAIL and ADMIN_PASSWORD ' +
            'in your environment to auto-create the first administrator on next boot.'
        );
      } else {
        console.log('[db] users table is empty — seeding the administrator account from the environment.');
        if (pgcryptoAvailable) {
          await pool.query(
            `INSERT INTO users (id, email, password_hash, name, role, is_verified, is_active)
             VALUES ('u_admin_root', $1, crypt($2, gen_salt('bf', 10)), $3, 'ADMIN', true, true)
             ON CONFLICT (id) DO NOTHING`,
            [adminSeed.email, adminSeed.password, adminSeed.name]
          );
        } else {
          // Fallback path: hash with bcryptjs in Node instead of Postgres'
          // pgcrypto extension. Produces an identical, fully compatible
          // bcrypt hash — bcrypt.compare() at login works the same either way.
          const bcrypt = await import('bcryptjs');
          const passwordHash = await bcrypt.hash(adminSeed.password, 10);
          await pool.query(
            `INSERT INTO users (id, email, password_hash, name, role, is_verified, is_active)
             VALUES ('u_admin_root', $1, $2, $3, 'ADMIN', true, true)
             ON CONFLICT (id) DO NOTHING`,
            [adminSeed.email, passwordHash, adminSeed.name]
          );
        }
      }
    }

    // Seed single-row settings tables so the public site isn't empty. All
    // content comes from the environment (see config/seed.ts) — every
    // value falls back to a generic empty/placeholder string, so a fresh
    // database still seeds successfully with zero configuration, and an
    // operator can override any of it without touching source code.
    const clubSettings = getClubSettingsSeed();
    await pool.query(
      `INSERT INTO club_settings (id, club_name, club_arabic_name, contact_email, contact_phone, address, whatsapp_channel_url, whatsapp_group_url, telegram_channel_url)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING;`,
      [
        clubSettings.clubName,
        clubSettings.clubArabicName,
        clubSettings.contactEmail,
        clubSettings.contactPhone,
        clubSettings.address,
        clubSettings.whatsappChannelUrl || clubSettings.whatsappGroupUrl || null,
        clubSettings.whatsappGroupUrl || clubSettings.whatsappChannelUrl || null,
        clubSettings.telegramChannelUrl || null,
      ]
    );
    await pool.query(
      `INSERT INTO article_settings (id, publishing_enabled)
       VALUES (1, true)
       ON CONFLICT (id) DO NOTHING;`
    );

    await pool.query(
      `INSERT INTO roadmap_progress (id, start_date, end_date)
       VALUES (1, DATE '2025-11-09', DATE '2026-11-09')
       ON CONFLICT (id) DO NOTHING;`
    );

    const founder = getFounderSeed();
    await pool.query(
      `INSERT INTO founder_info (id, name, title, bio, image_url, message)
       VALUES (1, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING;`,
      [founder.name, founder.title, founder.bio, founder.imageUrl, founder.message]
    );

    const memberOfMonth = getMemberOfMonthSeed();
    await pool.query(
      `INSERT INTO member_of_month (id, name, avatar_url, achievement, bio, month)
       VALUES (1, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING;`,
      [memberOfMonth.name, memberOfMonth.avatarUrl, memberOfMonth.achievement, memberOfMonth.bio, memberOfMonth.month]
    );

    console.log('[db] Schema verified/created on Neon PostgreSQL.');
}
