'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string; // e.g. "2026-07-01"
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      // If we only have "YYYY-MM-DD", let's append "T09:00:00" to make it start at standard morning symposium hours
      const formattedDate = targetDate.includes('T') ? targetDate : `${targetDate}T09:00:00`;
      const target = new Date(formattedDate).getTime();
      const difference = target - now;

      if (isNaN(target) || difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, isPast: false };
    };

    // Initial check
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isPast) {
    return (
      <span className="inline-flex items-center space-x-1.5 bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200 uppercase tracking-wider font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        <span>Concluded</span>
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 bg-amber-500/10 text-amber-800 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-amber-500/25 shrink-0 shadow-sm">
      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
      <span>
        {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
}
