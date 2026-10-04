import { Suspense } from 'react';
import type { Metadata } from 'next';
import LibraryView from '@/components/Library';
import { getBooks } from '@/lib/server/public-data';

export const revalidate = 120;
export const metadata: Metadata = { title: 'Digital Library', description: 'Browse, search, read and download books from the IUJ Reading Club digital library.' };

export default async function Page() {
  const pdfs = await getBooks();
  return <div className="redesigned-page px-4 sm:px-6 lg:px-8"><Suspense fallback={null}><LibraryView pdfs={pdfs} /></Suspense></div>;
}
