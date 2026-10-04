/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PoolClient } from 'pg';
import { getPool } from '../db/pool';
import { AdminComment, Article, Comment } from '../types';
import type { TaxonomyEntry } from '../../../types';
import { makeUniqueSlug, slugify } from '../utils/slug';

type ArticleLanguage = 'Somali' | 'Arabic' | 'English';
type ArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED';

interface ArticleRow {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  author_id: string | null;
  author_name: string;
  category: string | null;
  language: ArticleLanguage;
  status: ArticleStatus;
  published_at: string | Date | null;
  likes_count: number;
  comments_count: number;
  image_url: string | null;
  liked_by_current_user?: boolean;
  created_at: string | Date;
  slug: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  views_count: number;
  shares_count: number;
  featured: boolean;
  reading_minutes: number;
}

function toIso(v: string | Date | null): string | undefined {
  if (!v) return undefined;
  return v instanceof Date ? v.toISOString() : v;
}

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary ?? '',
    authorName: row.author_name,
    authorId: row.author_id ?? '',
    category: row.category ?? '',
    language: row.language,
    status: row.status,
    publishedAt: toIso(row.published_at),
    createdAt: toIso(row.created_at)!,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    imageUrl: row.image_url ?? undefined,
    likedByCurrentUser: row.liked_by_current_user ?? false,
    slug: row.slug ?? row.id,
    tags: row.tags ?? [],
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    viewsCount: row.views_count ?? 0,
    sharesCount: row.shares_count ?? 0,
    featured: row.featured ?? false,
    readingMinutes: row.reading_minutes ?? 1,
  };
}

function articleSelect(likedParamIndex?: number, withContent = true): string {
  const likedExpression = likedParamIndex
    ? `EXISTS (SELECT 1 FROM likes l WHERE l.article_id = a.id AND l.user_key = $${likedParamIndex})`
    : 'false';

  return `
    a.id,
    a.title,
    ${withContent ? 'a.content' : "''::text AS content"},
    ${withContent ? 'a.summary' : "COALESCE(NULLIF(btrim(a.summary), ''), left(regexp_replace(a.content, '\\s+', ' ', 'g'), 180)) AS summary"},
    a.author_id,
    a.author_name,
    a.category,
    a.language,
    a.status,
    a.published_at,
    a.likes_count,
    a.comments_count,
    COALESCE(featured.image_url, a.image_url) AS image_url,
    ${likedExpression} AS liked_by_current_user,
    a.created_at,
    a.slug,
    a.tags,
    a.seo_title,
    a.seo_description,
    a.og_image_url,
    a.views_count,
    a.shares_count,
    a.featured,
    GREATEST(1, CEIL(COALESCE(array_length(regexp_split_to_array(btrim(a.content), '\\s+'), 1), 0) / 200.0))::int AS reading_minutes
  `;
}

