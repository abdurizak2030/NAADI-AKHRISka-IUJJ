import type { Metadata } from 'next';
import { MemberDashboardPage } from '@/components/DashboardClient';

export const metadata: Metadata = { title: 'My Dashboard', robots: { index: false } };
export default function Page() { return <MemberDashboardPage />; }
