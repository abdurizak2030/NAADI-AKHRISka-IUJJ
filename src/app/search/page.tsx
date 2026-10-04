import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchResultsPage from '@/components/SearchResultsPage';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

export default function Page() {
  return <Suspense fallback={null}><SearchResultsPage /></Suspense>;
}
