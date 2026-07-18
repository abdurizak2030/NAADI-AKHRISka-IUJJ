-- Neon / PostgreSQL bootstrap script for the IUJJ Next.js app.
-- Run this once against a fresh database, or re-run it safely because each
-- statement uses IF NOT EXISTS / DO NOTHING protections where appropriate.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT ('u_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  student_id    TEXT,
  department    TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  title         TEXT,
  achievements  JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_verified   BOOLEAN NOT NULL DEFAULT true,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE TABLE IF NOT EXISTS articles (
  id             TEXT PRIMARY KEY DEFAULT ('art_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  summary        TEXT NOT NULL,
  author_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name    TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'General',
  language       TEXT NOT NULL DEFAULT 'Somali' CHECK (language IN ('Somali', 'Arabic', 'English')),
  status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED')),
  published_at   TIMESTAMPTZ,
  likes_count    INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url TEXT;
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);
CREATE INDEX IF NOT EXISTS articles_created_idx ON articles (created_at DESC);

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

CREATE TABLE IF NOT EXISTS pdfs (
  id           TEXT PRIMARY KEY DEFAULT ('pdf_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  title        TEXT NOT NULL,
  author       TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'General Studies',
  cover_url    TEXT NOT NULL DEFAULT '',
  download_url TEXT NOT NULL DEFAULT '#',
  pages_count  INTEGER NOT NULL DEFAULT 0,
  language     TEXT NOT NULL DEFAULT 'Somali',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

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

CREATE TABLE IF NOT EXISTS gallery (
  id          TEXT PRIMARY KEY DEFAULT ('gal_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url   TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'General',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  id         TEXT PRIMARY KEY DEFAULT ('cmsg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roadmap (
  id          TEXT PRIMARY KEY DEFAULT ('rn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  step        INTEGER NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('COMPLETED', 'IN_PROGRESS', 'LOCKED')),
  quarter     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id                TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  user_id           TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name         TEXT NOT NULL,
  user_role         TEXT NOT NULL DEFAULT 'MEMBER',
  user_title        TEXT,
  avatar_url        TEXT,
  content           TEXT NOT NULL DEFAULT '',
  attachment_url    TEXT,
  attachment_name   TEXT,
  attachment_type   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_title TEXT;
ALTER TABLE chat_messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN content SET DEFAULT '';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY DEFAULT ('not_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  user_id    TEXT NOT NULL DEFAULT 'all',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);

CREATE TABLE IF NOT EXISTS testimonials (
  id         TEXT PRIMARY KEY DEFAULT ('tst_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL,
  avatar_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS club_settings (
  id                   INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  club_name            TEXT NOT NULL DEFAULT '',
  club_arabic_name     TEXT NOT NULL DEFAULT '',
  contact_email        TEXT NOT NULL DEFAULT '',
  contact_phone        TEXT NOT NULL DEFAULT '',
  address              TEXT NOT NULL DEFAULT '',
  whatsapp_channel_url TEXT,
  whatsapp_group_url   TEXT,
  telegram_channel_url TEXT,
  tiktok_url           TEXT,
  facebook_url         TEXT,
  x_url                TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS whatsapp_channel_url TEXT;
ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS x_url TEXT;

CREATE TABLE IF NOT EXISTS founder_info (
  id        INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name      TEXT NOT NULL DEFAULT '',
  title     TEXT NOT NULL DEFAULT '',
  bio       TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  message   TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS member_of_month (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name        TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT NOT NULL DEFAULT '',
  achievement TEXT NOT NULL DEFAULT '',
  bio         TEXT NOT NULL DEFAULT '',
  month       TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id        TEXT PRIMARY KEY DEFAULT ('log_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  user_id   TEXT,
  user_name TEXT NOT NULL,
  action    TEXT NOT NULL,
  details   TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs (timestamp DESC);

-- Seed a sample administrator account. Replace the password after first login.
INSERT INTO users (id, email, password_hash, name, role, is_verified, is_active)
VALUES (
  'u_admin_root',
  'admin@example.com',
  crypt('ChangeMe123!', gen_salt('bf', 10)),
  'Administrator',
  'ADMIN',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO club_settings (
  id, club_name, club_arabic_name, contact_email, contact_phone, address,
  whatsapp_channel_url, whatsapp_group_url, telegram_channel_url,
  tiktok_url, facebook_url, x_url
)
VALUES (
  1,
  'Reading Club',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO founder_info (id, name, title, bio, image_url, message)
VALUES (1, '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO member_of_month (id, name, avatar_url, achievement, bio, month)
VALUES (1, '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

COMMIT;
