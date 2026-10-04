/**
 * Clean, URL-safe article slugs.
 *
 * Titles are transliterated to ASCII (diacritics stripped). Titles that
 * contain no Latin letters at all (e.g. a purely Arabic title) fall back to
 * `article-<random>` so the URL always stays short, readable and copy-safe;
 * admins can still type any slug they like in the article editor.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function makeUniqueSlug(title: string, used: Set<string>): string {
  const base = slugify(title) || `article-${Math.random().toString(36).slice(2, 8)}`;
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) candidate = `${base}-${n++}`;
  return candidate;
}
