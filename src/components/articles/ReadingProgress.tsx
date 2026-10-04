'use client';

import React, { useEffect, useRef, useState } from 'react';

/** Thin gold bar fixed under the navbar showing how far through the article the reader is. */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.getElementById(targetId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const done = Math.min(Math.max(-rect.top + window.innerHeight * 0.25, 0), Math.max(total, 1));
      const ratio = total > 0 ? done / total : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
      setPct(Math.round(ratio * 100));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [targetId]);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent pointer-events-none" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div ref={barRef} className="h-full origin-left bg-gradient-to-r from-amber-500 via-amber-300 to-emerald-500 will-change-transform" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
}
