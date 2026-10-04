/**
 * Anonymous visitor identity (client only).
 *
 * Likes and bookmarks work without an account. A random id kept in
 * localStorage is sent as `x-visitor-id`, so one reader's like/bookmark is
 * not mixed up with another reader behind the same network.
 */
const KEY = 'iuj_visitor_id';

export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || !/^[a-zA-Z0-9_-]{16,96}$/.test(id)) {
      const bytes = new Uint8Array(18);
      window.crypto.getRandomValues(bytes);
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function apiHeaders(token?: string | null, json = false): Record<string, string> {
  const headers: Record<string, string> = {};
  const visitor = getVisitorId();
  if (visitor) headers['x-visitor-id'] = visitor;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}
