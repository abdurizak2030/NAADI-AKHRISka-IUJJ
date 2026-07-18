'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { API_BASE_URL } from '../lib/api';

import Navbar from './Navbar';
import Home from './Home';

// Code-split the heavier, less-frequently-visited tabs so the initial
// bundle only pays for the homepage + navbar. Each tab shows a small
// loading spinner (see <RouteLoader />) the first time it's opened.
const Articles = lazy(() => import('./Articles'));
const LibraryView = lazy(() => import('./Library'));
const Media = lazy(() => import('./Media'));
const About = lazy(() => import('./About'));
const Dashboard = lazy(() => import('./Dashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const Events = lazy(() => import('./Events'));
const Contact = lazy(() => import('./Contact'));
const Login = lazy(() => import('./Login'));

import {
  User as UserType,
  Article,
  PdfBook,
  VideoItem,
  TalkItem,
  ClubEvent,
  GalleryItem,
  ClubSettings,
  FounderInfo,
  MemberOfMonth,
  Testimonial,
  RoadmapNode
} from '../types';
import { useLanguage } from '../i18n/LanguageContext';

/** Lightweight fallback shown while a lazy-loaded tab's code downloads. */
function RouteLoader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
      <div className="w-9 h-9 rounded-full border-[3px] border-emerald-100 border-t-emerald-800 animate-spin" />
    </div>
  );
}

