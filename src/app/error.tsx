'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#06140c] px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-bold font-display text-emerald-950 dark:text-emerald-50">Something went wrong</h1>
        <p className="text-sm text-gray-550 dark:text-emerald-200/70">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-5 py-2.5 rounded-full bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-900 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
