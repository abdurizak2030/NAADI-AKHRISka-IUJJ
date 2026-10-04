/**
 * Site-wide constants + absolute URL helpers.
 *
 * NEXT_PUBLIC_SITE_URL may be set with or without a trailing slash; it is
 * normalised here so share links are always `https://host/articles/<slug>`.
 */
export const SITE_NAME = 'IUJ Reading Club';
export const SITE_TAGLINE = 'Naadiga Akhriska — Islamic University of Jigjiga';
export const SITE_DESCRIPTION =
  'A digital reading club for the Islamic University of Jigjiga: articles, a digital library, lectures and a community of readers.';

export const SITE_URL: string = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function articlePath(slug: string): string {
  return `/articles/${slug}`;
}

export function articleUrl(slug: string): string {
  return absoluteUrl(articlePath(slug));
}