function articleFeaturedJoin(): string {
  return `
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM article_images
      WHERE article_id = a.id AND is_featured = true
      ORDER BY sort_order ASC, created_at DESC
      LIMIT 1
    ) featured ON true
  `;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeCategory(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeLanguage(value: string | undefined): ArticleLanguage {
  return value === 'Arabic' || value === 'English' || value === 'Somali' ? value : 'Somali';
}

function normalizeStatus(value: string | undefined): ArticleStatus {
  return value === 'PUBLISHED' || value === 'PENDING' || value === 'DRAFT' ? value : 'DRAFT';
}

async function getArticleByIdWithClient(client: PoolClient, id: string, likedByUserKey?: string): Promise<Article | null> {
  const params = likedByUserKey ? [id, likedByUserKey] : [id];
  const { rows } = await client.query<ArticleRow>(
    `SELECT ${articleSelect(likedByUserKey ? 2 : undefined)}
     FROM articles a
     ${articleFeaturedJoin()}
     WHERE a.id = $1`,
    params
  );
  if (rows.length === 0) return null;
  return toArticle(rows[0]);
}

async function setFeaturedArticleImage(
  client: PoolClient,
  articleId: string,
  imageUrl: string | null | undefined,
  altText: string
): Promise<void> {
  if (imageUrl === undefined) return;

  const nextUrl = imageUrl?.trim() || null;
  if (!nextUrl) {
    await client.query('DELETE FROM article_images WHERE article_id = $1 AND is_featured = true', [articleId]);
    await client.query('UPDATE articles SET image_url = NULL, updated_at = now() WHERE id = $1', [articleId]);
    return;
  }

  const existing = await client.query<{ id: string }>(
    'SELECT id FROM article_images WHERE article_id = $1 AND is_featured = true LIMIT 1',
    [articleId]
  );

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE article_images SET image_url = $2, alt_text = $3, sort_order = 0 WHERE id = $1`,
      [existing.rows[0].id, nextUrl, altText]
    );
  } else {
    await client.query(
      `INSERT INTO article_images (article_id, image_url, alt_text, is_featured, sort_order)
       VALUES ($1, $2, $3, true, 0)`,
      [articleId, nextUrl, altText]
    );
  }

  await client.query('UPDATE articles SET image_url = $2, updated_at = now() WHERE id = $1', [articleId, nextUrl]);
}

export async function listArticles(publishedOnly: boolean, likedByUserKey?: string): Promise<Article[]> {
  const pool = getPool();
  const params = likedByUserKey ? [likedByUserKey] : [];
  const query = `SELECT ${articleSelect(likedByUserKey ? 1 : undefined)}
    FROM articles a
    ${articleFeaturedJoin()}
    ${publishedOnly ? "WHERE a.status = 'PUBLISHED'" : ''}
    ORDER BY a.created_at DESC`;
  const { rows } = await pool.query<ArticleRow>(query, params);
  return rows.map(toArticle);
}

export async function getArticleById(id: string, likedByUserKey?: string): Promise<Article | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await getArticleByIdWithClient(client, id, likedByUserKey);
  } finally {
    client.release();
  }
}

export interface CreateArticleInput {
  title: string;
  content: string;
  summary?: string | null;
  category?: string | null;
  language?: string;
  status?: string;
  authorId: string;
  authorName: string;
  imageUrl?: string | null;
  slug?: string | null;
  tags?: string[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  featured?: boolean;
}

/** Normalises free-form tag input (comma list or array) into a clean unique array. */
export function normalizeTags(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const tag = item.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (tag && !out.some((t) => t.toLowerCase() === tag.toLowerCase())) out.push(tag);
    if (out.length >= 12) break;
  }
  return out;
}

async function resolveUniqueSlug(client: PoolClient, desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired);
  const { rows } = await client.query<{ slug: string }>(
    `SELECT slug FROM articles WHERE slug IS NOT NULL AND ($2::text IS NULL OR id <> $2) AND (slug = $1 OR slug LIKE $1 || '-%')`,
    [base || 'article', excludeId ?? null]
  );
  return makeUniqueSlug(desired, new Set(rows.map((r) => r.slug)));
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const status = normalizeStatus(input.status);
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO articles (title, content, summary, author_id, author_name, category, language, status, published_at, image_url, slug, tags, seo_title, seo_description, og_image_url, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 = 'PUBLISHED' THEN now() ELSE NULL END, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [
        input.title,
        input.content,
        normalizeOptionalText(input.summary),
        input.authorId,
        input.authorName,
        normalizeCategory(input.category),
        normalizeLanguage(input.language),
        status,
        input.imageUrl?.trim() || null,
        await resolveUniqueSlug(client, input.slug?.trim() || input.title),
        normalizeTags(input.tags),
        normalizeOptionalText(input.seoTitle),
        normalizeOptionalText(input.seoDescription),
        normalizeOptionalText(input.ogImageUrl),
        Boolean(input.featured),
      ]
    );

    const articleId = rows[0].id;
    await setFeaturedArticleImage(client, articleId, input.imageUrl, input.title);
    const article = await getArticleByIdWithClient(client, articleId);
    await client.query('COMMIT');
    return article!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  summary?: string | null;
  category?: string | null;
  language?: string;
  status?: string;
  imageUrl?: string | null;
  slug?: string | null;
  tags?: string[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  featured?: boolean;
}

export async function updateArticle(id: string, updates: UpdateArticleInput): Promise<Article | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM articles WHERE id = $1 FOR UPDATE', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const fields: string[] = [];
    const values: unknown[] = [id];
    const addField = (sql: string, value: unknown) => {
      values.push(value);
      fields.push(`${sql} = $${values.length}`);
    };

    if (updates.title !== undefined) addField('title', updates.title);
    if (updates.content !== undefined) addField('content', updates.content);
    if (updates.summary !== undefined) addField('summary', normalizeOptionalText(updates.summary));
    if (updates.category !== undefined) addField('category', normalizeCategory(updates.category));
    if (updates.language !== undefined) addField('language', normalizeLanguage(updates.language));
    // Slugs are only ever changed on purpose (never auto-regenerated from a
    // renamed title), so links that were already shared keep working.
    if (updates.slug !== undefined && updates.slug !== null && updates.slug.trim()) {
      addField('slug', await resolveUniqueSlug(client, updates.slug.trim(), id));
    }
    if (updates.tags !== undefined) addField('tags', normalizeTags(updates.tags));
    if (updates.seoTitle !== undefined) addField('seo_title', normalizeOptionalText(updates.seoTitle));
    if (updates.seoDescription !== undefined) addField('seo_description', normalizeOptionalText(updates.seoDescription));
    if (updates.ogImageUrl !== undefined) addField('og_image_url', normalizeOptionalText(updates.ogImageUrl));
    if (updates.featured !== undefined) addField('featured', Boolean(updates.featured));
    if (updates.status !== undefined) {
      const nextStatus = normalizeStatus(updates.status);
      values.push(nextStatus);
      const statusParam = `$${values.length}`;
      fields.push(`status = ${statusParam}`);
      fields.push(`published_at = CASE WHEN ${statusParam} = 'PUBLISHED' AND status <> 'PUBLISHED' THEN now() WHEN ${statusParam} <> 'PUBLISHED' THEN NULL ELSE published_at END`);
    }

    if (fields.length > 0) {
      fields.push('updated_at = now()');
      await client.query(`UPDATE articles SET ${fields.join(', ')} WHERE id = $1`, values);
    }

    await setFeaturedArticleImage(client, id, updates.imageUrl, updates.title ?? 'Article featured image');
    const article = await getArticleByIdWithClient(client, id);
    await client.query('COMMIT');
    return article;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteArticle(id: string): Promise<Article | null> {
  const pool = getPool();
  const existing = await getArticleById(id);
  if (!existing) return null;
  await pool.query('DELETE FROM articles WHERE id = $1', [id]);
  return existing;
}

export async function toggleArticleLike(id: string, userKey: string): Promise<{ likesCount: number; liked: boolean } | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const article = await client.query<{ likes_count: number }>('SELECT likes_count FROM articles WHERE id = $1 FOR UPDATE', [id]);
    if (article.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const deleted = await client.query('DELETE FROM likes WHERE article_id = $1 AND user_key = $2 RETURNING article_id', [id, userKey]);
    const liked = deleted.rows.length === 0;
    const delta = liked ? 1 : -1;
    if (liked) {
      await client.query('INSERT INTO likes (article_id, user_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, userKey]);
    }

    const { rows } = await client.query<{ likes_count: number }>(
      'UPDATE articles SET likes_count = GREATEST(likes_count + $2, 0) WHERE id = $1 RETURNING likes_count',
      [id, delta]
    );
    await client.query('COMMIT');
    return { likesCount: rows[0].likes_count, liked };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

interface CommentRow {
  id: string;
  article_id: string;
  author_id: string | null;
  author_name: string;
  commenter_email?: string | null;
  avatar_url: string | null;
  content: string;
  created_at: string | Date;
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    articleId: row.article_id,
    authorName: row.author_name,
    authorId: row.author_id ?? 'guest',
    avatarUrl: row.avatar_url ?? undefined,
    content: row.content,
    createdAt: toIso(row.created_at)!,
  };
}

export async function listCommentsForArticle(articleId: string): Promise<Comment[]> {
  const pool = getPool();
  const { rows } = await pool.query<CommentRow>(
    'SELECT id, article_id, author_id, author_name, avatar_url, content, created_at FROM comments WHERE article_id = $1 ORDER BY created_at DESC',
    [articleId]
  );
  return rows.map(toComment);
}

export interface CreateCommentInput {
  articleId: string;
  authorId: string;
  authorName: string;
  avatarUrl?: string;
  commenterEmail: string;
  content: string;
}

export async function createComment(input: CreateCommentInput): Promise<Comment | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const articleCheck = await client.query('SELECT id FROM articles WHERE id = $1', [input.articleId]);
    if (articleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const { rows } = await client.query<CommentRow>(
      `INSERT INTO comments (article_id, author_id, author_name, commenter_email, avatar_url, content)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.articleId,
        input.authorId,
        input.authorName,
        input.commenterEmail,
        input.avatarUrl ?? null,
        input.content,
      ]
    );
    await client.query('UPDATE articles SET comments_count = comments_count + 1 WHERE id = $1', [
      input.articleId,
    ]);
    await client.query('COMMIT');
    return toComment(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

interface AdminCommentRow extends CommentRow {
  commenter_email: string | null;
  article_title: string | null;
}

function toAdminComment(row: AdminCommentRow): AdminComment {
  return {
    ...toComment(row),
    commenterEmail: row.commenter_email ?? '',
    articleTitle: row.article_title ?? 'Deleted article',
  };
}

export async function listAllCommentsForAdmin(): Promise<AdminComment[]> {
  const pool = getPool();
  const { rows } = await pool.query<AdminCommentRow>(
    'SELECT c.id, c.article_id, c.author_id, c.author_name, c.commenter_email, c.avatar_url, c.content, c.created_at, a.title AS article_title FROM comments c LEFT JOIN articles a ON a.id = c.article_id ORDER BY c.created_at DESC'
  );
  return rows.map(toAdminComment);
}

export async function deleteComment(id: string): Promise<AdminComment | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<AdminCommentRow>(
      'SELECT c.id, c.article_id, c.author_id, c.author_name, c.commenter_email, c.avatar_url, c.content, c.created_at, a.title AS article_title FROM comments c LEFT JOIN articles a ON a.id = c.article_id WHERE c.id = $1 FOR UPDATE OF c',
      [id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('DELETE FROM comments WHERE id = $1', [id]);
    await client.query('UPDATE articles SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = $1', [
      rows[0].article_id,
    ]);
    await client.query('COMMIT');
    return toAdminComment(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


// ---------------------------------------------------------------------------
// Public reading experience: cards, slug lookup, related/adjacent, counters
// ---------------------------------------------------------------------------

export interface ArticleCardQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  language?: string;
  author?: string;
  tag?: string;
  q?: string;
  featured?: boolean;
  excludeId?: string;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Lightweight, paginated list for cards — never ships the full article body. */
export async function listArticleCards(query: ArticleCardQuery): Promise<{ items: Article[]; total: number }> {
  const pool = getPool();
  const pageSize = Math.min(Math.max(query.pageSize ?? 9, 1), 30);
  const page = Math.max(query.page ?? 1, 1);

  const where: string[] = [`a.status = 'PUBLISHED'`];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };
  if (query.category) add('a.category = ?', query.category);
  if (query.language) add('a.language = ?', query.language);
  if (query.author) add('a.author_name = ?', query.author);
  if (query.tag) add('? = ANY(a.tags)', query.tag);
  if (query.featured) where.push('a.featured = true');
  if (query.excludeId) add('a.id <> ?', query.excludeId);
  if (query.q?.trim()) {
    const like = `%${escapeLike(query.q.trim())}%`;
    params.push(like);
    const i = params.length;
    where.push(`(a.title ILIKE $${i} OR a.summary ILIKE $${i} OR a.author_name ILIKE $${i} OR a.category ILIKE $${i} OR EXISTS (SELECT 1 FROM unnest(a.tags) t WHERE t ILIKE $${i}))`);
  }

  const whereSql = where.join(' AND ');
  const totalRes = await pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM articles a WHERE ${whereSql}`, params);
  const { rows } = await pool.query<ArticleRow>(
    `SELECT ${articleSelect(undefined, false)}
     FROM articles a
     ${articleFeaturedJoin()}
     WHERE ${whereSql}
     ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
     LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    params
  );
  return { items: rows.map(toArticle), total: totalRes.rows[0]?.count ?? 0 };
}

/** Resolves a published article by slug (falls back to the legacy id). */
export async function getArticleBySlug(slugOrId: string, likedByUserKey?: string): Promise<Article | null> {
  const pool = getPool();
  const params = likedByUserKey ? [slugOrId, likedByUserKey] : [slugOrId];
  const { rows } = await pool.query<ArticleRow>(
    `SELECT ${articleSelect(likedByUserKey ? 2 : undefined)}
     FROM articles a
     ${articleFeaturedJoin()}
     WHERE (a.slug = $1 OR a.id = $1) AND a.status = 'PUBLISHED'
     LIMIT 1`,
    params
  );
  return rows[0] ? toArticle(rows[0]) : null;
}

/** Related = same category first, then shared tags / same author, newest first. */
export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  const pool = getPool();
  const { rows } = await pool.query<ArticleRow>(
    `SELECT ${articleSelect(undefined, false)}
     FROM articles a
     ${articleFeaturedJoin()}
     WHERE a.status = 'PUBLISHED' AND a.id <> $1
     ORDER BY
       (CASE WHEN a.category <> '' AND a.category = $2 THEN 3 ELSE 0 END
        + (SELECT COUNT(*) FROM unnest(a.tags) t WHERE t = ANY($3::text[])) * 2
        + (CASE WHEN a.author_id IS NOT NULL AND a.author_id = $4 THEN 1 ELSE 0 END)) DESC,
       a.published_at DESC NULLS LAST
     LIMIT $5`,
    [article.id, article.category, article.tags, article.authorId || null, limit]
  );
  return rows.map(toArticle);
}

export interface AdjacentArticles {
  previous: Pick<Article, 'slug' | 'title' | 'imageUrl'> | null;
  next: Pick<Article, 'slug' | 'title' | 'imageUrl'> | null;
}

/** "Previous" = the next-older article, "Next" = the next-newer article. */
export async function getAdjacentArticles(article: Article): Promise<AdjacentArticles> {
  const pool = getPool();
  const pivot = article.publishedAt ?? article.createdAt;
  const pick = async (cmp: '<' | '>', order: 'DESC' | 'ASC') => {
    const { rows } = await pool.query<{ slug: string; title: string; image_url: string | null }>(
      `SELECT a.slug, a.title, COALESCE(featured.image_url, a.image_url) AS image_url
       FROM articles a ${articleFeaturedJoin()}
       WHERE a.status = 'PUBLISHED' AND a.id <> $2 AND COALESCE(a.published_at, a.created_at) ${cmp} $1
       ORDER BY COALESCE(a.published_at, a.created_at) ${order} LIMIT 1`,
      [pivot, article.id]
    );
    return rows[0] ? { slug: rows[0].slug, title: rows[0].title, imageUrl: rows[0].image_url ?? undefined } : null;
  };
  const [previous, next] = await Promise.all([pick('<', 'DESC'), pick('>', 'ASC')]);
  return { previous, next };
}

export async function incrementArticleViews(id: string): Promise<number | null> {
  const { rows } = await getPool().query<{ views_count: number }>(
    `UPDATE articles SET views_count = views_count + 1 WHERE id = $1 AND status = 'PUBLISHED' RETURNING views_count`,
    [id]
  );
  return rows[0]?.views_count ?? null;
}

export async function incrementArticleShares(id: string): Promise<number | null> {
  const { rows } = await getPool().query<{ shares_count: number }>(
    `UPDATE articles SET shares_count = shares_count + 1 WHERE id = $1 AND status = 'PUBLISHED' RETURNING shares_count`,
    [id]
  );
  return rows[0]?.shares_count ?? null;
}

export async function toggleArticleBookmark(id: string, userKey: string): Promise<{ bookmarked: boolean } | null> {
  const pool = getPool();
  const exists = await pool.query('SELECT 1 FROM articles WHERE id = $1', [id]);
  if (exists.rows.length === 0) return null;
  const removed = await pool.query('DELETE FROM article_bookmarks WHERE article_id = $1 AND user_key = $2', [id, userKey]);
  if (removed.rowCount && removed.rowCount > 0) return { bookmarked: false };
  await pool.query('INSERT INTO article_bookmarks (article_id, user_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, userKey]);
  return { bookmarked: true };
}

export async function getArticleEngagementState(id: string, userKey: string) {
  const { rows } = await getPool().query<{ liked: boolean; bookmarked: boolean; likes_count: number; views_count: number; shares_count: number; comments_count: number }>(
    `SELECT EXISTS (SELECT 1 FROM likes l WHERE l.article_id = a.id AND l.user_key = $2) AS liked,
            EXISTS (SELECT 1 FROM article_bookmarks b WHERE b.article_id = a.id AND b.user_key = $2) AS bookmarked,
            a.likes_count, a.views_count, a.shares_count, a.comments_count
     FROM articles a WHERE a.id = $1`,
    [id, userKey]
  );
  const r = rows[0];
  if (!r) return null;
  return { liked: r.liked, bookmarked: r.bookmarked, likesCount: r.likes_count, viewsCount: r.views_count, sharesCount: r.shares_count, commentsCount: r.comments_count };
}

/** The reader's saved articles (cards only), newest bookmark first. */
export async function listBookmarkedArticles(userKey: string): Promise<Article[]> {
  const { rows } = await getPool().query<ArticleRow>(
    `SELECT ${articleSelect(undefined, false)}
     FROM article_bookmarks b
     JOIN articles a ON a.id = b.article_id AND a.status = 'PUBLISHED'
     ${articleFeaturedJoin()}
     WHERE b.user_key = $1
     ORDER BY b.created_at DESC`,
    [userKey]
  );
  return rows.map(toArticle);
}

export async function listPublishedCategories(): Promise<TaxonomyEntry[]> {
  const { rows } = await getPool().query<{ name: string; count: number }>(
    `SELECT category AS name, COUNT(*)::int AS count FROM articles
     WHERE status = 'PUBLISHED' AND category <> '' GROUP BY category ORDER BY count DESC, name ASC`
  );
  return rows;
}

export async function listTaxonomy(kind: 'category' | 'author'): Promise<TaxonomyEntry[]> {
  const column = kind === 'category' ? 'category' : 'author_name';
  const { rows } = await getPool().query<{ name: string; count: number }>(
    `SELECT ${column} AS name, COUNT(*)::int AS count FROM articles WHERE ${column} <> '' GROUP BY ${column} ORDER BY count DESC, name ASC`
  );
  return rows;
}

export async function renameTaxonomy(kind: 'category' | 'author', from: string, to: string): Promise<number> {
  const column = kind === 'category' ? 'category' : 'author_name';
  const { rowCount } = await getPool().query(`UPDATE articles SET ${column} = $2, updated_at = now() WHERE ${column} = $1`, [from, to]);
  return rowCount ?? 0;
}

export async function listPublishedForSitemap(): Promise<{ slug: string; updatedAt: string }[]> {
  const { rows } = await getPool().query<{ slug: string; updated_at: string | Date }>(
    `SELECT slug, updated_at FROM articles WHERE status = 'PUBLISHED' AND slug IS NOT NULL ORDER BY published_at DESC NULLS LAST`
  );
  return rows.map((r) => ({ slug: r.slug, updatedAt: toIso(r.updated_at)! }));
}
