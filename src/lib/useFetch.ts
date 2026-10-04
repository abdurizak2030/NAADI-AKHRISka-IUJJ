'use client';

import { useEffect, useState } from 'react';

/** Minimal GET hook for list endpoints: { data, loading }. Re-fetches when `url` or `reload` changes. */
export function useFetch<T>(url: string | null, initial: T, reload = 0): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState<boolean>(Boolean(url));

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json !== null && json !== undefined) setData(json as T);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [url, reload]);

  return { data, loading };
}
