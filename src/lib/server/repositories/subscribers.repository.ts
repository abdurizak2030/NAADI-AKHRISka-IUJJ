/**
 * Followers / subscribers.
 *
 * A follower is an email address (optionally linked to a logged-in user)
 * following either everything ("all"), one author, or one category.
 * Emails are private: they are only ever returned to administrators.
 */
import { getPool } from '../db/pool';
import type { Article } from '../types';
import type { FollowKind, FollowRecord, SubscriberRecord } from '../../../types';
import { createNotification } from './content.repository';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function normalizeFollow(kind: unknown, value: unknown): FollowRecord | null {
  if (kind === 'all') return { kind: 'all', value: '' };
  if ((kind === 'author' || kind === 'category') && typeof value === 'string' && value.trim()) {
    return { kind, value: value.trim().slice(0, 120) };
  }
  return null;
}

export async function addFollower(email: string, follow: FollowRecord, userId?: string): Promise<void> {
  await getPool().query(
    `INSERT INTO subscribers (email, user_id, kind, value) VALUES ($1, $2, $3, $4)
     ON CONFLICT (LOWER(email), kind, value) DO UPDATE SET user_id = COALESCE(subscribers.user_id, EXCLUDED.user_id)`,
    [email.trim().toLowerCase(), userId ?? null, follow.kind, follow.value]
  );
}

export async function removeFollower(email: string, follow: FollowRecord): Promise<void> {
  await getPool().query('DELETE FROM subscribers WHERE LOWER(email) = LOWER($1) AND kind = $2 AND value = $3', [email, follow.kind, follow.value]);
}

export async function listFollowsForUser(userId: string, email: string): Promise<FollowRecord[]> {
  const { rows } = await getPool().query<{ kind: FollowKind; value: string }>(
    'SELECT kind, value FROM subscribers WHERE user_id = $1 OR LOWER(email) = LOWER($2)',
    [userId, email]
  );
  return rows;
}

export async function listSubscribersForAdmin(): Promise<SubscriberRecord[]> {
  const { rows } = await getPool().query<{ id: string; email: string; kind: FollowKind; value: string; user_id: string | null; created_at: Date | string }>(
    'SELECT id, email, kind, value, user_id, created_at FROM subscribers ORDER BY created_at DESC'
  );
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    kind: r.kind,
    value: r.value,
    userId: r.user_id ?? undefined,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  const { rowCount } = await getPool().query('DELETE FROM subscribers WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

/**
 * Called when an article becomes public. Followers who are signed-in members
 * get an in-app notification. Email-only followers are stored but no email is
 * sent from here — the project has no outbound-email provider configured.
 */
export async function notifyFollowersOfPublishedArticle(article: Pick<Article, 'title' | 'slug' | 'authorName' | 'category'>): Promise<number> {
  try {
    const { rows } = await getPool().query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM subscribers
       WHERE user_id IS NOT NULL
         AND (kind = 'all' OR (kind = 'author' AND value = $1) OR (kind = 'category' AND value = $2 AND $2 <> ''))`,
      [article.authorName, article.category]
    );
    await Promise.all(
      rows.map((r) =>
        createNotification({
          userId: r.user_id,
          title: 'New article published',
          message: `"${article.title}" by ${article.authorName} is now live: /articles/${article.slug}`,
        })
      )
    );
    return rows.length;
  } catch (err) {
    console.error('[followers] Failed to notify followers:', err);
    return 0;
  }
}
