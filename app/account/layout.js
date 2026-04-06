'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useAccountData } from './_components/useAccountData';

export default function AccountLayout({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading } = useAccountData();

  useEffect(() => {
    if (!user) router.push('/auth');
  }, [user, router]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">
            Synchronizing Sanctuary
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#1d1d1f]">
      {children}
    </div>
  );
}

