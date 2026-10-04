'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const ICONS: Record<string, { path: string; color: string; label: string }> = {
  facebook: { label: 'Facebook', color: '#1877F2', path: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z' },
  whatsapp: { label: 'WhatsApp', color: '#25D366', path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' },
  telegram: { label: 'Telegram', color: '#26A5E4', path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  x: { label: 'X / Twitter', color: '#111111', path: 'M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.3 22H1.2l8.1-9.3L1 2h7.3l5 6.6L18.9 2Zm-1.2 18h1.8L7 3.9H5l12.7 16.1Z' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
};

function shareLink(network: string, url: string, title: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  switch (network) {
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case 'whatsapp': return `https://wa.me/?text=${t}%20${u}`;
    case 'telegram': return `https://t.me/share/url?url=${u}&text=${t}`;
    case 'x': return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    default: return url;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Path such as /articles/my-slug — the full URL is built from the page's own origin. */
  path: string;
  /** Server-rendered absolute URL, used until the browser origin is known. */
  fallbackUrl: string;
  onShared?: () => void;
}

export default function ShareMenu({ open, onClose, title, path, fallbackUrl, onShared }: Props) {
  const { t } = useLanguage();
  const [url, setUrl] = useState(fallbackUrl);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);

  useEffect(() => {
    // The exact URL the visitor is reading: origin + clean article path (no query/hash tracking noise).
    setUrl(`${window.location.origin}${path}`);
    setCanNative(typeof navigator.share === 'function');
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const copy = async () => {
    if (await copyText(url)) {
      setCopied(true);
      onShared?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={t('ui.shareArticle')}>
          <button type="button" aria-label="Close" className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm cursor-default" onClick={onClose} />
          <motion.div initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0d1f16] border border-emerald-800/10 dark:border-amber-500/15 shadow-2xl p-6 pb-8 sm:p-7">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200 dark:bg-white/15 sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-emerald-950 dark:text-emerald-50 flex items-center gap-2"><Share2 className="w-5 h-5 text-amber-500" />{t('ui.shareArticle')}</h3>
              <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-emerald-900 dark:hover:text-amber-300 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-emerald-100/60 line-clamp-2">{title}</p>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {Object.entries(ICONS).map(([key, meta], i) => (
                <motion.a
                  key={key}
                  href={shareLink(key, url, title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    onShared?.();
                    setTimeout(onClose, 150);
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  whileHover={{ y: -3 }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl p-2 text-[10px] font-semibold text-gray-600 dark:text-emerald-100/70 hover:bg-emerald-800/5 dark:hover:bg-white/5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md" style={{ backgroundColor: meta.color }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d={meta.path} /></svg>
                  </span>
                  <span className="truncate max-w-full">{meta.label}</span>
                </motion.a>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-amber-500/20 p-1.5 pl-4">
              <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Article link" className="min-w-0 flex-1 bg-transparent text-xs text-gray-600 dark:text-emerald-100/70 outline-none" />
              <button type="button" onClick={copy} className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${copied ? 'bg-emerald-600 text-white' : 'bg-emerald-900 text-amber-300 hover:bg-emerald-800'}`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('ui.copied') : t('ui.copyLink')}
              </button>
            </div>
            {canNative && (
              <button type="button" onClick={() => navigator.share({ title, url }).then(() => onShared?.()).catch(() => {})} className="mt-3 w-full rounded-xl border border-emerald-800/15 dark:border-amber-500/20 py-2.5 text-xs font-bold text-emerald-900 dark:text-amber-300 cursor-pointer hover:bg-emerald-800/5">
                {t('ui.moreOptions')}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
