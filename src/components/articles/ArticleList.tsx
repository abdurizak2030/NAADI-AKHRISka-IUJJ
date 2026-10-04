'use client';

/**
 * Filterable article grid with "load more" + auto infinite scroll. The first page is
 * rendered on the server (fast + indexable); later pages stream in from /api/articles?page=N.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Search, X } from 'lucide-react';
import ArticleCard, { ArticleCardSkeleton } from './ArticleCard';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Article, ArticlePage, TaxonomyEntry } from '../../types';

export interface ArticleFilters {
  q: string;
  category: string;
  language: string;
  author: string;
  tag: string;
}

const PAGE_SIZE = 9;

function toQuery(f: ArticleFilters, page: number): string {
  const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  (Object.keys(f) as (keyof ArticleFilters)[]).forEach((k) => f[k] && p.set(k, f[k]));
  return p.toString();
}

export default function ArticleList({ initial, categories, filters }: { initial: ArticlePage; categories: TaxonomyEntry[]; filters: ArticleFilters }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname() || '/articles';
  const [items, setItems] = useState<Article[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(filters.q);
  const sentinel = useRef<HTMLDivElement>(null);

  // New server page (filters changed) → reset.
  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
    setHasMore(initial.hasMore);
    setTotal(initial.total);
  }, [initial]);

  const navigate = useCallback(
    (patch: Partial<ArticleFilters>) => {
      const next = { ...filters, ...patch };
      const p = new URLSearchParams();
      (Object.keys(next) as (keyof ArticleFilters)[]).forEach((k) => next[k] && p.set(k, next[k]));
      router.push(p.toString() ? `${pathname}?${p}` : pathname, { scroll: false });
    },
    [filters, router, pathname]
  );

  // Debounced search → URL (so results are shareable/back-button friendly).
  useEffect(() => {
    if (search === filters.q) return;
    const id = setTimeout(() => navigate({ q: search.trim() }), 350);
    return () => clearTimeout(id);
  }, [search, filters.q, navigate]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/articles?${toQuery(filters, page + 1)}`);
      if (res.ok) {
        const data: ArticlePage = await res.json();
        setItems((prev) => [...prev, ...data.items.filter((n) => !prev.some((p) => p.id === n.id))]);
        setPage(data.page);
        setHasMore(data.hasMore);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, filters, page]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  const [featured, ...rest] = items;
  const showFeatured = Boolean(featured) && !filters.q && !filters.category && !filters.author && !filters.tag && !filters.language && page >= 1;
  const gridItems = showFeatured ? rest : items;
  const active = [filters.category, filters.author, filters.tag && `#${filters.tag}`, filters.language].filter(Boolean);

  const chip = (on: boolean) => `whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${on ? 'bg-emerald-900 text-amber-300 shadow-md' : 'bg-white dark:bg-[#0d1f16] text-emerald-900 dark:text-emerald-100/80 border border-emerald-900/10 dark:border-amber-500/15 hover:border-amber-500/50'}`;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:px-0" role="tablist" aria-label="Categories">
          <button type="button" className={chip(!filters.category)} onClick={() => navigate({ category: '' })}>{t('ui.all')}</button>
          {categories.map((c) => (
            <button key={c.name} type="button" className={chip(filters.category === c.name)} onClick={() => navigate({ category: c.name })}>
              {c.name} <span className="opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Language" value={filters.language} onChange={(e) => navigate({ language: e.target.value })} className="rounded-xl border border-emerald-900/10 dark:border-amber-500/20 bg-white dark:bg-[#0d1f16] px-3 py-2.5 text-xs font-bold text-emerald-900 dark:text-amber-300">
            <option value="">{t('ui.allLanguages')}</option>
            <option>Somali</option>
            <option>Arabic</option>
            <option>English</option>
          </select>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('articlesPage.searchPlaceholder')} aria-label={t('nav.search')} className="w-full rounded-xl border border-emerald-900/10 dark:border-amber-500/20 bg-white dark:bg-[#0d1f16] py-2.5 pl-10 pr-3 text-sm text-emerald-950 dark:text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500">{total} {t('ui.results')}:</span>
          {active.map((a) => <span key={a} className="rounded-full bg-amber-400/20 px-3 py-1 font-bold text-emerald-900 dark:text-amber-300">{a}</span>)}
          <button type="button" onClick={() => { setSearch(''); router.push(pathname, { scroll: false }); }} className="inline-flex items-center gap-1 font-bold text-red-500 hover:underline cursor-pointer"><X className="w-3 h-3" />{t('ui.clear')}</button>
        </div>
      )}

      {items.length === 0 && (
        <div className="mt-16 rounded-3xl border border-dashed border-emerald-900/20 dark:border-amber-500/20 p-14 text-center text-gray-500">{t('ui.noArticles')}</div>
      )}

      {showFeatured && featured && (
        <div className="mt-8"><ArticleCard article={featured} featured priority /></div>
      )}

      <motion.div layout className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" id="articles-list-grid">
        <AnimatePresence initial={false}>
          {gridItems.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i % PAGE_SIZE, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
              <ArticleCard article={a} priority={i < 3} />
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && [0, 1, 2].map((i) => <ArticleCardSkeleton key={`s${i}`} />)}
      </motion.div>

      <div ref={sentinel} className="h-10" aria-hidden="true" />
      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button type="button" onClick={loadMore} className="rounded-xl border border-emerald-900/15 dark:border-amber-500/25 px-8 py-3 text-sm font-bold text-emerald-900 dark:text-amber-300 hover:bg-amber-400/10 cursor-pointer">{t('ui.loadMore')}</button>
        </div>
      )}
      {loading && <div className="mt-4 flex justify-center text-amber-500"><Loader2 className="w-5 h-5 animate-spin" /></div>}
    </div>
  );
}
