/**
 * Server-side data access for public (Server Component) pages.
 * Every function swallows DB failures and returns an empty value so a cold or
 * unreachable database never takes a public page down.
 */
import { ensureDatabase } from './route-helpers';
import {
  getAdjacentArticles,
  getArticleBySlug,
  getRelatedArticles,
  listArticleCards,
  listPublishedCategories,
  listPublishedForSitemap,
} from './repositories/articles.repository';
import { listPdfs, listVideos, listGallery } from './repositories/media.repository';
import { getFounder, getMemberOfMonth, getSettings, listTestimonials } from './repositories/content.repository';
import { listEvents } from './repositories/events.repository';
import type { ArticlePage, ClubEvent, ClubSettings, FounderInfo, GalleryItem, MemberOfMonth, PdfBook, Testimonial, TaxonomyEntry, VideoItem } from '../../types';

async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    if (!(await ensureDatabase())) return fallback;
    return await fn();
  } catch (err) {
    console.error('[public-data]', err instanceof Error ? err.message : err);
    return fallback;
  }
}

export const getPublicSettings = () => safe<ClubSettings | null>(null, () => getSettings());

export const getArticleCards = (opts: Parameters<typeof listArticleCards>[0]) =>
  safe<ArticlePage>({ items: [], total: 0, page: 1, pageSize: opts.pageSize ?? 9, hasMore: false }, async () => {
    const { items, total } = await listArticleCards(opts);
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 9;
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  });

export const getCategories = () => safe<TaxonomyEntry[]>([], () => listPublishedCategories());

/**
 * Article page bundle. Returns null ONLY when the article truly does not
 * exist. If the database is unreachable this throws, so Next keeps serving the
 * last good cached page instead of caching a bogus 404.
 */
export async function getArticlePageData(slugOrId: string) {
  if (!(await ensureDatabase())) throw new Error('Database unavailable');
  const article = await getArticleBySlug(slugOrId);
  if (!article) return null;
  const [related, adjacent] = await Promise.all([getRelatedArticles(article, 3), getAdjacentArticles(article)]);
  return { article, related, adjacent };
}

export const getSitemapArticles = () => safe<{ slug: string; updatedAt: string }[]>([], () => listPublishedForSitemap());
export const getBooks = () => safe<PdfBook[]>([], () => listPdfs());
export const getVideos = () => safe<VideoItem[]>([], () => listVideos());
export const getGalleryItems = () => safe<GalleryItem[]>([], () => listGallery());
export const getEvents = () => safe<ClubEvent[]>([], () => listEvents());
export const getFounderInfo = () => safe<FounderInfo | null>(null, () => getFounder());
export const getMemberOfTheMonth = () => safe<MemberOfMonth | null>(null, () => getMemberOfMonth());
export const getTestimonialList = () => safe<Testimonial[]>([], () => listTestimonials());
