import type { Metadata } from 'next';
import Home from '@/components/Home';
import { getArticleCards, getEvents, getFounderInfo, getMemberOfTheMonth, getTestimonialList } from '@/lib/server/public-data';
import { absoluteUrl, SITE_DESCRIPTION } from '@/lib/site';

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/') },
  description: SITE_DESCRIPTION,
};

export default async function Page() {
  const [founder, memberOfMonth, events, latest, testimonials] = await Promise.all([
    getFounderInfo(),
    getMemberOfTheMonth(),
    getEvents(),
    getArticleCards({ page: 1, pageSize: 3 }),
    getTestimonialList(),
  ]);
  return <Home founder={founder} memberOfMonth={memberOfMonth} upcomingEvents={events} articles={latest.items} testimonials={testimonials} />;
}
