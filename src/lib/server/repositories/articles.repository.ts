/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PoolClient } from 'pg';
import { getPool } from '../db/pool';
import { Article, Comment } from '../types';

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
  };
}

function articleSelect(likedParamIndex?: number): string {
  const likedExpression = likedParamIndex
    ? `EXISTS (SELECT 1 FROM likes l WHERE l.article_id = a.id AND l.user_key = $${likedParamIndex})`
    : 'false';

  return `
    a.id,
    a.title,
    a.content,
    a.summary,
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
    a.created_at
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
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const status = normalizeStatus(input.status);
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO articles (title, content, summary, author_id, author_name, category, language, status, published_at, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 = 'PUBLISHED' THEN now() ELSE NULL END, $9)
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
    'SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC',
    [articleId]
  );
  return rows.map(toComment);
}

export interface CreateCommentInput {
  articleId: string;
  authorId: string;
  authorName: string;
  avatarUrl?: string;
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
      `INSERT INTO comments (article_id, author_id, author_name, avatar_url, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.articleId, input.authorId, input.authorName, input.avatarUrl ?? null, input.content]
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