import { revalidatePath } from 'next/cache';

/** Refreshes cached public pages after an admin changes articles. Never throws. */
export function revalidateArticles(slug?: string): void {
  try {
    revalidatePath('/');
    revalidatePath('/articles');
    revalidatePath('/sitemap.xml');
    if (slug) revalidatePath(`/articles/${slug}`);
    else revalidatePath('/articles/[slug]', 'page');
  } catch {
    /* outside a request scope (e.g. tests) — nothing to revalidate */
  }
}
