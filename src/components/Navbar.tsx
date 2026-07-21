'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { mediaUrl } from '../lib/api';
import { BookOpen, User, LogOut, ShieldAlert, Library, Calendar, MessageSquare, Phone, Info, Menu, X, Languages, Sun, Moon } from 'lucide-react';
import { User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

interface NavbarProps {
  user: UserType | null;
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ user, currentTab, setTab, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isSelected = (tabName: string) => currentTab === tabName;

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: BookOpen },
    { id: 'about', label: t('nav.about'), icon: Info },
    { id: 'articles', label: t('nav.articles'), icon: MessageSquare },
    { id: 'library', label: t('nav.library'), icon: Library },
    { id: 'media', label: t('nav.media'), icon: Library },
    { id: 'events', label: t('nav.events'), icon: Calendar },
    { id: 'contact', label: t('nav.contact'), icon: Phone },
  ];

  const handleMobileNavClick = (tabId: string) => {
    setTab(tabId);
    setMobileMenuOpen(false);
  };

  const languageOptions: { code: 'en' | 'ar' | 'so' | 'am'; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'so', label: 'Soomaali' },
    { code: 'am', label: 'አማርኛ' },
  ];
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 pt-3" id="main-header">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 sm:h-[72px] bg-white/85 dark:bg-emerald-950/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_-8px_rgba(11,93,42,0.18)] border border-emerald-800/10 dark:border-amber-500/15 px-3 sm:px-5 transition-all duration-300">

          {/* Logo & Brand (left) */}
          <div className="flex items-center space-x-2.5 cursor-pointer group shrink-0" onClick={() => setTab('home')} id="logo-brand">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-amber-500/50 bg-emerald-950 flex items-center justify-center shadow-inner overflow-hidden transition-all duration-300 group-hover:border-amber-500 group-hover:scale-105">
              <img
                src="/logo.png"
                alt="IUJ Reading Club Logo"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-bold text-emerald-900 dark:text-amber-400 tracking-wider leading-none uppercase font-sans">
                {t('nav.brandName')}
              </h1>
              <p className="text-[9px] text-emerald-700/70 dark:text-emerald-200/60 font-serif tracking-widest mt-1 italic">
                {t('nav.brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation (centered) */}
          <nav className="hidden xl:flex items-center justify-center flex-1 min-w-0 gap-0.5 px-2" id="desktop-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected(item.id)
                      ? 'text-emerald-900 dark:text-amber-400 bg-amber-400/15'
                      : 'text-emerald-900/60 dark:text-emerald-100/60 hover:text-emerald-900 dark:hover:text-amber-300 hover:bg-emerald-800/5 dark:hover:bg-amber-400/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span>{item.label}</span>
                  {isSelected(item.id) && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-amber-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Auth & Dashboard Navigation (right) */}
          <div className="flex items-center space-x-2 shrink-0" id="nav-auth-section">
            {/* Theme Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2.5 rounded-xl border border-emerald-800/15 dark:border-amber-500/15 text-emerald-900/70 dark:text-amber-300 hover:border-amber-500/50 hover:text-emerald-900 dark:hover:text-amber-200 hover:bg-amber-400/10 transition-all cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                id="btn-lang-switch"
                onClick={() => setLangMenuOpen((v) => !v)}
                title={t('nav.language')}
                className="flex items-center space-x-1 px-2.5 py-2 rounded-xl text-[11px] font-bold border border-emerald-800/15 text-emerald-900/70 hover:border-amber-500/50 hover:text-emerald-900 hover:bg-amber-400/10 transition-all cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{languageOptions.find((l) => l.code === language)?.label}</span>
              </button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-emerald-950 rounded-xl shadow-xl border border-emerald-800/10 dark:border-amber-500/15 overflow-hidden py-1 z-50"
                  >
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => { setLanguage(opt.code); setLangMenuOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          language === opt.code ? 'text-emerald-900 dark:text-amber-400 bg-amber-400/10' : 'text-emerald-900/70 dark:text-emerald-100/70 hover:bg-emerald-800/5 dark:hover:bg-amber-400/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center space-x-2">
                {user.role === 'ADMIN' && (
                  <button
                    id="btn-admin-nav"
                    onClick={() => setTab('admin')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-400/10 text-amber-700 hover:bg-amber-500 hover:text-white transition-all cursor-pointer ${
                      currentTab === 'admin' ? 'bg-amber-500 text-white' : ''
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('nav.admin')}</span>
                  </button>
                )}
                <button
                  id="btn-member-nav"
                  onClick={() => setTab('dashboard')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-950 border border-emerald-900 text-white hover:border-amber-400 transition-all cursor-pointer ${
                    currentTab === 'dashboard' ? 'ring-2 ring-amber-400/60' : ''
                  }`}
                >
                  <img
                    src={mediaUrl(user.avatarUrl) || '/logoIUJJ.jpg'}
                    alt={user.name}
                    className="w-5 h-5 rounded-full border border-amber-400"
                  />
                  <span className="max-w-[100px] truncate hidden sm:inline">{user.name.split(' ')[0]}</span>
                </button>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title={t('nav.logout')}
                  className="p-2 rounded-xl text-emerald-900/60 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-tab"
                onClick={() => setTab('login')}
                className="flex items-center space-x-1.5 px-4 sm:px-4.5 py-2.5 rounded-xl text-xs font-bold gold-gradient-bg text-emerald-950 shadow-md hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>{t('nav.login')}</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-emerald-900 hover:bg-emerald-800/10 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Animated Slide-out or Dropdown Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="xl:hidden mt-2 bg-white/95 dark:bg-emerald-950/95 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-800/10 dark:border-amber-500/15 overflow-hidden"
              id="mobile-nav-panel"
            >
              <div className="px-4 py-4 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNavClick(item.id)}
                      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isSelected(item.id)
                          ? 'bg-amber-400/15 text-emerald-900 dark:text-amber-400 border-l-4 border-amber-500'
                          : 'text-emerald-900/70 dark:text-emerald-100/70 hover:bg-emerald-800/5 dark:hover:bg-amber-400/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
