import type { Metadata } from 'next';
import Events from '@/components/Events';
import { getEvents } from '@/lib/server/public-data';

export const revalidate = 120;
export const metadata: Metadata = { title: 'Lectures & Events', description: 'Upcoming lectures, discussions and gatherings of the IUJ Reading Club.' };

export default async function Page() {
  const events = await getEvents();
  return <div className="redesigned-page px-4 sm:px-6 lg:px-8"><Events events={events} /></div>;
}
