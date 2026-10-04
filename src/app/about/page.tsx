import type { Metadata } from 'next';
import About from '@/components/About';
import { getFounderInfo, getTestimonialList } from '@/lib/server/public-data';

export const revalidate = 300;
export const metadata: Metadata = { title: 'About the Club', description: 'The story, mission and people behind the Islamic University of Jigjiga Reading Club.' };

export default async function Page() {
  const [founder, testimonials] = await Promise.all([getFounderInfo(), getTestimonialList()]);
  return <div className="redesigned-page px-4 sm:px-6 lg:px-8"><About testimonials={testimonials} founder={founder} /></div>;
}
