'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { API_BASE_URL, mediaUrl } from '../lib/api';
import { GraduationCap, Trophy, ArrowRight, Star, Clock, MapPin, Sparkles, Heart, MessageSquare } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { FounderInfo, MemberOfMonth, ClubEvent, User, Article, Testimonial } from '../types';
import { motion } from 'motion/react';
import CountdownTimer from './CountdownTimer';
import TestimonialsSlider from './TestimonialsSlider';

interface HomeProps {
  founder: FounderInfo | null;
  memberOfMonth: MemberOfMonth | null;
  upcomingEvents: ClubEvent[];
  setTab: (tab: string) => void;
  onRegisterEvent: (eventId: string) => void;
  userEmail?: string;
  user: User | null;
  articles: Article[];
  token: string | null;
  onRefreshArticles: () => void;
  setActiveArticle: (article: Article | null) => void;
  testimonials: Testimonial[];
}

export default function Home({
  founder,
  memberOfMonth,
  upcomingEvents,
  setTab,
  onRegisterEvent: _onRegisterEvent,
  userEmail: _userEmail,
  user,
  articles,
  token,
  onRefreshArticles,
  setActiveArticle,
  testimonials
}: HomeProps) {
  const { t } = useLanguage();

  // Framer Motion Animation Settings
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-16" 
      id="home-section"
    >
      
      {/* 1. Hero / Premium Banner Section */}
      <motion.section 
        variants={itemVariants}
        className="relative w-full min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white overflow-hidden shadow-2xl px-6 py-16 sm:px-12" 
        id="hero-banner"
      >
        {/* Animated Background Orbs */}
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-10 -right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-10 -left-10 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" 
        />
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-[0.06]" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center space-y-8">
          {/* Official Club Logo - centered at the top of the Hero section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ rotate: 3, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-amber-400/60 bg-emerald-900/90 p-4 flex items-center justify-center shadow-2xl cursor-default"
            id="hero-official-logo"
          >
            <div className="absolute inset-1.5 border border-dashed border-amber-500/30 rounded-full" />
            <img
              src="/logo.png"
              alt="IUJ Reading Club Logo"
              className="w-full h-full rounded-full object-cover drop-shadow-lg"
            />
          </motion.div>

          <div className="space-y-3">
            {/* Large gold Arabic title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              dir="rtl"
              className="gold-gradient-text text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight font-serif"
            >
              نادي القراءة للجامعة الإسلامية في جكجكا
            </motion.h1>

            {/* English title */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg sm:text-2xl font-semibold text-white/95 font-display tracking-tight"
            >
              Reading Club of the Islamic University of Jigjiga
            </motion.h2>

            {/* Arabic slogan */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              dir="rtl"
              className="text-amber-300/90 text-base sm:text-lg font-serif italic pt-2"
            >
              اقرأ و ارتق
            </motion.p>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              id="hero-btn-mission"
              onClick={() => setTab('about')}
              className="px-7 py-3.5 rounded-xl text-sm font-bold gold-gradient-bg text-emerald-950 transition-all flex items-center space-x-2 shadow-lg shadow-amber-500/15 cursor-pointer"
            >
              <span>{t('home.discoverMission')}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              id="hero-btn-member-access"
              onClick={() => setTab(user ? 'dashboard' : 'login')}
              className="px-7 py-3.5 rounded-xl text-sm font-bold bg-transparent text-amber-300 border-2 border-amber-400/70 hover:bg-amber-400/10 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>{t('home.memberAccess')}</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Centered responsive container for other page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

      {/* 2. Latest Insights & Articles Section */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="space-y-8"
        id="latest-articles-section"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('home.articlesBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-display tracking-tight">
            {t('home.articlesTitle')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl mx-auto">
            {t('home.articlesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.filter(a => a.status === 'PUBLISHED').slice(0, 3).map((art) => (
            <motion.div
              whileHover={{ y: -6 }}
              key={art.id}
              onClick={() => {
                setActiveArticle(art);
                setTab('articles');
              }}
              className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-800/25 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 uppercase tracking-wider">
                    {art.category}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    {art.language}
                  </span>
                </div>

                <h3 className="text-base font-bold text-emerald-950 font-sans line-clamp-2 leading-snug">
                  {art.title}
                </h3>
                
                <p className="text-gray-500 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              {/* Footer details */}
              <div className="px-6 py-4 bg-emerald-50/20 rounded-b-2xl border-t border-gray-50/80 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-5.5 h-5.5 rounded-full bg-emerald-900 border border-amber-400/40 flex items-center justify-center text-[10px] text-amber-300 font-bold shrink-0">
                    {art.authorName.charAt(0)}
                  </div>
                  <span className="truncate max-w-[110px] font-semibold text-emerald-950">{art.authorName}</span>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-bold font-mono text-gray-400">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const headers: Record<string, string> = {};
                        if (token) {
                          headers['Authorization'] = `Bearer ${token}`;
                        }
                        const res = await fetch(`${API_BASE_URL}/api/articles/${art.id}/like`, {
                          method: 'POST',
                          headers
                        });
                        if (res.ok) {
                          onRefreshArticles();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/10" />
                    <span>{art.likesCount}</span>
                  </button>
                  <div className="flex items-center gap-1 text-emerald-800">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{art.commentsCount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 3. Founder & Member of the Month Section (Bento grid representation) */}
      <motion.section
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        id="founder-mom-grid"
      >
        
        {/* Founder Bio Block */}
        {founder && (
          <div className="lg:col-span-7 bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden" id="founder-block">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-800/25 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center space-x-1.5 text-amber-400 text-xs font-bold tracking-wider uppercase">
                <GraduationCap className="w-4 h-4" />
                <span>{t('home.leadershipBadge')}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-amber-300 font-sans tracking-tight">{founder.name}</h3>
              <p className="text-amber-100/70 text-xs sm:text-sm font-serif italic">{founder.title}</p>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start pt-2">
                <img loading="lazy"                   src={mediaUrl(founder.imageUrl)}
                  alt={founder.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                />
                <div className="space-y-4">
                  <p className="text-emerald-100/90 text-xs leading-relaxed font-sans">{founder.bio}</p>
                  <p className="text-amber-200 text-xs sm:text-sm font-serif leading-relaxed italic border-l-2 border-amber-400 pl-4">
                    &quot;{founder.message}&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member of the Month Block */}
        {memberOfMonth && memberOfMonth.name && (
          <div className="lg:col-span-5 bg-amber-50/50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xl flex flex-col justify-between" id="member-of-month-block">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-1.5 text-amber-850 text-xs font-bold tracking-wider uppercase">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{t('home.scholarOfMonth')} — {memberOfMonth.month}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <img loading="lazy"                   src={mediaUrl(memberOfMonth.avatarUrl)}
                  alt={memberOfMonth.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0"
                />
                <div>
                  <h4 className="text-lg font-bold text-emerald-950 font-sans">{memberOfMonth.name}</h4>
                  <div className="flex items-center text-xs text-amber-700 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    <span>{t('home.distinguishedScholar')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-emerald-950/90 font-sans leading-relaxed">
                <p className="font-semibold text-emerald-900 bg-amber-400/10 p-3 rounded-xl border border-amber-300/30">
                  {memberOfMonth.achievement}
                </p>
                <p className="text-gray-600 leading-normal">{memberOfMonth.bio}</p>
              </div>
            </div>
            
            <button
              id="btn-view-articles"
              onClick={() => setTab('articles')}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-emerald-950 shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>{t('home.readSubmissions')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.section>

      {/* 4. Upcoming Events Block */}
      <motion.section
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="space-y-6"
        id="upcoming-events-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-sans tracking-tight">
              {t('home.eventsTitle')}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              {t('home.eventsSubtitle')}
            </p>
          </div>
          <button
            id="btn-all-events"
            onClick={() => setTab('events')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <span>{t('home.viewAllEvents')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingEvents.map((evt) => {
            return (
              <motion.div 
                whileHover={{ y: -6 }}
                key={evt.id} 
                className="bg-white rounded-2xl overflow-hidden border border-gray-150/65 shadow-md flex flex-col justify-between" 
                id={`upcoming-event-card-${evt.id}`}
              >
                <div className="relative h-44 bg-gray-100">
                  <img loading="lazy"                     src={mediaUrl(evt.image)}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-900 text-amber-300 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md border border-amber-400/20">
                    {evt.date}
                  </div>
                  <div className="absolute top-3 right-3">
                    <CountdownTimer targetDate={evt.date} />
                  </div>
                </div>
                
                <div className="p-5 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-emerald-950 font-sans line-clamp-1">
                        {evt.title}
                      </h4>
                      {evt.visibility === 'PRIVATE' && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                          Members Only
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                      {evt.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-gray-50 text-[11px] sm:text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0">
                  <div className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Upcoming Gathering — Mark Your Calendar</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
          id="home-testimonials"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('about.testimonialsBadge')}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-display tracking-tight">
              {t('about.testimonialsTitle')}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm">{t('about.testimonialsSubtitle')}</p>
          </div>
          <TestimonialsSlider testimonials={testimonials} />
        </motion.section>
      )}

      </div>

    </motion.div>
  );
}
