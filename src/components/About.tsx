'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentType } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Eye,
  Facebook,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  Quote,
  Sparkles,
  Target,
  Twitter,
  UsersRound,
} from 'lucide-react';
import { motion } from 'motion/react';
import { mediaUrl } from '../lib/api';
import { FounderInfo, FounderSocialLink, Testimonial } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import TestimonialsSlider from './TestimonialsSlider';

interface AboutProps {
  testimonials: Testimonial[];
  founder?: FounderInfo | null;
}

const sectionVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const listVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

const SOCIAL_ICONS: Record<FounderSocialLink['platform'], ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  email: Mail,
  website: Globe,
};

export default function About({ testimonials, founder = null }: AboutProps) {
  const { t } = useLanguage();

  const aboutLabel = t('about.whoWeAre') || t('about.cardAboutTitle');
  const founderLinks = founder?.socials ?? [];

  const principles = [
    {
      id: 'about-akhris',
      icon: BookOpen,
      word: 'Akhris.',
      label: t('about.cardAboutTitle'),
      body: t('about.cardAboutText'),
    },
    {
      id: 'about-faham',
      icon: Eye,
      word: 'Faham.',
      label: t('about.ourVision'),
      body: t('about.cardVisionText'),
    },
    {
      id: 'about-hormar',
      icon: Target,
      word: 'Hormar.',
      label: t('about.ourMission'),
      body: t('about.cardMissionText'),
    },
  ];

  const facts = [
    {
      icon: CalendarDays,
      label: t('about.cardFoundedTitle'),
      value: t('about.cardFoundedDate'),
    },
    {
      icon: GraduationCap,
      label: 'Parent University',
      value: 'Islamic University of Jigjiga',
    },
    {
      icon: UsersRound,
      label: t('about.luminaries'),
      value: t('about.heroName'),
    },
  ];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 pb-16" id="about-section">
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={sectionVariant}
        className="pt-6 sm:pt-8 lg:pt-10"
        id="about-header"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[1.5rem] bg-emerald-950 text-white shadow-xl">
            <div className="relative min-h-[460px] sm:min-h-[540px] lg:min-h-[600px]">
              <Image
                src="/jaamacada.jpg"
                alt={t('about.heroName')}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/45 to-emerald-950/5" />
              <motion.div
                variants={itemVariant}
                className="absolute inset-x-0 bottom-0 px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
              >
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase text-amber-100 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{aboutLabel}</span>
                  </div>
                  <h2 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                    {t('about.clubName')}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/85 sm:text-lg">
                    {t('about.tagline')}
                  </p>
                  <p className="mt-5 max-w-2xl border-l-2 border-amber-400 pl-4 font-serif text-sm italic leading-7 text-amber-100/90">
                    {t('about.officialName')}
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              variants={listVariant}
              className="grid divide-y divide-white/10 border-t border-white/10 bg-emerald-950/96 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
              aria-label="About highlights"
            >
              {facts.map(({ icon: Icon, label, value }) => (
                <motion.div key={label} variants={itemVariant} className="flex gap-4 p-5 sm:p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300/25 bg-white/5 text-amber-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-emerald-100/55">{label}</p>
                    <p className="mt-1 text-sm font-extrabold leading-6 text-white">{value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.16 }}
        variants={sectionVariant}
        className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.45fr_1fr] lg:gap-14 lg:px-8"
        id="about-pillars"
      >
        <div className="self-start lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase text-amber-700 ring-1 ring-amber-200/70">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{t('about.cardAboutTitle')}</span>
          </div>
          <h3 className="mt-5 max-w-lg font-display text-4xl font-extrabold leading-[1.08] text-emerald-950 sm:text-5xl">
            Akhris. Faham. Hormar.
          </h3>
          <p className="mt-5 max-w-md text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">
            {t('about.cardAboutText')}
          </p>
        </div>

        <motion.div
          variants={listVariant}
          className="grid border-y border-emerald-900/10 md:grid-cols-3 md:divide-x md:divide-emerald-900/10"
        >
          {principles.map(({ id, icon: Icon, word, label, body }) => (
            <motion.article
              key={id}
              variants={itemVariant}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="border-b border-emerald-900/10 py-7 last:border-b-0 md:border-b-0 md:px-6 lg:px-8"
              id={id}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-900/10 bg-white text-emerald-900 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-6 font-display text-3xl font-extrabold leading-none text-emerald-950">
                {word}
              </p>
              <p className="mt-3 text-xs font-bold uppercase text-amber-600">{label}</p>
              <p className="mt-4 text-sm leading-7 text-gray-600">{body}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      {founder && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
          variants={sectionVariant}
          className="border-y border-emerald-900/10 bg-gray-50 py-14 sm:py-16"
          id="founder-section"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(240px,0.48fr)_1fr] lg:px-8">
            <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-emerald-900 sm:min-h-[380px]">
              <img
                loading="lazy"
                src={mediaUrl(founder.imageUrl) || '/logo.png'}
                alt={founder.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/88 via-emerald-950/18 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs font-bold uppercase text-amber-200">{t('founder.badge')}</p>
                <h3 className="mt-2 font-display text-2xl font-extrabold leading-tight text-white">
                  {founder.name}
                </h3>
                <p className="mt-1 text-sm text-emerald-50/75">
                  {founder.title || t('founder.positionFallback')}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="max-w-3xl space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase text-amber-600">{t('founder.sectionTitle')}</p>
                  <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight text-emerald-950 sm:text-4xl">
                    {t('founder.sectionSubtitle')}
                  </h3>
                </div>

                {founder.bio && (
                  <p className="text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">{founder.bio}</p>
                )}

                {founder.message && (
                  <div className="border-l-2 border-amber-500 pl-5">
                    <Quote className="h-5 w-5 text-amber-500" />
                    <p className="mt-3 font-serif text-sm italic leading-7 text-emerald-900 dark:text-emerald-100/90">
                      {founder.message}
                    </p>
                  </div>
                )}

                {founderLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="mr-2 text-xs font-bold uppercase text-gray-500">
                      {t('founder.followLabel')}
                    </span>
                    {founderLinks.map((link, i) => {
                      const Icon = SOCIAL_ICONS[link.platform];
                      return (
                        <a
                          key={`${link.platform}-${i}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={link.platform}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-900/10 bg-white text-emerald-900 transition-colors hover:border-amber-500 hover:bg-amber-400 hover:text-emerald-950"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={sectionVariant}
        className="border-b border-emerald-900/10 bg-white py-12 sm:py-14"
        id="parent-university-section"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[9rem_1fr_auto] lg:items-center lg:px-8">
          <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-amber-500/35 bg-white p-1">
            <Image
              src="/logoIUJJ.jpg"
              alt="Islamic University of Jigjiga"
              fill
              sizes="112px"
              className="object-cover p-1"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600">
              <GraduationCap className="h-4 w-4" />
              <span>Our Parent University</span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-emerald-950 sm:text-3xl">
              Islamic University of Jigjiga
            </h3>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              Jamacadda Islaamiga ee Jigjiga waxaa la aasaasay 2014 si ay u noqoto xarun cilmiyeed oo heer sare ah oo ay ku xirnaadaan ardayda Soomaaliyeed iyo dadka kale ee gobolka. Jaamacaddu waxay bixisaa barnaamijyo kala duwan oo heer jaamacadeed ah, iyadoo u adeegaysa nidaam waxbarasho oo ku dhisan aqoonta iyo akhlaaqda.
            </p>
          </div>

          <a
            href="https://www.iu-jigjiga.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-500 hover:text-emerald-950"
          >
            Visit Official Website
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </motion.section>

      {testimonials.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={sectionVariant}
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
          id="about-testimonials"
        >
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase text-amber-600">{t('about.testimonialsBadge')}</p>
            <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight text-emerald-950 sm:text-4xl">
              {t('about.testimonialsTitle')}
            </h3>
            <p className="mt-4 text-sm leading-7 text-gray-600">{t('about.testimonialsSubtitle')}</p>
          </div>
          <TestimonialsSlider testimonials={testimonials} />
        </motion.section>
      )}
    </div>
  );
}
