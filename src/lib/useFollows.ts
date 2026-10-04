'use client';

/**
 * Follow state shared by every Follow button on the page.
 * - Signed-in members: follows live on the server (synced across devices).
 * - Visitors: the follow is stored server-side against their email, and
 *   remembered in this browser (localStorage) so the button shows "Following".
 * The remembered email never leaves the device except to our own API.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { FollowKind, FollowRecord } from '../types';

const FOLLOWS_KEY = 'iuj_follows';
const EMAIL_KEY = 'iuj_follow_email';
const EMPTY: FollowRecord[] = [];

let follows: FollowRecord[] | null = null;
const listeners = new Set<() => void>();
let syncedToken: string | null = null;

function read(): FollowRecord[] {
  if (follows) return follows;
  try {
    const raw = window.localStorage.getItem(FOLLOWS_KEY);
    follows = raw ? (JSON.parse(raw) as FollowRecord[]) : [];
  } catch {
    follows = [];
  }
  return follows;
}

function write(next: FollowRecord[]) {
  follows = next;
  try {
    window.localStorage.setItem(FOLLOWS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

const same = (a: FollowRecord, b: FollowRecord) => a.kind === b.kind && a.value === b.value;

export function getRememberedEmail(): string {
  try {
    return window.localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function useFollows(token: string | null) {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(),
    () => EMPTY
  );

  // Signed-in members: pull the authoritative list once per session token.
  useEffect(() => {
    if (!token || syncedToken === token) return;
    syncedToken = token;
    fetch('/api/subscribe', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((serverList: FollowRecord[] | null) => {
        if (!Array.isArray(serverList)) return;
        const merged = [...read()];
        for (const f of serverList) if (!merged.some((m) => same(m, f))) merged.push(f);
        write(merged);
      })
      .catch(() => {});
  }, [token]);

  const isFollowing = useCallback((kind: FollowKind, value = '') => list.some((f) => same(f, { kind, value })), [list]);

  const send = useCallback(
    async (method: 'POST' | 'DELETE', follow: FollowRecord, email?: string): Promise<{ ok: boolean; error?: string }> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const useEmail = email || (!token ? getRememberedEmail() : '');
      try {
        const res = await fetch('/api/subscribe', { method, headers, body: JSON.stringify({ ...follow, email: useEmail }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.error || 'Something went wrong.' };
        if (method === 'POST') {
          if (email) {
            try {
              window.localStorage.setItem(EMAIL_KEY, email);
            } catch {
              /* ignore */
            }
          }
          if (!read().some((f) => same(f, follow))) write([...read(), follow]);
        } else {
          write(read().filter((f) => !same(f, follow)));
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Connection error. Please try again.' };
      }
    },
    [token]
  );

  return {
    isFollowing,
    follow: (f: FollowRecord, email?: string) => send('POST', f, email),
    unfollow: (f: FollowRecord) => send('DELETE', f),
    /** Can we follow right now without asking for an email? */
    canFollowSilently: Boolean(token) || (typeof window !== 'undefined' && Boolean(getRememberedEmail())),
  };
}
