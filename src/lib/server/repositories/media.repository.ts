/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Backs the "Library Management" (pdfs) and "Media Management"
 * (videos, gallery photos) sections of the Admin
 * Dashboard, plus the matching public routes.
 */

import { getPool } from '../db/pool';
import { GalleryItem, PdfBook, VideoItem } from '@/types';

function toIso(v: string | Date): string {
  return v instanceof Date ? v.toISOString() : v;
}

// ------------------------------- PDFs --------------------------------

interface PdfRow {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  cover_url: string;
  download_url: string;
  pages_count: number;
  language: string;
  created_at: string | Date;
}

function toPdf(row: PdfRow): PdfBook {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    category: row.category,
    coverUrl: row.cover_url,
    downloadUrl: row.download_url,
    pagesCount: row.pages_count,
    language: row.language,
    createdAt: toIso(row.created_at),
  };
}

export async function listPdfs(): Promise<PdfBook[]> {
  const { rows } = await getPool().query<PdfRow>('SELECT * FROM pdfs ORDER BY created_at DESC');
  return rows.map(toPdf);
}

export async function createPdf(input: Partial<PdfBook>): Promise<PdfBook> {
  const { rows } = await getPool().query<PdfRow>(
    `INSERT INTO pdfs (title, author, description, category, cover_url, download_url, pages_count, language)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      input.title,
      input.author,
      input.description || '',
      input.category || 'General Studies',
      input.coverUrl ||
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBlnBaNdt9jJ4GBDAvze8FWARe-A6bXrNEtv8ZCnyn-w&s=10',
      input.downloadUrl || '#',
      input.pagesCount || 0,
      input.language || 'Somali',
    ]
  );
  return toPdf(rows[0]);
}

export async function updatePdf(id: string, updates: Partial<PdfBook>): Promise<PdfBook | null> {
  const { rows } = await getPool().query<PdfRow>(
    `UPDATE pdfs SET
       title = COALESCE($2, title), author = COALESCE($3, author), description = COALESCE($4, description),
       category = COALESCE($5, category), cover_url = COALESCE($6, cover_url), download_url = COALESCE($7, download_url),
       pages_count = COALESCE($8, pages_count), language = COALESCE($9, language)
     WHERE id = $1 RETURNING *`,
    [
      id,
      updates.title ?? null,
      updates.author ?? null,
      updates.description ?? null,
      updates.category ?? null,
      updates.coverUrl ?? null,
      updates.downloadUrl ?? null,
      updates.pagesCount ?? null,
      updates.language ?? null,
    ]
  );
  if (rows.length === 0) return null;
  return toPdf(rows[0]);
}

export async function deletePdf(id: string): Promise<PdfBook | null> {
  const { rows } = await getPool().query<PdfRow>('DELETE FROM pdfs WHERE id = $1 RETURNING *', [id]);
  if (rows.length === 0) return null;
  return toPdf(rows[0]);
}

// ------------------------------ Videos --------------------------------

interface VideoRow {
  id: string;
  title: string;
  description: string;
  youtube_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: string;
  speaker: string;
  created_at: string | Date;
}

function toVideo(row: VideoRow): VideoItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    youtubeId: row.youtube_id ?? undefined,
    videoUrl: row.video_url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    duration: row.duration,
    speaker: row.speaker,
    createdAt: toIso(row.created_at),
  };
}

export async function listVideos(): Promise<VideoItem[]> {
  const { rows } = await getPool().query<VideoRow>('SELECT * FROM videos ORDER BY created_at DESC');
  return rows.map(toVideo);
}

export async function createVideo(input: Partial<VideoItem>): Promise<VideoItem> {
  const { rows } = await getPool().query<VideoRow>(
    `INSERT INTO videos (title, description, youtube_id, video_url, thumbnail_url, duration, speaker)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      input.title,
      input.description || '',
      input.youtubeId || null,
      input.videoUrl || null,
      input.thumbnailUrl || null,
      input.duration || '00:00',
      input.speaker || 'Ustad',
    ]
  );
  return toVideo(rows[0]);
}

export async function updateVideo(id: string, updates: Partial<VideoItem>): Promise<VideoItem | null> {
  const { rows } = await getPool().query<VideoRow>(
    `UPDATE videos SET
       title = COALESCE($2, title), description = COALESCE($3, description),
       youtube_id = COALESCE($4, youtube_id), video_url = COALESCE($5, video_url),
       thumbnail_url = COALESCE($6, thumbnail_url),
       duration = COALESCE($7, duration), speaker = COALESCE($8, speaker)
     WHERE id = $1 RETURNING *`,
    [
      id,
      updates.title ?? null,
      updates.description ?? null,
      updates.youtubeId ?? null,
      updates.videoUrl ?? null,
      updates.thumbnailUrl ?? null,
      updates.duration ?? null,
      updates.speaker ?? null,
    ]
  );
  if (rows.length === 0) return null;
  return toVideo(rows[0]);
}

export async function deleteVideo(id: string): Promise<VideoItem | null> {
  const { rows } = await getPool().query<VideoRow>('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
  if (rows.length === 0) return null;
  return toVideo(rows[0]);
}

// ------------------------------ Gallery --------------------------------

interface GalleryRow {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  created_at: string | Date;
}

function toGalleryItem(row: GalleryRow): GalleryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    category: row.category,
    createdAt: toIso(row.created_at),
  };
}

export async function listGallery(): Promise<GalleryItem[]> {
  const { rows } = await getPool().query<GalleryRow>('SELECT * FROM gallery ORDER BY created_at DESC');
  return rows.map(toGalleryItem);
}

export async function createGalleryItem(input: Partial<GalleryItem>): Promise<GalleryItem> {
  const { rows } = await getPool().query<GalleryRow>(
    `INSERT INTO gallery (title, description, image_url, category) VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      input.title || 'Islamic University Reading Club',
      input.description || '',
      input.imageUrl,
      input.category || 'General',
    ]
  );
  return toGalleryItem(rows[0]);
}

export async function deleteGalleryItem(id: string): Promise<GalleryItem | null> {
  const { rows } = await getPool().query<GalleryRow>('DELETE FROM gallery WHERE id = $1 RETURNING *', [id]);
  if (rows.length === 0) return null;
  return toGalleryItem(rows[0]);
}
