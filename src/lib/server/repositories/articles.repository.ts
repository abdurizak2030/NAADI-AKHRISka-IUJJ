/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPool } from '../db/pool';
import { Article, Comment } from '../types';

interface ArticleRow {
  id: string;
  title: string;
  content: string;
  summary: string;
  author_id: string | null;
  author_name: string;
  category: string;
  language: 'Somali' | 'Arabic' | 'English';
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  published_at: string | Date | null;
  likes_count: number;
  comments_count: number;
  image_url: string | null;
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
    summary: row.summary,
    authorName: row.author_name,
    authorId: row.author_id ?? '',
    category: row.category,
    language: row.language,
    status: row.status,
    publishedAt: toIso(row.published_at),
    createdAt: toIso(row.created_at)!,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    imageUrl: row.image_url ?? undefined,
  };
}

export async function listArticles(publishedOnly: boolean): Promise<Article[]> {
  const pool = getPool();
  const query = publishedOnly
    ? `SELECT * FROM articles WHERE status = 'PUBLISHED' ORDER BY created_at DESC`
    : `SELECT * FROM articles ORDER BY created_at DESC`;
  const { rows } = await pool.query<ArticleRow>(query);
  return rows.map(toArticle);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const pool = getPool();
  const { rows } = await pool.query<ArticleRow>('SELECT * FROM articles WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  return toArticle(rows[0]);
}

export interface CreateArticleInput {
  title: string;
  content: string;
  summary: string;
  category?: string;
  language?: string;
  status?: string;
  authorId: string;
  authorName: string;
  imageUrl?: string;
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const pool = getPool();
  const status = input.status === 'PUBLISHED' || input.status === 'PENDING' ? input.status : 'DRAFT';
  const { rows } = await pool.query<ArticleRow>(
    `INSERT INTO articles (title, content, summary, author_id, author_name, category, language, status, published_at, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 = 'PUBLISHED' THEN now() ELSE NULL END, $9)
     RETURNING *`,
    [
      input.title,
      input.content,
      input.summary,
      input.authorId,
      input.authorName,
      input.category || 'General',
      input.language || 'Somali',
      status,
      input.imageUrl ?? null,
    ]
  );
  return toArticle(rows[0]);
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  summary?: string;
  category?: string;
  language?: string;
  status?: string;
  imageUrl?: string;
}

export async function updateArticle(id: string, updates: UpdateArticleInput): Promise<Article | null> {
  const pool = getPool();
  const current = await getArticleById(id);
  if (!current) return null;

  const nextStatus = updates.status ?? current.status;
  const shouldStampPublished = updates.status === 'PUBLISHED' && current.status !== 'PUBLISHED';

  const { rows } = await pool.query<ArticleRow>(
    `UPDATE articles SET
       title = COALESCE($2, title),
       content = COALESCE($3, content),
       summary = COALESCE($4, summary),
       category = COALESCE($5, category),
       language = COALESCE($6, language),
       status = $7,
       published_at = CASE WHEN $8 THEN now() WHEN $10 THEN NULL ELSE published_at END,
       image_url = COALESCE($9, image_url),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      updates.title ?? null,
      updates.content ?? null,
      updates.summary ?? null,
      updates.category ?? null,
      updates.language ?? null,
      nextStatus,
      shouldStampPublished,
      updates.imageUrl ?? null,
    ]
  );
  if (rows.length === 0) return null;
  return toArticle(rows[0]);
}

export async function deleteArticle(id: string): Promise<Article | null> {
  const pool = getPool();
  const existing = await getArticleById(id);
  if (!existing) return null;
  await pool.query('DELETE FROM articles WHERE id = $1', [id]);
  return existing;
}

export async function incrementLikes(id: string): Promise<number | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ likes_count: number }>(
    'UPDATE articles SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
    [id]
  );
  if (rows.length === 0) return null;
  return rows[0].likes_count;
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
