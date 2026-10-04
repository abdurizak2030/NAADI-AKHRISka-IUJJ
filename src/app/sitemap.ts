import type { MetadataRoute } from 'next';
import { getSitemapArticles } from '@/lib/server/public-data';
import { absoluteUrl, articleUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getSitemapArticles();
  const pages = ['/', '/articles', '/library', '/videos', '/events', '/about', '/contact'];
  return [
    ...pages.map((p) => ({ url: absoluteUrl(p), changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.7 })),
    ...articles.map((a) => ({ url: articleUrl(a.slug), lastModified: a.updatedAt, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}
