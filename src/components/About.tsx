'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info, BookOpen, Eye, Target, CalendarDays, Sparkles } from 'lucide-react';
import { FounderInfo, Testimonial } from '../types';
import { motion } from 'motion/react';
import TestimonialsSlider from './TestimonialsSlider';
import FounderSection from './FounderSection';
import { useLanguage } from '../i18n/LanguageContext';

interface AboutProps {
  testimonials: Testimonial[];
  founder?: FounderInfo | null;
}

export default function About({ testimonials, founder = null }: AboutProps) {
  const { t } = useLanguage();
  // Animation presets
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 110, damping: 16 }
    }
  };

  // The four About cards: title, body copy, and an icon each. Driven
  // entirely by the i18n system so a language switch updates every card
  // instantly with no reload.
  const cards = [
    {
      id: 'about-card',
      icon: BookOpen,
      title: t('about.cardAboutTitle'),
      text: t('about.cardAboutText'),
      accent: 'emerald' as const,
    },
    {
      id: 'vision-card',
      icon: Eye,
      title: t('about.ourVision'),
      text: t('about.cardVisionText'),
      accent: 'amber' as const,
    },
    {
      id: 'mission-card',
      icon: Target,
      title: t('about.ourMission'),
      text: t('about.cardMissionText'),
      accent: 'emerald' as const,
    },
    {
      id: 'founded-card',
      icon: CalendarDays,
      title: t('about.cardFoundedTitle'),
      text: t('about.cardFoundedText'),
      date: t('about.cardFoundedDate'),
      accent: 'amber' as const,
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-16 pb-16"
      id="about-section"
    >

      {/* 1. Header */}
      <motion.section
        variants={itemVariants}
        className="text-center max-w-3xl mx-auto space-y-4"
        id="about-header"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-100">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('about.whoWeAre')}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-display tracking-tight">
          {t('about.clubName')}
        </h2>
        <p className="text-emerald-700/80 text-xs sm:text-sm font-serif italic max-w-xl mx-auto">
          &ldquo;{t('about.officialName')}&rdquo;
          <br />
          <span className="text-[11px] font-sans not-italic text-gray-500 mt-1 block">
            {t('about.tagline')}
          </span>
        </p>
      </motion.section>

      {/* 2. Hero banner image */}
      <motion.section variants={itemVariants} id="about-hero-banner">
        <div className="relative h-64 sm:h-80 bg-gray-100 rounded-3xl overflow-hidden shadow-xl group">
          <img
            loading="lazy"
            src="jaamacada.jpg"
            alt={t('about.heroName')}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/35 to-transparent flex items-end p-6 sm:p-10">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/25">
                {t('about.luminaries')}
              </span>
              <p className="text-white text-lg sm:text-2xl font-display font-extrabold tracking-tight pt-2">
                {t('about.heroName')}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. Four info cards: About Us / Our Vision / Our Mission / Founded Date */}
      <motion.section
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
        id="about-cards"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          const isAmber = card.accent === 'amber';
          return (
            <motion.div
              key={card.id}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className={`p-6 sm:p-7 rounded-2xl border space-y-4 shadow-sm transition-colors ${
                isAmber
                  ? 'bg-amber-50/45 border-amber-100/60 hover:bg-amber-50'
                  : 'bg-emerald-50/50 border-emerald-100/60 hover:bg-emerald-50'
              }`}
              id={card.id}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isAmber ? 'bg-emerald-900/10' : 'bg-amber-500/10'
                }`}
              >
                <Icon className={`w-5 h-5 ${isAmber ? 'text-emerald-900' : 'text-amber-600'}`} />
              </div>
              <h4 className="font-bold text-emerald-950 text-sm uppercase tracking-wider">{card.title}</h4>
              {card.date && (
                <p className="text-xl font-extrabold text-emerald-900 font-display tracking-tight">{card.date}</p>
              )}
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{card.text}</p>
            </motion.div>
          );
        })}
      </motion.section>

      {/* 4. Founder Section */}
      <motion.div variants={itemVariants}>
        <FounderSection founder={founder} />
      </motion.div>

      {/* 5. Testimonials (Student / Faculty feedback) */}
      <motion.section variants={itemVariants} className="space-y-8" id="about-testimonials">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('about.testimonialsBadge')}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-display tracking-tight">
            {t('about.testimonialsTitle')}
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm">
            {t('about.testimonialsSubtitle')}
          </p>
        </div>

        <TestimonialsSlider testimonials={testimonials} />
      </motion.section>

    </motion.div>
  );
}
