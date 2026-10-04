'use client';

/** Footer — same three-column structure as before, now using real links. */
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../i18n/LanguageContext';
import { useApp } from './AppProvider';

const social = {
  facebook: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z',
  x: 'M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.3 22H1.2l8.1-9.3L1 2h7.3l5 6.6L18.9 2Zm-1.2 18h1.8L7 3.9H5l12.7 16.1Z',
  tiktok: 'M16.6 5.82c-.9-.6-1.6-1.5-1.85-2.62-.05-.24-.09-.48-.1-.72h-3.4v13.86c0 1.5-1.22 2.72-2.72 2.72a2.72 2.72 0 0 1-2.72-2.72 2.72 2.72 0 0 1 2.72-2.72c.28 0 .55.04.8.12v-3.46a6.18 6.18 0 0 0-.8-.05 6.19 6.19 0 0 0-6.19 6.19 6.19 6.19 0 0 0 6.19 6.19 6.19 6.19 0 0 0 6.19-6.19V8.44a8.16 8.16 0 0 0 4.76 1.52V6.55c-.96 0-1.98-.28-2.88-.73Z',
};

export default function SiteFooter() {
  const { t } = useLanguage();
  const { settings } = useApp();
  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/articles', label: t('nav.articles') },
    { href: '/library', label: t('nav.library') },
    { href: '/videos', label: t('nav.videos') },
    { href: '/events', label: t('nav.events') },
    { href: '/about', label: t('nav.aboutClub') },
    { href: '/contact', label: t('nav.contact') },
  ];
  const socials = [
    { url: settings?.facebookUrl, label: 'Facebook', path: social.facebook },
    { url: settings?.xUrl, label: 'X (Twitter)', path: social.x },
    { url: settings?.tiktokUrl, label: 'TikTok', path: social.tiktok },
  ].filter((s) => s.url);

  return (
    <footer className="bg-emerald-950 text-white border-t border-amber-500/20 py-12 mt-8" id="club-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-3">
          <h4 className="text-amber-400 font-bold text-sm tracking-widest uppercase">{t('nav.brandName')}</h4>
          <p className="text-emerald-100/70 text-xs max-w-sm leading-relaxed">{t('footer.tagline')}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider">{t('footer.quickLinks')}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-emerald-200">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-amber-300 transition-colors w-fit">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs text-emerald-200">
          <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider">{t('footer.contactHeading')}</h4>
          <p>{t('footer.emailPrefix')} {settings?.contactEmail || 'readingclub@jigjiga.edu'}</p>
          <p>{t('footer.phonePrefix')} {settings?.contactPhone || '+251 902 817 476'}</p>
          <p>{t('footer.locationLabel')}</p>
          {socials.length > 0 && (
            <div className="flex items-center gap-2.5 pt-2">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-9 h-9 rounded-full bg-emerald-900 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500 hover:text-emerald-950 text-emerald-200 transition-all hover:-translate-y-0.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-emerald-900 text-center text-xs text-emerald-300/50 font-serif">
        &copy; {new Date().getFullYear()} {t('footer.copyright')}
      </div>
    </footer>
  );
}
