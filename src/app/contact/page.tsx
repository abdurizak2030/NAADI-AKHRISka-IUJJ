import type { Metadata } from 'next';
import Contact from '@/components/Contact';

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with the IUJ Reading Club.' };

export default function Page() {
  return <div className="redesigned-page px-4 sm:px-6 lg:px-8"><Contact /></div>;
}
