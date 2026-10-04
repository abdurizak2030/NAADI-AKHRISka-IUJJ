import { getPool } from '../db/pool';
import type { SearchResult } from '../../../types';

function like(q: string): string {
  return `%${q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

export async function searchEverything(q: string, perType = 6): Promise<SearchResult[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const pool = getPool();
  const pattern = like(term);
  const limit = Math.min(Math.max(perType, 1), 30);

  const [articles, books, videos] = await Promise.all([
    pool.query(
      `SELECT a.slug, a.id, a.title, a.summary, a.category, a.published_at, COALESCE(f.image_url, a.image_url) AS image_url
       FROM articles a
       LEFT JOIN LATERAL (SELECT image_url FROM article_images WHERE article_id = a.id AND is_featured = true ORDER BY sort_order ASC LIMIT 1) f ON true
       WHERE a.status = 'PUBLISHED'
         AND (a.title ILIKE $1 OR a.summary ILIKE $1 OR a.author_name ILIKE $1 OR a.category ILIKE $1
              OR EXISTS (SELECT 1 FROM unnest(a.tags) t WHERE t ILIKE $1))
       ORDER BY a.published_at DESC NULLS LAST LIMIT ${limit}`,
      [pattern]
    ),
    pool.query(
      `SELECT id, title, author, description, category, cover_url, created_at FROM pdfs
       WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
       ORDER BY created_at DESC LIMIT ${limit}`,
      [pattern]
    ),
    pool.query(
      `SELECT id, title, description, speaker, youtube_id, thumbnail_url, created_at FROM videos
       WHERE title ILIKE $1 OR description ILIKE $1 OR speaker ILIKE $1
       ORDER BY created_at DESC LIMIT ${limit}`,
      [pattern]
    ),
  ]);

  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : typeof v === 'string' ? v : undefined);
  const results: SearchResult[] = [];
  for (const r of articles.rows) {
    results.push({ id: r.id, type: 'article', title: r.title, description: r.summary ?? '', category: r.category ?? '', imageUrl: r.image_url ?? undefined, date: iso(r.published_at), href: `/articles/${r.slug}` });
  }
  for (const r of books.rows) {
    results.push({ id: r.id, type: 'book', title: r.title, description: r.description || `By ${r.author}`, category: r.category, imageUrl: r.cover_url || undefined, date: iso(r.created_at), href: `/library?q=${encodeURIComponent(r.title)}` });
  }
  for (const r of videos.rows) {
    const thumb = r.thumbnail_url || (r.youtube_id ? `https://i.ytimg.com/vi/${r.youtube_id}/hqdefault.jpg` : undefined);
    results.push({ id: r.id, type: 'video', title: r.title, description: r.description || r.speaker, category: r.speaker || 'Video', imageUrl: thumb, date: iso(r.created_at), href: `/videos?v=${encodeURIComponent(r.id)}` });
  }
  return results;
}
