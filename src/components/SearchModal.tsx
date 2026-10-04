'use client';

/**
 * Global search across articles, books and videos. Debounced, cancels stale
 * requests, keyboard navigable (↑ ↓ Enter, Esc) and animated.
 */
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, FileText, Loader2, Play, Search, X } from 'lucide-react';
import { mediaUrl } from '../lib/api';
import { formatDate } from '../lib/format';
import { useLanguage } from '../i18n/LanguageContext';
import { useApp } from './AppProvider';
import type { SearchResult } from '../types';

const typeMeta = {
  article: { icon: FileText, label: 'Article' },
  book: { icon: BookOpen, label: 'Book' },
  video: { icon: Play, label: 'Video' },
} as const;

export default function SearchModal() {
  const { searchOpen, closeSearch } = useApp();
  const { t } = useLanguage();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQ('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [searchOpen]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=5`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
          setActive(0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const go = (href: string) => {
    closeSearch();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeSearch();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) go(results[active].href);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[10vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} role="dialog" aria-modal="true" aria-label={t('nav.search')} onKeyDown={onKeyDown}>
          <button type="button" aria-label="Close search" className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm cursor-default" onClick={closeSearch} />
          <motion.div initial={{ opacity: 0, y: -14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0d1f16] border border-emerald-800/10 dark:border-amber-500/15 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 border-b border-emerald-800/10 dark:border-amber-500/10">
              {loading ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" /> : <Search className="w-5 h-5 text-emerald-800/60 dark:text-amber-300/70 shrink-0" />}
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ui.searchPlaceholder')} className="flex-1 py-5 bg-transparent outline-none text-base text-emerald-950 dark:text-emerald-50 placeholder:text-gray-400" aria-label={t('nav.search')} />
              <button type="button" onClick={closeSearch} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-900 dark:hover:text-amber-300 cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {q.trim().length < 2 && <p className="px-4 py-10 text-center text-sm text-gray-400">{t('ui.searchHint')}</p>}
              {q.trim().length >= 2 && !loading && results.length === 0 && <p className="px-4 py-10 text-center text-sm text-gray-400">{t('ui.noResults')}</p>}
              {results.map((r, i) => {
                const Meta = typeMeta[r.type];
                return (
                  <Link key={`${r.type}-${r.id}`} href={r.href} onClick={closeSearch} onMouseEnter={() => setActive(i)} className={`flex items-center gap-4 p-3 rounded-2xl transition-colors ${i === active ? 'bg-amber-400/15' : 'hover:bg-emerald-800/5'}`}>
                    <span className="relative w-16 h-16 rounded-xl overflow-hidden bg-emerald-900/10 shrink-0 flex items-center justify-center">
                      {r.imageUrl ? (
                        <img src={mediaUrl(r.imageUrl)} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Meta.icon className="w-6 h-6 text-emerald-800/50" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        <Meta.icon className="w-3 h-3" /> {Meta.label}
                        {r.category && <span className="text-emerald-800/60 dark:text-emerald-200/60 normal-case tracking-normal font-semibold">· {r.category}</span>}
                      </span>
                      <span className="block font-bold text-emerald-950 dark:text-emerald-50 truncate">{r.title}</span>
                      {r.description && <span className="block text-xs text-gray-500 line-clamp-1">{r.description}</span>}
                    </span>
                    {r.date && <span className="hidden sm:block text-[11px] text-gray-400 shrink-0">{formatDate(r.date)}</span>}
                  </Link>
                );
              })}
            </div>

            {q.trim().length >= 2 && (
              <div className="px-5 py-3 border-t border-emerald-800/10 dark:border-amber-500/10 text-xs text-gray-400 flex items-center justify-between">
                <span>↑ ↓ · Enter · Esc</span>
                <button type="button" onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="font-bold text-emerald-800 dark:text-amber-400 hover:underline cursor-pointer">
                  {t('ui.seeAllResults')} →
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
