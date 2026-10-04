'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

/** Shared page title block with a gentle entrance animation. */
export default function PageHeader({ eyebrowKey, titleKey, subtitleKey, action }: { eyebrowKey: string; titleKey: string; subtitleKey?: string; action?: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-400/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">{t(eyebrowKey)}</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50 sm:text-5xl">{t(titleKey)}</h1>
        {subtitleKey && <p className="mt-3 text-base leading-relaxed text-gray-500 dark:text-emerald-100/60">{t(subtitleKey)}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
