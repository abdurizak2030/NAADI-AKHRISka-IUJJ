'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import SearchModal from './SearchModal';

/** Page chrome. The login screen keeps its original full-screen, chrome-free layout. */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const bare = pathname === '/login';

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#06140c]" id="app-root">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-400 focus:text-emerald-950 focus:font-bold">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-grow w-full">
        {children}
      </main>
      <SiteFooter />
      <SearchModal />
    </div>
  );
}
