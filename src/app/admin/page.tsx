import type { Metadata } from 'next';
import { AdminPage } from '@/components/DashboardClient';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };
export default function Page() { return <AdminPage />; }
