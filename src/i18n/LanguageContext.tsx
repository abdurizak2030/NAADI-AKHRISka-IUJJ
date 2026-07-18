'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Language switcher context. Wraps the whole app (see main.tsx) so any
 * component can call useLanguage() to read the current language, flip
 * it, and translate static UI strings via t('section.key'). Also flips
 * <html lang> / <html dir> so the entire site (including components that
 * don't call t() directly) gets correct text direction for Arabic.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Language, translations } from './translations';

interface LanguageContextValue {
  language: Language;
  dir: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'iuj_language';

function resolvePath(obj: Record<string, unknown>, path: string): string | undefined {
  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof result === 'string' ? result : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const validCodes: Language[] = ['en', 'ar', 'so', 'am'];

  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return (validCodes as string[]).includes(saved || '') ? (saved as Language) : 'en';
  });

  // Only Arabic is right-to-left; English, Somali, and Amharic all read LTR.
  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language, dir]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleLanguage = () => setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));

  const t = useMemo(() => {
    return (path: string) => {
      const value = resolvePath(translations[language], path);
      if (value !== undefined) return value as string;
      // Fall back to English so a missing Arabic key never renders blank.
      const fallback = resolvePath(translations.en, path);
      return (fallback as string) ?? path;
    };
  }, [language]);

  const value: LanguageContextValue = { language, dir, setLanguage, toggleLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
