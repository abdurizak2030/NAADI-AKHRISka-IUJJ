'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Focused testimonial carousel with a dark-green panel, centered quote,
 * profile details, arrow controls, and thumbnail navigation.
 */

import { useCallback, useEffect, useState } from 'react';
import { mediaUrl } from '../lib/api';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Testimonial } from '../types';

interface TestimonialsSliderProps {
  testimonials: Testimonial[];
  autoPlayMs?: number;
}

const AVATAR_FALLBACK = '/logoIUJJ.jpg';
const STAR_ITEMS = [0, 1, 2, 3, 4];

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 34 : -34 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -34 : 34 }),
};

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

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-emerald-950 px-5 py-9 text-white shadow-xl ring-1 ring-amber-300/15 sm:px-10 sm:py-12 lg:px-14"
      id="testimonials-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(90deg,rgba(255,255,255,0.72)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.56)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-x-8 top-0 h-px bg-amber-300/30" />

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
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) goNext();
            else if (info.offset.x > 60) goPrev();
          }}
          transition={{ duration: 0.34, ease: 'easeOut' }}
          className="relative z-10 mx-auto flex max-w-3xl cursor-grab flex-col items-center text-center active:cursor-grabbing"
          id={`testimonial-slide-${active.id}`}
        >
          <Quote className="h-9 w-9 text-amber-300/35" aria-hidden="true" />

          <div className="mt-5 flex items-center justify-center gap-1.5" aria-label="Five star testimonial">
            {STAR_ITEMS.map((star) => (
              <Star key={star} className="h-4 w-4 fill-amber-300 text-amber-300" />
            ))}
          </div>

          <p className="mt-7 max-w-2xl font-serif text-lg italic leading-8 text-emerald-50 sm:text-xl sm:leading-9">
            &quot;{active.content}&quot;
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <img
              loading="lazy"
              src={mediaUrl(active.avatarUrl) || AVATAR_FALLBACK}
              alt={active.name}
              className="h-[72px] w-[72px] rounded-full border-2 border-amber-300 object-cover shadow-md shadow-emerald-950/40"
            />
            <div>
              <h4 className="font-display text-base font-extrabold text-white sm:text-lg">{active.name}</h4>
              <p className="mt-1 text-xs font-bold uppercase text-amber-200/90">
                {active.role || 'Reading Club Member'}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div className="relative z-10 mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-amber-100 transition hover:border-amber-300 hover:bg-amber-300 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 max-w-[22rem] flex-1 sm:flex-none items-center justify-center gap-2 overflow-x-auto px-1 py-1">
            {testimonials.map((tItem, i) => (
              <motion.button
                key={tItem.id}
                type="button"
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`Show testimonial from ${tItem.name}`}
                aria-current={i === index ? 'true' : undefined}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="relative shrink-0 cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-amber-300/70 focus:ring-offset-2 focus:ring-offset-emerald-950"
              >
                <img
                  loading="lazy"
                  src={mediaUrl(tItem.avatarUrl) || AVATAR_FALLBACK}
                  alt={tItem.name}
                  className={`rounded-full object-cover transition-all duration-300 ${
                    i === index
                      ? 'h-11 w-11 border-2 border-amber-300 opacity-100'
                      : 'h-9 w-9 border border-white/15 opacity-55 hover:opacity-95'
                  }`}
                />
                {i === index && (
                  <motion.span
                    layoutId="testimonial-active-ring"
                    className="absolute -inset-1 rounded-full border border-amber-300/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next testimonial"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-amber-100 transition hover:border-amber-300 hover:bg-amber-300 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </motion.section>
  );
}

