'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, FileText, Play, Search } from 'lucide-react';
import { mediaUrl } from '../lib/api';
import { formatDate } from '../lib/format';
import { useLanguage } from '../i18n/LanguageContext';
import type { SearchResult } from '../types';

const meta = { article: { icon: FileText, label: 'Articles' }, book: { icon: BookOpen, label: 'Books' }, video: { icon: Play, label: 'Videos' } } as const;

export default function SearchResultsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const q = useSearchParams()?.get('q') ?? '';
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    setInput(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setResults(null);
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setResults(Array.isArray(d) ? d : []))
      .catch(() => setResults([]));
  }, [q]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <form onSubmit={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(input.trim())}`); }} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('ui.searchPlaceholder')} aria-label="Search" className="w-full rounded-2xl border border-emerald-900/10 dark:border-amber-500/20 bg-white dark:bg-[#0d1f16] py-4 pl-12 pr-4 text-base text-emerald-950 dark:text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-700" />
      </form>

      {results === null && <div className="mt-8 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}</div>}
      {results && q.trim().length >= 2 && results.length === 0 && <p className="mt-16 text-center text-gray-500">{t('ui.noResults')}</p>}

      {results && (['article', 'book', 'video'] as const).map((type) => {
        const list = results.filter((r) => r.type === type);
        if (!list.length) return null;
        const M = meta[type];
        return (
          <section key={type} className="mt-10">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-emerald-950 dark:text-emerald-50"><M.icon className="h-5 w-5 text-amber-500" />{M.label} <span className="text-sm text-gray-400">({list.length})</span></h2>
            <ul className="mt-4 space-y-3">
              {list.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link href={r.href} className="flex items-center gap-4 rounded-2xl border border-emerald-900/10 dark:border-amber-500/15 bg-white dark:bg-[#0d1f16] p-3 transition hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-md">
                    <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-900/10">
                      {r.imageUrl ? <img src={mediaUrl(r.imageUrl)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <M.icon className="h-6 w-6 text-emerald-800/40" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      {r.category && <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{r.category}</span>}
                      <span className="block truncate font-bold text-emerald-950 dark:text-emerald-50">{r.title}</span>
                      {r.description && <span className="line-clamp-2 text-xs text-gray-500">{r.description}</span>}
                    </span>
                    {r.date && <span className="hidden shrink-0 text-xs text-gray-400 sm:block">{formatDate(r.date)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
