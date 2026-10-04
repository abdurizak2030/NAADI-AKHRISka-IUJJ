'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellRing, Check, Loader2, Lock, X } from 'lucide-react';
import { useApp } from '../AppProvider';
import { useFollows } from '../../lib/useFollows';
import { useLanguage } from '../../i18n/LanguageContext';
import type { FollowKind } from '../../types';

interface Props {
  kind: FollowKind;
  /** Author name or category name (empty for "all"). */
  value?: string;
  /** Short text used in the modal heading, e.g. the author name. */
  subject?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FollowButton({ kind, value = '', subject, size = 'md', className = '' }: Props) {
  const { token } = useApp();
  const { t } = useLanguage();
  const { isFollowing, follow, unfollow, canFollowSilently } = useFollows(token);
  const following = isFollowing(kind, value);

  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const label = kind === 'all' ? t('ui.subscribe') : t('ui.follow');
  const target = { kind, value };

  const onClick = async () => {
    setError('');
    if (following) {
      setBusy(true);
      await unfollow(target);
      setBusy(false);
      return;
    }
    if (canFollowSilently) {
      setBusy(true);
      const res = await follow(target);
      setBusy(false);
      if (!res.ok) {
        // Remembered email was rejected → fall back to asking.
        setError(res.error || '');
        setOpen(true);
      }
      return;
    }
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await follow(target, email.trim());
    setBusy(false);
    if (!res.ok) {
      setError(res.error || t('ui.genericError'));
      return;
    }
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
    }, 1400);
  };

  const pad = size === 'sm' ? 'px-3.5 py-2 text-xs' : 'px-5 py-2.5 text-sm';

  return (
    <>
      <motion.button
        type="button"
        onClick={onClick}
        disabled={busy}
        whileTap={{ scale: 0.95 }}
        aria-pressed={following}
        className={`inline-flex items-center gap-2 rounded-full font-bold transition-colors cursor-pointer disabled:opacity-70 ${pad} ${
          following
            ? 'bg-emerald-900 text-amber-300 border border-amber-500/40 hover:bg-emerald-800'
            : 'gold-gradient-bg text-emerald-950 shadow-md hover:shadow-lg hover:shadow-amber-500/25'
        } ${className}`}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={following ? 'on' : 'off'} initial={{ scale: 0.4, rotate: -25, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }} className="inline-flex">
              {following ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </motion.span>
          </AnimatePresence>
        )}
        {following ? t('ui.following') : label}
      </motion.button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={t('ui.followTitle')}>
                <button type="button" aria-label="Close" className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm cursor-default" onClick={() => setOpen(false)} />
                <motion.form
                  onSubmit={submit}
                  initial={{ y: 40, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 30, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0d1f16] border border-emerald-800/10 dark:border-amber-500/15 shadow-2xl p-6 sm:p-8"
                >
                  <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 p-2 rounded-full text-gray-400 hover:text-emerald-900 dark:hover:text-amber-300 cursor-pointer" aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                  {done ? (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="w-7 h-7" /></span>
                      <p className="font-display text-lg font-bold text-emerald-950 dark:text-emerald-50">{t('ui.followDone')}</p>
                    </motion.div>
                  ) : (
                    <>
                      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-600"><BellRing className="w-6 h-6" /></span>
                      <h3 className="font-display text-xl font-extrabold text-emerald-950 dark:text-emerald-50">
                        {kind === 'all' ? t('ui.followAllTitle') : `${t('ui.followTitle')} ${subject || value}`}
                      </h3>
                      <p className="mt-1.5 text-sm text-gray-500 dark:text-emerald-100/60">{t('ui.followDesc')}</p>
                      <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300" htmlFor="follow-email">{t('ui.email')}</label>
                      <input id="follow-email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-amber-500/20 bg-white dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-700" />
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400"><Lock className="w-3 h-3" />{t('ui.emailPrivate')}</p>
                      {error && <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600" role="alert">{error}</p>}
                      <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl gold-gradient-bg py-3 text-sm font-bold text-emerald-950 shadow-md disabled:opacity-70 cursor-pointer">
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        {kind === 'all' ? t('ui.subscribe') : t('ui.follow')}
                      </button>
                      <p className="mt-4 text-center text-xs text-gray-500">
                        {t('ui.haveAccount')}{' '}
                        <Link href="/login" className="font-bold text-emerald-800 dark:text-amber-400 hover:underline" onClick={() => setOpen(false)}>{t('ui.signIn')}</Link>
                      </p>
                    </>
                  )}
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
