'use client';

import { useEffect } from 'react';

/** Counts one view per browser session after the reader has actually stayed on the page. */
export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `iuj_viewed_${articleId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
    } catch {
      /* storage unavailable — still count once per mount */
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/articles/${articleId}/view`, { method: 'POST', keepalive: true })
        .then(() => {
          try {
            window.sessionStorage.setItem(key, '1');
          } catch {
            /* ignore */
          }
        })
        .catch(() => {});
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [articleId]);
  return null;
}
