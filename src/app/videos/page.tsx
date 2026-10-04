import { Suspense } from 'react';
import type { Metadata } from 'next';
import Media from '@/components/Media';
import { getGalleryItems, getVideos } from '@/lib/server/public-data';

export const revalidate = 120;
export const metadata: Metadata = { title: 'Videos & Lectures', description: 'Watch lectures and talks from the IUJ Reading Club without leaving the site.' };

export default async function Page() {
  const [videos, gallery] = await Promise.all([getVideos(), getGalleryItems()]);
  return <div className="redesigned-page px-4 sm:px-6 lg:px-8"><Suspense fallback={null}><Media videos={videos} gallery={gallery} /></Suspense></div>;
}