export default function App() {
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState<string>('home');

  // --- Auth State ---
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // --- Core API Data Lists ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [pdfs, setPdfs] = useState<PdfBook[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [talks, setTalks] = useState<TalkItem[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  
  // --- Static/Preloaded Metadata ---
  const [founder, setFounder] = useState<FounderInfo | null>(null);
  const [memberOfMonth, setMemberOfMonth] = useState<MemberOfMonth | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapNode[]>([]);

  // Initial Boot loader
  // Safe JSON helper to handle empty/non-JSON responses gracefully
  const safeJson = useCallback(async (res: Response) => {
    try {
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch (err) {
      console.error('Error in safeJson parsing:', err);
    }
    return null;
  }, []);

  const fetchPublicData = useCallback(() => {
    // Articles
    fetch(`${API_BASE_URL}/api/articles`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setArticles(data); })
      .catch(err => console.error(err));

    // PDFs
    fetch(`${API_BASE_URL}/api/pdfs`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setPdfs(data); })
      .catch(err => console.error(err));

    // Videos
    fetch(`${API_BASE_URL}/api/videos`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setVideos(data); })
      .catch(err => console.error(err));

    // Talks
    fetch(`${API_BASE_URL}/api/talks`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setTalks(data); })
      .catch(err => console.error(err));

    // Events
    fetch(`${API_BASE_URL}/api/events`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setEvents(data); })
      .catch(err => console.error(err));

    // Gallery
    fetch(`${API_BASE_URL}/api/gallery`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setGallery(data); })
      .catch(err => console.error(err));

    // Settings
    fetch(`${API_BASE_URL}/api/settings`)
      .then(safeJson)
      .then(data => { if (data) setSettings(data); })
      .catch(err => console.error(err));

    // Founder
    fetch(`${API_BASE_URL}/api/founder`)
      .then(safeJson)
      .then(data => { if (data) setFounder(data); })
      .catch(err => console.error(err));

    // Member of Month
    fetch(`${API_BASE_URL}/api/member-of-month`)
      .then(safeJson)
      .then(data => { if (data) setMemberOfMonth(data); })
      .catch(err => console.error(err));

    // Testimonials
    fetch(`${API_BASE_URL}/api/testimonials`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setTestimonials(data); })
      .catch(err => console.error(err));

    // Roadmap
    fetch(`${API_BASE_URL}/api/roadmap`)
      .then(safeJson)
      .then(data => { if (data && Array.isArray(data)) setRoadmap(data); })
      .catch(err => console.error(err));
  }, [safeJson]);

  useEffect(() => {
    // 1. Recover token from localStorage
    const savedToken = localStorage.getItem('club_token');
    if (savedToken) {
      setToken(savedToken);
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      })
        .then(safeJson)
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('club_token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('club_token');
          setToken(null);
        });
    }

    // 2. Fetch all public lists
    fetchPublicData();
  }, [fetchPublicData, safeJson]);

  const refreshUser = () => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(safeJson)
      .then(data => {
        if (data && data.user) setUser(data.user);
      })
      .catch(err => console.error(err));
  };

  const handleRegisterEvent = async (eventId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Refresh events list
        fetch(`${API_BASE_URL}/api/events`)
          .then(r => r.json())
          .then(data => { if (Array.isArray(data)) setEvents(data); });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('club_token');
    setToken(null);
    setUser(null);
    setCurrentTab('home');
  };

  const handleSetTab = (tab: string) => {
    setCurrentTab(tab);
  };

  // Redirect guard for private / login / admin-only pages
  React.useEffect(() => {
    if (!user && (currentTab === 'dashboard' || currentTab === 'admin')) {
      setCurrentTab('login');
    }
    if (user && user.role !== 'ADMIN' && currentTab === 'admin') {
      setCurrentTab('dashboard');
    }
    if (user && currentTab === 'login') {
      setCurrentTab('dashboard');
    }
  }, [user, currentTab]);

  if (currentTab === 'login' && !user) {
    return (
      <Suspense fallback={<RouteLoader />}>
        <Login
          onLoginSuccess={(userData, tokenData) => {
            setToken(tokenData);
            setUser(userData);
            localStorage.setItem('club_token', tokenData);
            setCurrentTab('dashboard'); // Automatic redirect to private Member Dashboard after successful login
          }}
          onBackToHome={() => {
            setCurrentTab('home');
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#06140c] flex flex-col justify-between" id="app-root">
      
      {/* 1. Navbar Header */}
      <Navbar
        currentTab={currentTab}
        setTab={handleSetTab}
        user={user}
        onLogout={handleSignOut}
      />

      {/* 2. Primary Page Render View */}
      <main className={`flex-grow w-full mx-auto ${currentTab === 'home' ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}>
        {currentTab === 'home' && (
          <Home
            founder={founder}
            memberOfMonth={memberOfMonth}
            upcomingEvents={events}
            setTab={setCurrentTab}
            onRegisterEvent={handleRegisterEvent}
            userEmail={user?.email}
            user={user}
            articles={articles}
            token={token}
            onRefreshArticles={() => {
              fetch(`${API_BASE_URL}/api/articles`)
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setArticles(data); });
            }}
            setActiveArticle={setActiveArticle}
            testimonials={testimonials}
          />
        )}

        {currentTab === 'articles' && (
          <Suspense fallback={<RouteLoader />}>
            <Articles
              articles={articles}
              token={token}
              onRefreshArticles={() => {
                fetch(`${API_BASE_URL}/api/articles`)
                  .then(r => r.json())
                  .then(data => { if (Array.isArray(data)) setArticles(data); });
              }}
              onLoginPrompt={() => setCurrentTab('login')}
              activeArticle={activeArticle}
              setActiveArticle={setActiveArticle}
            />
          </Suspense>
        )}

        {currentTab === 'library' && (
          <Suspense fallback={<RouteLoader />}>
            <LibraryView
              pdfs={pdfs}
              token={token}
              onLoginPrompt={() => setCurrentTab('login')}
            />
          </Suspense>
        )}

        {currentTab === 'media' && (
          <Suspense fallback={<RouteLoader />}>
            <Media
              videos={videos}
              talks={talks}
              gallery={gallery}
              token={token}
              onLoginPrompt={() => setCurrentTab('login')}
            />
          </Suspense>
        )}

        {currentTab === 'events' && (
          <Suspense fallback={<RouteLoader />}>
            <Events
              events={events}
            />
          </Suspense>
        )}

        {currentTab === 'about' && (
          <Suspense fallback={<RouteLoader />}>
            <About testimonials={testimonials} founder={founder} />
          </Suspense>
        )}

        {currentTab === 'contact' && (
          <Suspense fallback={<RouteLoader />}>
            <Contact />
          </Suspense>
        )}

        {currentTab === 'dashboard' && user && (
          <Suspense fallback={<RouteLoader />}>
            <Dashboard
              user={user}
              token={token}
              articles={articles}
              roadmap={roadmap}
              onRefreshUser={refreshUser}
              onRefreshArticles={() => {
                fetch(`${API_BASE_URL}/api/articles`)
                  .then(r => r.json())
                  .then(data => { if (Array.isArray(data)) setArticles(data); });
              }}
            />
          </Suspense>
        )}

        {currentTab === 'admin' && user?.role === 'ADMIN' && (
          <Suspense fallback={<RouteLoader />}>
            <AdminDashboard
              token={token ?? ''}
              articles={articles}
              pdfs={pdfs}
              videos={videos}
              talks={talks}
              events={events}
              gallery={gallery}
              settings={settings}
              memberOfMonth={memberOfMonth}
              testimonials={testimonials}
              onRefreshAll={fetchPublicData}
            />
          </Suspense>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="bg-emerald-950 text-white border-t border-amber-500/20 py-10" id="club-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h4 className="text-amber-400 font-bold text-sm tracking-widest uppercase font-sans">
              {t('nav.brandName')}
            </h4>
            <p className="text-emerald-100/70 text-xs max-w-sm font-sans leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider font-sans">{t('footer.quickLinks')}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-200">
              <button onClick={() => setCurrentTab('home')} className="hover:text-amber-300 text-left cursor-pointer">{t('nav.home')}</button>
              <button onClick={() => setCurrentTab('articles')} className="hover:text-amber-300 text-left cursor-pointer">{t('nav.articles')}</button>
              <button onClick={() => setCurrentTab('library')} className="hover:text-amber-300 text-left cursor-pointer">{t('nav.library')}</button>
              <button onClick={() => setCurrentTab('media')} className="hover:text-amber-300 text-left cursor-pointer">{t('nav.media')}</button>
              <button onClick={() => setCurrentTab('events')} className="hover:text-amber-300 text-left cursor-pointer">{t('nav.events')}</button>
              <button onClick={() => setCurrentTab('about')} className="hover:text-amber-300 text-left cursor-pointer">{t('nav.about')}</button>
              <button onClick={() => setCurrentTab('contact')} className="hover:text-amber-300 text-left cursor-pointer">{t('nav.contact')}</button>
            </div>
          </div>

          <div className="space-y-2 text-xs text-emerald-200">
            <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider font-sans">{t('footer.contactHeading')}</h4>
            <p>{t('footer.emailPrefix')} {settings?.contactEmail || 'readingclub@jigjiga.edu'}</p>
            <p>{t('footer.phonePrefix')} {settings?.contactPhone || '+251 915 744 321'}</p>
            <p>{t('footer.locationLabel')}</p>
            {(settings?.tiktokUrl || settings?.facebookUrl || settings?.xUrl) && (
              <div className="flex items-center gap-2.5 pt-2">
                {settings?.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-full bg-emerald-900 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500 hover:text-emerald-950 text-emerald-200 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"/></svg>
                  </a>
                )}
                {settings?.xUrl && (
                  <a
                    href={settings.xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter)"
                    className="w-8 h-8 rounded-full bg-emerald-900 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500 hover:text-emerald-950 text-emerald-200 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.3 22H1.2l8.1-9.3L1 2h7.3l5 6.6L18.9 2Zm-1.2 18h1.8L7 3.9H5l12.7 16.1Z"/></svg>
                  </a>
                )}
                {settings?.tiktokUrl && (
                  <a
                    href={settings.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="w-8 h-8 rounded-full bg-emerald-900 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500 hover:text-emerald-950 text-emerald-200 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M16.6 5.82c-.9-.6-1.6-1.5-1.85-2.62-.05-.24-.09-.48-.1-.72h-3.4v13.86c0 1.5-1.22 2.72-2.72 2.72a2.72 2.72 0 0 1-2.72-2.72 2.72 2.72 0 0 1 2.72-2.72c.28 0 .55.04.8.12v-3.46a6.18 6.18 0 0 0-.8-.05 6.19 6.19 0 0 0-6.19 6.19 6.19 6.19 0 0 0 6.19 6.19 6.19 6.19 0 0 0 6.19-6.19V8.44a8.16 8.16 0 0 0 4.76 1.52V6.55c-.96 0-1.98-.28-2.88-.73Z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-emerald-900 text-center text-xs text-emerald-300/50 font-serif">
          &copy; {new Date().getFullYear()} {t('footer.copyright')}
        </div>
      </footer>
    </div>
  );
}
