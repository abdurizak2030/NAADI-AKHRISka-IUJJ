'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Lock, MessageCircle, Send } from 'lucide-react';
import { useApp } from '../AppProvider';
import { apiHeaders } from '../../lib/visitor';
import { formatDate } from '../../lib/format';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Comment } from '../../types';

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * Public comments show ONLY name, comment and date. The email is collected for
 * moderation/contact, stored privately, and never returned by the public API.
 */
export default function CommentSection({ articleId }: { articleId: string }) {
  const { user, token } = useApp();
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/articles/${articleId}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => !cancelled && setComments(Array.isArray(d) ? d : []))
      .catch(() => !cancelled && setComments([]));
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  useEffect(() => {
    if (user) {
      setName((n) => n || user.name);
      setEmail((e) => e || user.email);
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify({ authorName: name.trim(), email: email.trim(), content: text.trim(), website: trap }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('ui.genericError'));
        return;
      }
      setComments((prev) => [data, ...(prev ?? [])]);
      setText('');
      setOk(true);
      window.dispatchEvent(new CustomEvent('article:comment', { detail: 1 }));
      setTimeout(() => setOk(false), 3500);
    } catch {
      setError(t('ui.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-xl border border-gray-200 dark:border-amber-500/20 bg-white dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-50 outline-none transition focus:ring-2 focus:ring-emerald-700 focus:border-transparent';

  return (
    <section id="comments" className="scroll-mt-28" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="font-display text-2xl font-extrabold text-emerald-950 dark:text-emerald-50 flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-amber-500" />
        {t('ui.discussion')} {comments && <span className="text-base font-bold text-gray-400">({comments.length})</span>}
      </h2>

      <form onSubmit={submit} className="mt-6 rounded-3xl border border-emerald-900/10 dark:border-amber-500/15 bg-white dark:bg-[#0d1f16] p-5 sm:p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300">{t('ui.name')}</label>
            <input id="c-name" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="c-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300">{t('ui.email')}</label>
            <input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" />
          </div>
        </div>
        {/* Honeypot: invisible to people, tempting to bots. */}
        <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} className="hidden" aria-hidden="true" name="website" />
        <div>
          <label htmlFor="c-text" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300">{t('ui.comment')}</label>
          <textarea id="c-text" required minLength={2} maxLength={2000} rows={4} value={text} onChange={(e) => setText(e.target.value)} className={`${field} resize-y`} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400"><Lock className="w-3 h-3" />{t('ui.emailPrivate')}</p>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-bold text-amber-300 transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60 cursor-pointer">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('ui.postComment')}
          </button>
        </div>
        <AnimatePresence>
          {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600" role="alert">{error}</motion.p>}
          {ok && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300" role="status">{t('ui.commentPosted')}</motion.p>}
        </AnimatePresence>
      </form>

      <ul className="mt-8 space-y-4">
        {comments === null && [0, 1].map((i) => <li key={i} className="h-24 rounded-2xl skeleton" aria-hidden="true" />)}
        {comments?.length === 0 && <li className="rounded-2xl border border-dashed border-emerald-900/15 dark:border-amber-500/20 p-8 text-center text-sm text-gray-400">{t('ui.noComments')}</li>}
        <AnimatePresence initial={false}>
          {comments?.map((c) => (
            <motion.li key={c.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 rounded-2xl border border-emerald-900/10 dark:border-amber-500/10 bg-white dark:bg-[#0d1f16] p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-xs font-bold text-amber-300" aria-hidden="true">{initials(c.authorName)}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-bold text-emerald-950 dark:text-emerald-50">{c.authorName}</span>
                  <time className="text-xs text-gray-400" dateTime={c.createdAt}>{formatDate(c.createdAt)}</time>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 dark:text-emerald-100/75">{c.content}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
