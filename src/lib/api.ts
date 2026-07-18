/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Central place that knows where the backend API lives.
 *
 * This app is now a single Next.js deployment: the Route Handlers under
 * src/app/api/** are served from the SAME origin as the page itself, so
 * every request can simply use a relative path — no cross-origin base
 * URL is needed anymore (unlike the original split Vercel+Railway setup).
 * API_BASE_URL is kept (as an empty string) so existing component code
 * that imports it/apiUrl()/mediaUrl() keeps working unchanged.
 */
export const API_BASE_URL: string = '';

/** Builds a URL for an `/api/...` call. Same-origin, so this is just the path itself. */
export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE_URL}${path}`;
}

/**
 * Resolves a media URL returned by the backend (avatars, article covers,
 * gallery photos, chat attachments, uploaded videos, etc).
 *
 * All uploaded files are stored on Cloudinary, which always returns
 * absolute `https://res.cloudinary.com/...` URLs — those are returned
 * untouched, as are any other already-absolute URLs (e.g.
 * https://images.unsplash.com/..., YouTube thumbnails) and empty/undefined
 * values.
 */
export function mediaUrl<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}` as T;
}
