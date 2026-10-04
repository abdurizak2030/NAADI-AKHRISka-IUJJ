'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import { useFetch } from '../lib/useFetch';
import { API_BASE_URL } from '../lib/api';
import type { Article, ClubEvent, GalleryItem, MemberOfMonth, PdfBook, RoadmapNode, Testimonial, VideoItem } from '../types';
import { useState } from 'react';

function Spinner() {
  return <div className="flex justify-center py-28" role="status" aria-label="Loading"><div className="w-9 h-9 rounded-full border-[3px] border-emerald-100 border-t-emerald-800 animate-spin" /></div>;
}

/** Guards the private pages: redirects to /login when there is no session. */
function useGuard(requireAdmin: boolean) {
  const { user, ready } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (requireAdmin && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [ready, user, requireAdmin, router]);
  return ready && user && (!requireAdmin || user.role === 'ADMIN') ? user : null;
}

export function MemberDashboardPage() {
  const user = useGuard(false);
  const { token, refreshUser } = useApp();
  const [n, setN] = useState(0);
  const { data: articles } = useFetch<Article[]>(token ? `${API_BASE_URL}/api/articles` : null, [], n);
  const { data: roadmap } = useFetch<RoadmapNode[]>(`${API_BASE_URL}/api/roadmap`, []);
  if (!user) return <Spinner />;
  return (
    <div className="redesigned-page px-4 sm:px-6 lg:px-8">
      <Dashboard user={user} token={token} articles={Array.isArray(articles) ? articles : []} roadmap={Array.isArray(roadmap) ? roadmap : []} onRefreshUser={refreshUser} onRefreshArticles={() => setN((v) => v + 1)} />
    </div>
  );
}

export function AdminPage() {
  const user = useGuard(true);
  const { token, settings } = useApp();
  const [n, setN] = useState(0);
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const articles = useFetch<Article[]>(token ? `${API_BASE_URL}/api/articles` : null, [], n);
  const pdfs = useFetch<PdfBook[]>(`${API_BASE_URL}/api/pdfs`, [], n);
  const videos = useFetch<VideoItem[]>(`${API_BASE_URL}/api/videos`, [], n);
  const events = useFetch<ClubEvent[]>(`${API_BASE_URL}/api/events`, [], n);
  const gallery = useFetch<GalleryItem[]>(`${API_BASE_URL}/api/gallery`, [], n);
  const mom = useFetch<MemberOfMonth | null>(`${API_BASE_URL}/api/member-of-month`, null, n);
  const testimonials = useFetch<Testimonial[]>(`${API_BASE_URL}/api/testimonials`, [], n);
  const set = useFetch<typeof settings>(`${API_BASE_URL}/api/settings`, settings, n);
  if (!user || !token) return <Spinner />;
  return (
    <AdminDashboard
      token={token}
      articles={arr<Article>(articles.data)}
      pdfs={arr<PdfBook>(pdfs.data)}
      videos={arr<VideoItem>(videos.data)}
      events={arr<ClubEvent>(events.data)}
      gallery={arr<GalleryItem>(gallery.data)}
      settings={set.data ?? null}
      memberOfMonth={mom.data}
      testimonials={arr<Testimonial>(testimonials.data)}
      onRefreshAll={() => setN((v) => v + 1)}
    />
  );
}
