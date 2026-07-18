'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reusable "founder spotlight" card. Renders the club founder's photo,
 * name, position, biography and an optional personal message alongside
 * optional social links. All static chrome (badges/labels) is pulled
 * from the i18n system via t('founder.*') so it re-renders instantly on
 * language change; the founder's own name/title/bio/message are
 * member-authored data from the API and are shown verbatim, matching
 * how the rest of the app treats database content (see Home.tsx).
 *
 * Usage:
 *   <FounderSection founder={founder} />
 */

import React from 'react';
import { mediaUrl } from '../lib/api';
import { GraduationCap, Quote, Facebook, Twitter, Linkedin, Instagram, Mail, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { FounderInfo, FounderSocialLink } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface FounderSectionProps {
  founder: FounderInfo | null;
  /** Optional override — falls back to founder.socials, then to none. */
  socials?: FounderSocialLink[];
  className?: string;
}

const SOCIAL_ICONS: Record<FounderSocialLink['platform'], React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  email: Mail,
  website: Globe,
};

export default function FounderSection({ founder, socials, className = '' }: FounderSectionProps) {
  const { t } = useLanguage();

  if (!founder) return null;

  const links = socials ?? founder.socials ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-950 shadow-2xl p-6 sm:p-10 lg:p-12 ${className}`}
      id="founder-section"
    >
      {/* Decorative glow orbs, matching the testimonials spotlight card */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -right-20 w-72 h-72 bg-amber-500 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-500 rounded-full blur-[100px] pointer-events-none"
      />
      <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.05] pointer-events-none" />

      <div className="relative z-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/20">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{t('founder.badge')}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            {t('founder.sectionTitle')}
          </h3>
          <p className="text-emerald-100/70 text-xs sm:text-sm">{t('founder.sectionSubtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 max-w-3xl mx-auto">
          <div className="shrink-0">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl p-1 gold-gradient-bg shadow-lg">
              <img
                loading="lazy"
                src={mediaUrl(founder.imageUrl)}
                alt={founder.name}
                className="w-full h-full rounded-2xl object-cover border-2 border-emerald-950"
              />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-4">
            <div>
              <h4 className="text-xl sm:text-2xl font-extrabold text-amber-300 font-display tracking-tight">
                {founder.name}
              </h4>
              <p className="text-emerald-100/70 text-xs sm:text-sm font-serif italic">
                {founder.title || t('founder.positionFallback')}
              </p>
            </div>

            {founder.bio && (
              <p className="text-emerald-50/90 text-xs sm:text-sm leading-relaxed font-sans">{founder.bio}</p>
            )}

            {founder.message && (
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80">
                  {t('founder.messageLabel')}
                </span>
                <div className="relative mt-2 pl-6">
                  <Quote className="absolute top-0 left-0 w-4 h-4 text-amber-400/40" />
                  <p className="text-amber-200 text-xs sm:text-sm font-serif leading-relaxed italic">
                    {founder.message}
                  </p>
                </div>
              </div>
            )}

            {links.length > 0 && (
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200/50">
                  {t('founder.followLabel')}
                </span>
                <div className="flex items-center gap-2">
                  {links.map((link, i) => {
                    const Icon = SOCIAL_ICONS[link.platform];
                    return (
                      <a
                        key={`${link.platform}-${i}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.platform}
                        className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-emerald-100 hover:bg-amber-400 hover:text-emerald-950 hover:border-amber-400 transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
