'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { setAccountNavDirection } from './navDirection';

export function AccountMobileTopBar({ title }) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 md:hidden">
      <div
        className="flex items-center px-2 h-11"
        style={{
          background: 'rgba(242,242,247,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={() => {
            setAccountNavDirection(-1);
            router.push('/account');
          }}
          className="flex items-center gap-0.5 px-2 py-1 text-purple-600 active:opacity-50 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
          <span className="text-[16px] font-normal">Back</span>
        </button>

        {/* Centered title */}
        <p className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-gray-900 pointer-events-none">
          {title}
        </p>

        {/* Right spacer to balance back button */}
        <div className="ml-auto w-16" />
      </div>
    </div>
  );
}
