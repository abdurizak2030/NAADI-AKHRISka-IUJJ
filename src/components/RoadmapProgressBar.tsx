'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Academy Roadmap progress bar - auto-calculates start date, end date,
 * elapsed time, remaining days, and completion percentage with lightweight
 * motion handled by CSS/Framer rather than a manual animation loop.
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';
import { RoadmapProgress } from '../types';
import { motion } from 'motion/react';
import { Calendar, Clock, TrendingUp, Loader2 } from 'lucide-react';

export default function RoadmapProgressBar() {
  const [progress, setProgress] = useState<RoadmapProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/api/roadmap/progress`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.completionPercentage === 'number') {
          setProgress(data);
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.error('Roadmap progress load error:', error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs py-4 justify-center">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading roadmap...
      </div>
    );
  }

  if (!progress) return null;

  const completion = progress.completionPercentage;
  const barColor =
    completion >= 100
      ? 'bg-emerald-500'
      : completion >= 66
      ? 'bg-emerald-400'
      : completion >= 33
      ? 'bg-amber-400'
      : 'bg-amber-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4" id="roadmap-progress-bar">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-emerald-950">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-sm font-sans">Academy Roadmap Progress</h4>
        </div>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-100">
          {progress.elapsedDays}/{progress.totalDays} days
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-950">{completion}% complete</span>
          <span className="text-gray-400 text-[11px]">{progress.remainingDays} days remaining</span>
        </div>
        <div
          className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Academy roadmap completion"
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${completion}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-emerald-50/50 rounded-xl p-2.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-700 mx-auto mb-1" />
          <p className="text-[10px] font-bold text-emerald-950">Start</p>
          <p className="text-[10px] text-gray-500">{progress.startDate}</p>
        </div>
        <div className="bg-emerald-50/50 rounded-xl p-2.5">
          <Calendar className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
          <p className="text-[10px] font-bold text-emerald-950">End</p>
          <p className="text-[10px] text-gray-500">{progress.endDate}</p>
        </div>
        <div className="bg-amber-50/50 rounded-xl p-2.5">
          <Clock className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
          <p className="text-[10px] font-bold text-emerald-950">Elapsed</p>
          <p className="text-[10px] text-gray-500">{progress.elapsedDays} days</p>
        </div>
        <div className="bg-amber-50/50 rounded-xl p-2.5">
          <Clock className="w-3.5 h-3.5 text-emerald-700 mx-auto mb-1" />
          <p className="text-[10px] font-bold text-emerald-950">Remaining</p>
          <p className="text-[10px] text-gray-500">{progress.remainingDays} days</p>
        </div>
      </div>
    </div>
  );
}