'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A modern testimonials carousel: a large "spotlight" card with a
 * gradient brand background and gold quote mark, plus a row of
 * clickable avatar chips beneath it so people can jump straight to a
 * specific testimonial. Auto-advances, pauses on hover, and supports
 * swipe/drag on touch devices.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { mediaUrl } from '../lib/api';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Testimonial } from '../types';

interface TestimonialsSliderProps {
  testimonials: Testimonial[];
  autoPlayMs?: number;
}

export default function TestimonialsSlider({ testimonials, autoPlayMs = 6000 }: TestimonialsSliderProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const count = testimonials.length;

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (count === 0) return;
      setDirection(dir);
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(goNext, autoPlayMs);
    return () => clearInterval(timer);
  }, [paused, count, autoPlayMs, goNext]);

  if (count === 0) return null;

  const active = testimonials[index];

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80, scale: 0.96 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative max-w-4xl mx-auto"
      id="testimonials-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Spotlight card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-950 shadow-2xl px-6 sm:px-16 py-12 sm:py-16 min-h-[320px] flex items-center">
        {/* Decorative glow orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500 rounded-full blur-[90px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.16, 0.08] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500 rounded-full blur-[90px] pointer-events-none"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.05]" />

        <Quote className="absolute top-8 left-6 sm:left-12 w-12 h-12 text-amber-400/25 pointer-events-none select-none" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={active.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) goNext();
              else if (info.offset.x > 60) goPrev();
            }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="relative z-10 w-full text-center space-y-7 cursor-grab active:cursor-grabbing"
            id={`testimonial-slide-${active.id}`}
          >
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>

            <p className="text-emerald-50 text-sm sm:text-lg md:text-xl leading-relaxed italic font-serif max-w-2xl mx-auto">
              &quot;{active.content}&quot;
            </p>

            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="w-16 h-16 rounded-full p-0.5 gold-gradient-bg shadow-lg">
                <img
                  loading="lazy"
                  src={mediaUrl(active.avatarUrl) || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150'}
                  alt={active.name}
                  className="w-full h-full rounded-full object-cover border-2 border-emerald-950"
                />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white font-display">{active.name}</h4>
                <p className="text-[11px] sm:text-xs text-amber-300/90 font-semibold uppercase tracking-wide">{active.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="hidden sm:flex absolute left-0 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-150 shadow-md items-center justify-center text-emerald-900 hover:bg-emerald-900 hover:text-white hover:scale-110 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            aria-label="Next testimonial"
            className="hidden sm:flex absolute right-0 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-150 shadow-md items-center justify-center text-emerald-900 hover:bg-emerald-900 hover:text-white hover:scale-110 transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Clickable avatar chips */}
          <div className="flex items-center justify-center gap-3 mt-7 flex-wrap px-4">
            {testimonials.map((tItem, i) => (
              <motion.button
                key={tItem.id}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`Show testimonial from ${tItem.name}`}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer"
              >
                <img
                  loading="lazy"
                  src={mediaUrl(tItem.avatarUrl) || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150'}
                  alt={tItem.name}
                  className={`rounded-full object-cover transition-all duration-300 ${
                    i === index
                      ? 'w-11 h-11 border-2 border-amber-500 shadow-md'
                      : 'w-8 h-8 border-2 border-transparent opacity-50 hover:opacity-90'
                  }`}
                />
                {i === index && (
                  <motion.div
                    layoutId="testimonial-active-ring"
                    className="absolute -inset-1 rounded-full border-2 border-amber-400/50"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
