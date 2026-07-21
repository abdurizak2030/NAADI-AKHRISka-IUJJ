'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL, mediaUrl } from '../lib/api';
import { MessageSquare, Heart, Globe, Calendar, User, ArrowLeft, Search, X, Check, Sparkles } from 'lucide-react';
import { Article, Comment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface ArticlesProps {
  articles: Article[];
  token: string | null;
  onRefreshArticles: () => void;
  onLoginPrompt: () => void;
  activeArticle: Article | null;
  setActiveArticle: (article: Article | null) => void;
}

export default function Articles({
  articles,
  token,
  onRefreshArticles,
  onLoginPrompt: _onLoginPrompt,
  activeArticle,
  setActiveArticle
}: ArticlesProps) {
  const { t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load comments for active article
  useEffect(() => {
    if (activeArticle) {
      fetch(`${API_BASE_URL}/api/articles/${activeArticle.id}/comments`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setComments(data);
        })
        .catch(err => console.error('Error fetching comments:', err));
    } else {
      setComments([]);
    }
  }, [activeArticle]);

  const [guestName, setGuestName] = useState<string>('');

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/articles/${id}/like`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        onRefreshArticles();
        if (activeArticle && activeArticle.id === id) {
          setActiveArticle({ ...activeArticle, likesCount: activeArticle.likesCount + 1 });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeArticle) return;

    setSubmittingComment(true);
    setErrorMsg('');
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/articles/${activeArticle.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content: commentText,
          authorName: token ? undefined : (guestName.trim() || 'Anonymous Scholar')
        })
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [data, ...prev]);
        setCommentText('');
        setGuestName('');
        setSuccessMsg('Your commentary has been successfully published!');
        onRefreshArticles();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to submit comment.');
      }
    } catch {
      setErrorMsg('A connection error occurred. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Filter articles
  const filteredArticles = articles.filter(a => {
    const matchesLang = selectedLanguage === 'All' || a.language === selectedLanguage;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesSearch && a.status === 'PUBLISHED';
  });

  return (
    <div className="space-y-8 pb-16" id="articles-section">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-gray-150 pb-6" id="articles-header">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-150 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('articlesPage.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3.5xl font-extrabold text-emerald-950 font-display tracking-tight">
            {t('articlesPage.title')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl">
            {t('articlesPage.subtitle')}
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            id="input-article-search"
            placeholder={t('articlesPage.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Language Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none" id="language-filters">
        {['All', 'Somali', 'Arabic', 'English'].map((lang) => (
          <button
            key={lang}
            id={`filter-lang-${lang}`}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedLanguage === lang
                ? 'bg-emerald-900 text-amber-300 shadow-sm'
                : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70 border border-emerald-100/50'
            }`}
          >
            {lang === 'All' ? 'All Languages' : lang}
          </button>
        ))}
      </div>

      {/* Main List & Reading Area */}
      <AnimatePresence mode="wait">
        {activeArticle ? (
          /* Full Article Reading View */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden" 
            id="full-article-reader"
          >
            {/* Header Cover Banner */}
            {activeArticle.imageUrl && (
              <img loading="lazy" src={mediaUrl(activeArticle.imageUrl)} alt={activeArticle.title} className="w-full h-56 sm:h-72 object-cover object-center" style={{ backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            <div className="bg-emerald-950 text-white p-6 sm:p-10 relative">
              <button
                id="btn-close-reader"
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 p-2.5 bg-emerald-900/50 hover:bg-emerald-900 hover:text-amber-400 rounded-full text-white transition-colors cursor-pointer"
                title="Back to List"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="space-y-4 max-w-4xl">
                <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold tracking-widest uppercase font-mono">
                  <span>{activeArticle.category}</span>
                  <span className="opacity-40">•</span>
                  <span>{activeArticle.language} Language</span>
                </div>
                <h3 className="text-2xl sm:text-4.5xl font-extrabold text-amber-300 font-sans leading-tight tracking-tight">
                  {activeArticle.title}
                </h3>
                
                <div className="flex flex-wrap gap-4 items-center text-xs text-emerald-100 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">{activeArticle.authorName}</span>
                  </div>
                  <div className="opacity-40 sm:block hidden">•</div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-emerald-300" />
                    <span>{activeArticle.publishedAt ? new Date(activeArticle.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>


            {/* Content Body */}
            <div className="p-6 sm:p-12 max-w-4xl mx-auto space-y-10">
              <button
                onClick={() => setActiveArticle(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer border border-amber-200/40 px-3 py-1.5 rounded-lg bg-amber-50/30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('articlesPage.returnToArticles')}</span>
              </button>

              <div className="text-gray-800 text-sm sm:text-[17px] leading-relaxed font-sans whitespace-pre-wrap antialiased">
                {activeArticle.content}
              </div>

              {/* Quick Actions Bar */}
              <div className="flex items-center gap-8 border-t border-b border-gray-100 py-5">
                <button
                  id="btn-like-reader"
                  onClick={(e) => handleLike(activeArticle.id, e)}
                  className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-red-500 transition-colors cursor-pointer group"
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500/10 group-hover:scale-110 transition-transform" />
                  <span>Recommend Essay ({activeArticle.likesCount})</span>
                </button>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-semibold">
                  <MessageSquare className="w-5 h-5 text-emerald-800" />
                  <span>Discussion Forum ({comments.length})</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-6" id="comments-section-reader">
                <h4 className="text-lg font-bold text-emerald-950 font-sans flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{t('articlesPage.reflectionsAndCommentary')}</span>
                </h4>

                {/* Message Banner alerts */}
                {successMsg && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 border border-emerald-200 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs sm:text-sm border border-red-100">
                    {errorMsg}
                  </div>
                )}

                {/* Comment submission form */}
                <form onSubmit={handleCommentSubmit} className="space-y-3" id="form-submit-comment">
                  {!token && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t('articlesPage.commentNamePlaceholder')}
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 transition-all shadow-sm"
                      />
                    </div>
                  )}
                  <textarea
                    id="textarea-comment"
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('articlesPage.commentPlaceholder')}
                    className="w-full p-4 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 focus:outline-none transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    id="btn-comment-submit"
                    disabled={submittingComment}
                    className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-900 text-white hover:bg-emerald-800 transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-emerald-900/10"
                  >
                    {submittingComment ? 'Publishing Critique...' : 'Publish Commentary'}
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-4 pt-6 border-t border-gray-100" id="comments-list">
                  {comments.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-400 italic">No academic comments have been registered for this paper yet. Share your thoughts above.</p>
                  ) : (
                    comments.map((comm) => (
                      <div key={comm.id} className="flex gap-4 bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100/85" id={`comment-item-${comm.id}`}>
                        <img loading="lazy"                           src={mediaUrl(comm.avatarUrl) || 'logoIUJJ.jpg'}
                          alt={comm.authorName}
                          className="w-9 h-9 rounded-full border border-amber-400 object-cover shrink-0"
                        />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-emerald-950">{comm.authorName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{new Date(comm.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans">{comm.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Articles List View */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            id="articles-list-grid"
          >
            {filteredArticles.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">{t('articlesPage.noResults')}</p>
              </div>
            ) : (
              filteredArticles.map((art) => (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  whileHover={{ y: -6 }}
                  key={art.id}
                  id={`article-card-${art.id}`}
                  onClick={() => setActiveArticle(art)}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-800/25 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  {art.imageUrl && (
                    <img loading="lazy" src={mediaUrl(art.imageUrl)} alt={art.title} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-6 space-y-4">
                    {/* Category Pills */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 uppercase tracking-wider">
                        {art.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                        {art.language}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-emerald-950 font-sans line-clamp-2 leading-snug hover:text-amber-600 transition-colors">
                      {art.title}
                    </h3>
                    
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  {/* Footer specs */}
                  <div className="px-6 py-4.5 bg-emerald-50/20 rounded-b-2xl border-t border-gray-50/80 flex items-center justify-between text-[11px] text-gray-500 font-sans">
                    <div className="flex items-center space-x-2">
                      <div className="w-5.5 h-5.5 rounded-full bg-emerald-900 border border-amber-400/40 flex items-center justify-center text-[10px] text-amber-300 font-bold shrink-0">
                        {art.authorName.charAt(0)}
                      </div>
                      <span className="truncate max-w-[110px] font-semibold text-emerald-950">{art.authorName}</span>
                    </div>

                    <div className="flex items-center gap-3.5 text-[10px] font-bold font-mono text-gray-400">
                      <button
                        id={`btn-like-list-${art.id}`}
                        onClick={(e) => handleLike(art.id, e)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-red-450 fill-red-450/10" />
                        <span>{art.likesCount}</span>
                      </button>
                      <div className="flex items-center gap-1 text-emerald-800">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{art.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
