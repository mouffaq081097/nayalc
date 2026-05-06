'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useAccountData } from './_components/useAccountData';
import PageLoader from '@/app/components/PageLoader';

export default function AccountLayout({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading } = useAccountData();

  useEffect(() => {
    if (!user) router.push('/auth');
  }, [user, router]);

  if (!user) return null;

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-white font-sans text-[#1d1d1f]">
      {children}
    </div>
  );
}

