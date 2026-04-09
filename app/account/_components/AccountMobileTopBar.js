'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { setAccountNavDirection } from './navDirection';

export function AccountMobileTopBar({ title }) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 md:hidden">
      <div className="px-4 py-3" style={{
        background: 'rgba(253,248,255,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(216,180,254,0.3)',
      }}>
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAccountNavDirection(-1);
              router.push('/account');
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(216,180,254,0.35)',
              color: 'rgb(126,105,230)',
            }}
            aria-label="Back"
          >
            <ChevronLeft size={17} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[13px] font-bold tracking-tight" style={{ color: '#3b0764' }}>
              {title}
            </p>
          </div>
          <div className="w-9" />
        </div>
      </div>
    </div>
  );
}
