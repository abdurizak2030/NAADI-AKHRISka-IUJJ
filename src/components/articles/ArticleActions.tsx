'use client';

/**
 * Like / bookmark / share / comment-jump with live counters.
 * Rendered twice from one state: a sticky rail on large screens and a thumb-reachable
 * bottom bar on phones (so share + bookmark are always one tap away).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useApp } from '../AppProvider';
import { apiHeaders } from '../../lib/visitor';
import { compactNumber } from '../../lib/format';
import { useLanguage } from '../../i18n/LanguageContext';
import ShareMenu from './ShareMenu';

interface Props {
  articleId: string;
  title: string;
  path: string;
  absoluteUrl: string;
  initial: { likes: number; views: number; shares: number; comments: number };
}

function HeartBurst({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-red-400"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos((i * Math.PI) / 3) * 22, y: Math.sin((i * Math.PI) / 3) * 22, opacity: 0, scale: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

export default function ArticleActions({ articleId, title, path, absoluteUrl, initial }: Props) {
  const { token } = useApp();
  const { t } = useLanguage();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [counts, setCounts] = useState(initial);
  const [burst, setBurst] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState('');

  // Per-reader state is fetched client-side so the article page itself stays fully cacheable.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/articles/${articleId}/state`, { headers: apiHeaders(token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!s || cancelled) return;
        setLiked(s.liked);
        setBookmarked(s.bookmarked);
        setCounts({ likes: s.likesCount, views: s.viewsCount, shares: s.sharesCount, comments: s.commentsCount });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [articleId, token]);

  // Keep the comment counter in sync when a comment is posted below.
  useEffect(() => {
    const onComment = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail ?? 1;
      setCounts((c) => ({ ...c, comments: Math.max(0, c.comments + delta) }));
    };
    window.addEventListener('article:comment', onComment);
    return () => window.removeEventListener('article:comment', onComment);
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const toggleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setCounts((c) => ({ ...c, likes: Math.max(0, c.likes + (next ? 1 : -1)) }));
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 520);
    }
    try {
      const res = await fetch(`/api/articles/${articleId}/like`, { method: 'POST', headers: apiHeaders(token) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCounts((c) => ({ ...c, likes: data.likesCount }));
    } catch {
      setLiked(!next);
      setCounts((c) => ({ ...c, likes: Math.max(0, c.likes + (next ? -1 : 1)) }));
    }
  }, [liked, articleId, token]);

  const toggleBookmark = useCallback(async () => {
    const next = !bookmarked;
    setBookmarked(next);
    flash(next ? t('ui.saved') : t('ui.removed'));
    try {
      const res = await fetch(`/api/articles/${articleId}/bookmark`, { method: 'POST', headers: apiHeaders(token) });
      if (!res.ok) throw new Error();
      setBookmarked((await res.json()).bookmarked);
    } catch {
      setBookmarked(!next);
    }
  }, [bookmarked, articleId, token, t]);

  const registerShare = useCallback(() => {
    setCounts((c) => ({ ...c, shares: c.shares + 1 }));
    fetch(`/api/articles/${articleId}/share`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [articleId]);

  const jumpToComments = () => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const btn = 'relative flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors cursor-pointer';

  const likeButton = (
    <motion.button type="button" onClick={toggleLike} whileTap={{ scale: 0.88 }} aria-pressed={liked} aria-label={t('ui.like')} className={`${btn} h-14 w-14 ${liked ? 'text-red-500' : 'text-gray-500 dark:text-emerald-100/60 hover:text-red-500'}`}>
      <span className="relative">
        <motion.span animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.35 }} className="block">
          <Heart className={`h-5 w-5 ${liked ? 'fill-red-500' : ''}`} />
        </motion.span>
        <HeartBurst active={burst} />
      </span>
      <span className="text-[11px] font-bold tabular-nums">{compactNumber(counts.likes)}</span>
    </motion.button>
  );

  const bookmarkButton = (
    <motion.button type="button" onClick={toggleBookmark} whileTap={{ scale: 0.88 }} aria-pressed={bookmarked} aria-label={t('ui.bookmark')} className={`${btn} h-14 w-14 ${bookmarked ? 'text-amber-500' : 'text-gray-500 dark:text-emerald-100/60 hover:text-amber-500'}`}>
      <motion.span animate={bookmarked ? { y: [0, -4, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.35 }} className="block">
        <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-amber-500' : ''}`} />
      </motion.span>
      <span className="text-[11px] font-bold">{bookmarked ? t('ui.saved') : t('ui.save')}</span>
    </motion.button>
  );

  const shareButton = (
    <motion.button type="button" onClick={() => setShareOpen(true)} whileTap={{ scale: 0.9 }} aria-label={t('ui.shareArticle')} aria-haspopup="dialog" className={`${btn} h-14 w-14 text-gray-500 dark:text-emerald-100/60 hover:text-emerald-800 dark:hover:text-amber-300`}>
      <Share2 className="h-5 w-5" />
      <span className="text-[11px] font-bold tabular-nums">{counts.shares > 0 ? compactNumber(counts.shares) : t('ui.share')}</span>
    </motion.button>
  );

  const commentButton = (
    <button type="button" onClick={jumpToComments} aria-label={t('ui.comments')} className={`${btn} h-14 w-14 text-gray-500 dark:text-emerald-100/60 hover:text-emerald-800 dark:hover:text-amber-300`}>
      <MessageCircle className="h-5 w-5" />
      <span className="text-[11px] font-bold tabular-nums">{compactNumber(counts.comments)}</span>
    </button>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden lg:block sticky top-28 self-start" aria-label="Article actions">
        <div className="flex flex-col items-center gap-1 rounded-3xl border border-emerald-900/10 dark:border-amber-500/15 bg-white/80 dark:bg-[#0d1f16]/80 backdrop-blur-xl p-2 shadow-lg">
          {likeButton}
          {commentButton}
          {bookmarkButton}
          {shareButton}
          <div className="mt-1 flex flex-col items-center gap-0.5 border-t border-emerald-900/10 dark:border-amber-500/10 pt-2 text-gray-400" title={`${counts.views} views`}>
            <Eye className="h-4 w-4" />
            <span className="text-[11px] font-bold tabular-nums">{compactNumber(counts.views)}</span>
          </div>
        </div>
      </aside>

      {/* Mobile / tablet bottom bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.4 }} className="pointer-events-auto mx-auto flex max-w-sm items-center justify-around rounded-3xl border border-emerald-900/10 dark:border-amber-500/20 bg-white/90 dark:bg-[#0d1f16]/90 backdrop-blur-xl p-1.5 shadow-[0_12px_40px_-10px_rgba(8,71,32,0.5)]">
          {likeButton}
          {commentButton}
          {bookmarkButton}
          {shareButton}
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 lg:bottom-8 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-emerald-950 px-5 py-2.5 text-xs font-bold text-amber-300 shadow-xl" role="status">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ShareMenu open={shareOpen} onClose={() => setShareOpen(false)} title={title} path={path} fallbackUrl={absoluteUrl} onShared={registerShare} />
    </>
  );
}
