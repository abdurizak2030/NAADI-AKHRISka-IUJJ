'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mediaUrl } from '../lib/api';
import { Calendar, Clock, MapPin, User, AlertCircle, Sparkles } from 'lucide-react';
import { ClubEvent } from '../types';
import { motion } from 'motion/react';
import CountdownTimer from './CountdownTimer';
import { useLanguage } from '../i18n/LanguageContext';

interface EventsProps {
  events: ClubEvent[];
}

export default function Events({
  events,
}: EventsProps) {

  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16"
      id="events-section"
    >
      
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2 border-b border-gray-150 pb-6"
        id="events-header"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-150 uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('events.badge')}</span>
        </div>
        <h2 className="text-2xl sm:text-3.5xl font-extrabold text-emerald-950 font-display tracking-tight">
          {t('events.title')}
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm max-w-xl">
          {t('events.subtitle')}
        </p>
      </motion.div>

      {/* Events Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="events-list-grid">
        {events.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">{t('events.noEvents')}</p>
          </div>
        ) : (
          events.map((evt) => {
            const isCompleted = evt.status === 'COMPLETED';

            return (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                whileHover={isCompleted ? {} : { y: -6 }}
                key={evt.id}
                id={`event-card-full-${evt.id}`}
                className={`bg-white rounded-3xl overflow-hidden border shadow-sm flex flex-col justify-between transition-all duration-300 ${
                  isCompleted 
                    ? 'opacity-85 border-gray-200 bg-gray-50/50' 
                    : 'border-gray-150/70 hover:border-emerald-800/20 hover:shadow-md'
                }`}
              >
                <div className="relative h-48 sm:h-52 bg-gray-100">
                  <img loading="lazy"                     src={mediaUrl(evt.image)}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status overlays */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-emerald-950 text-amber-300 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border border-amber-400/20 font-sans uppercase">
                      {evt.date}
                    </span>
                    {isCompleted ? (
                      <span className="bg-gray-850/95 text-gray-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md font-mono uppercase tracking-wide">
                        {t('events.concluded')}
                      </span>
                    ) : (
                      <span className="bg-amber-500 text-emerald-950 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md font-mono uppercase tracking-wide flex items-center gap-1 border border-amber-400/40">
                        <Sparkles className="w-3.5 h-3.5 animate-spin [animation-duration:5s]" />
                        <span>{t('events.active')}</span>
                      </span>
                    )}
                    {evt.visibility === 'PRIVATE' && (
                      <span className="bg-emerald-950/90 text-amber-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md font-mono uppercase tracking-wide border border-amber-400/25">
                        Members Only
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <CountdownTimer targetDate={evt.date} />
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-emerald-950 font-sans tracking-tight">
                      {evt.title}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  {/* Info points */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs text-gray-600 font-sans">
                    {evt.speaker && (
                      <div className="flex items-center space-x-2.5">
                        <User className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{t('events.hostLabel')} <strong className="text-emerald-900 font-semibold">{evt.speaker}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2.5">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{t('events.timeLabel')} <span className="font-semibold text-emerald-950">{evt.time}</span></span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">{t('events.venueLabel')} <span className="font-semibold text-emerald-950">{evt.location}</span></span>
                    </div>
                  </div>
                </div>

                {/* Announcement bar (registration removed — informational only) */}
                <div className="px-6 pb-6 pt-0">
                  {isCompleted ? (
                    <div className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 flex items-center justify-center gap-1.5 border border-gray-200">
                      <AlertCircle className="w-4 h-4" />
                      <span>{t('events.assemblyConcluded')}</span>
                    </div>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{evt.visibility === 'PRIVATE' ? 'Members Only Gathering' : 'Open to the Public'}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

    </motion.div>
  );
}
