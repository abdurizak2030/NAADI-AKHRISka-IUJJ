'use client';

import { useRouter } from 'next/navigation';
import Login from '@/components/Login';
import { useApp } from '@/components/AppProvider';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const { login, user } = useApp();
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);
  return (
    <Login
      onLoginSuccess={(u, t) => {
        login(u, t);
        router.push('/dashboard');
      }}
      onBackToHome={() => router.push('/')}
    />
  );
}
