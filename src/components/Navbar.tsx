'use client';

/**
 * Sticky glass navigation. Real <Link>s (so every page is a shareable URL,
 * prefetched by Next), animated active indicator, mobile sheet, global search,
 * theme + language switchers and the existing member/admin entry points.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Menu, X, Sun, Moon, Languages, LogOut, ShieldAlert, User as UserIcon } from 'lucide-react';
import { mediaUrl } from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from './AppProvider';

const languageOptions: { code: 'en' | 'ar' | 'so' | 'am'; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'so', label: 'Soomaali' },
  { code: 'am', label: 'አማርኛ' },
];

export default function Navbar() {
  const pathname = usePathname() || '/';
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, openSearch } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/articles', label: t('nav.articles') },
    { href: '/library', label: t('nav.library') },
    { href: '/videos', label: t('nav.videos') },
    { href: '/about', label: t('nav.aboutClub') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    setMobileOpen(false);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="site-header sticky top-0 z-50 px-3 sm:px-6 pt-3" id="main-header">
      <div className="max-w-7xl mx-auto">
        <div
          className={`site-nav flex items-center justify-between gap-2 h-16 sm:h-[68px] backdrop-blur-xl rounded-2xl border px-3 sm:px-5 transition-all duration-300 ${
            scrolled
              ? 'bg-white/90 dark:bg-emerald-950/90 border-emerald-800/10 dark:border-amber-500/15 shadow-[0_10px_34px_-14px_rgba(11,93,42,0.35)]'
              : 'bg-white/70 dark:bg-emerald-950/60 border-emerald-800/5 dark:border-amber-500/10'
          }`}
        >
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label={t('nav.home')} id="logo-brand">
            <span className="relative w-10 h-10 rounded-full border-2 border-amber-500/50 bg-emerald-950 overflow-hidden transition-all duration-300 group-hover:border-amber-500 group-hover:scale-105">
              <Image src="/logo.png" alt="IUJ Reading Club logo" fill sizes="40px" className="object-cover" priority />
            </span>
            <span className="hidden sm:block">
              <span className="block text-xs font-bold text-emerald-900 dark:text-amber-400 tracking-wider leading-none uppercase">{t('nav.brandName')}</span>
              <span className="block text-[9px] text-emerald-700/70 dark:text-emerald-200/60 font-serif tracking-widest mt-1 italic">{t('nav.brandSubtitle')}</span>
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-1 px-2" aria-label="Primary navigation" id="desktop-nav">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3.5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'text-emerald-900 dark:text-amber-400'
                      : 'text-emerald-900/65 dark:text-emerald-100/65 hover:text-emerald-900 dark:hover:text-amber-300 hover:bg-emerald-800/5 dark:hover:bg-amber-400/10'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-xl bg-amber-400/15 ring-1 ring-amber-500/25"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" id="nav-auth-section">
            <button
              type="button"
              onClick={openSearch}
              aria-label={t('nav.search')}
              id="btn-open-search"
              className="flex items-center gap-2 p-2.5 sm:px-3 rounded-xl border border-emerald-800/15 dark:border-amber-500/15 text-emerald-900/70 dark:text-amber-300 hover:border-amber-500/50 hover:bg-amber-400/10 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-semibold">{t('nav.search')}</span>
              <kbd className="hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/5 dark:bg-white/10">Ctrl K</kbd>
            </button>

            <button
              type="button"
              id="btn-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl border border-emerald-800/15 dark:border-amber-500/15 text-emerald-900/70 dark:text-amber-300 hover:border-amber-500/50 hover:bg-amber-400/10 transition-all cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} initial={{ opacity: 0, rotate: -90, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.6 }} transition={{ duration: 0.18 }} className="block">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.span>
              </AnimatePresence>
            </button>

            <div className="relative hidden sm:block">
              <button
                type="button"
                id="btn-lang-switch"
                onClick={() => setLangOpen((v) => !v)}
                aria-label={t('nav.language')}
                aria-expanded={langOpen}
                className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl text-[11px] font-bold border border-emerald-800/15 dark:border-amber-500/15 text-emerald-900/70 dark:text-amber-300 hover:border-amber-500/50 hover:bg-amber-400/10 transition-all cursor-pointer"
              >
                <Languages className="w-4 h-4" />
                <span className="hidden md:inline">{languageOptions.find((l) => l.code === language)?.label}</span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-36 bg-white dark:bg-emerald-950 rounded-xl shadow-xl border border-emerald-800/10 dark:border-amber-500/15 overflow-hidden py-1 z-50">
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => {
                          setLanguage(opt.code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold cursor-pointer ${language === opt.code ? 'text-emerald-900 dark:text-amber-400 bg-amber-400/10' : 'text-emerald-900/70 dark:text-emerald-100/70 hover:bg-emerald-800/5 dark:hover:bg-amber-400/10'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center gap-1.5">
                {user.role === 'ADMIN' && (
                  <Link href="/admin" id="btn-admin-nav" aria-label={t('nav.admin')} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-400/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all ${pathname.startsWith('/admin') ? 'bg-amber-500 !text-white' : ''}`}>
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden md:inline">{t('nav.admin')}</span>
                  </Link>
                )}
                <Link href="/dashboard" id="btn-member-nav" className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold bg-emerald-950 border border-emerald-900 text-white hover:border-amber-400 transition-all ${pathname.startsWith('/dashboard') ? 'ring-2 ring-amber-400/60' : ''}`}>
                  <img src={mediaUrl(user.avatarUrl) || '/logoIUJJ.jpg'} alt="" className="w-5 h-5 rounded-full border border-amber-400 object-cover" />
                  <span className="max-w-[90px] truncate hidden md:inline">{user.name.split(' ')[0]}</span>
                </Link>
                <button type="button" id="btn-logout" onClick={logout} title={t('nav.logout')} aria-label={t('nav.logout')} className="hidden sm:block p-2.5 rounded-xl text-emerald-900/60 dark:text-emerald-100/60 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" id="btn-login-tab" className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold gold-gradient-bg text-emerald-950 shadow-md hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-95">
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-xl text-emerald-900 dark:text-amber-300 hover:bg-emerald-800/10 dark:hover:bg-amber-400/10 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-nav-panel"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden mt-2 bg-white/95 dark:bg-emerald-950/95 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-800/10 dark:border-amber-500/15 overflow-hidden"
            >
              <div className="p-3 space-y-1">
                {navItems.map((item, i) => (
                  <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i, duration: 0.2 }}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`block w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive(item.href) ? 'bg-amber-400/15 text-emerald-900 dark:text-amber-400 border-l-4 border-amber-500' : 'text-emerald-900/75 dark:text-emerald-100/75 hover:bg-emerald-800/5 dark:hover:bg-amber-400/10'}`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 pt-2 mt-1 border-t border-emerald-800/10 dark:border-amber-500/10">
                  {languageOptions.map((opt) => (
                    <button key={opt.code} type="button" onClick={() => setLanguage(opt.code)} className={`flex-1 py-2 rounded-lg text-[11px] font-bold cursor-pointer ${language === opt.code ? 'bg-amber-400/20 text-emerald-900 dark:text-amber-300' : 'text-emerald-900/60 dark:text-emerald-100/60'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {user && (
                  <button type="button" onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer">
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
