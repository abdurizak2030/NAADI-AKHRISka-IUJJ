'use client';

/**
 * Session + site settings shared by every route. Replaces the auth/state that
 * used to live inside the single-page ClubApp so each page can be a real URL.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../lib/api';
import type { ClubSettings, User } from '../types';

interface AppContextValue {
  user: User | null;
  token: string | null;
  /** False until the saved session (if any) has been checked. */
  ready: boolean;
  settings: ClubSettings | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => void;
  openSearch: () => void;
  searchOpen: boolean;
  closeSearch: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);
const TOKEN_KEY = 'club_token';

export function AppProvider({ children, initialSettings }: { children: React.ReactNode; initialSettings: ClubSettings | null }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<ClubSettings | null>(initialSettings);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setReady(true);
    } else {
      setToken(saved);
      fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) setUser(data.user);
          else {
            window.localStorage.removeItem(TOKEN_KEY);
            setToken(null);
          }
        })
        .catch(() => {
          window.localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setReady(true));
    }
    if (!initialSettings) {
      fetch(`${API_BASE_URL}/api/settings`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setSettings(data))
        .catch(() => {});
    }
  }, [initialSettings]);

  // Global shortcut: Ctrl/Cmd + K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const login = useCallback((u: User, t: string) => {
    window.localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.user && setUser(data.user))
      .catch(() => {});
  }, [token]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      token,
      ready,
      settings,
      login,
      logout,
      refreshUser,
      searchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
    }),
    [user, token, ready, settings, login, logout, refreshUser, searchOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
