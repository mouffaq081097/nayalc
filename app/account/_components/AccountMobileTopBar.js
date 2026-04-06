'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { setAccountNavDirection } from './navDirection';

export function AccountMobileTopBar({ title }) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 md:hidden">
      <div className="border-b border-black/[0.06] bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Button
            type="button"
            variant="pillGlass"
            size="pillIcon"
            onClick={() => {
              setAccountNavDirection(-1);
              router.push('/account');
            }}
            className="border-black/10 bg-white/90"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-[13px] font-semibold tracking-tight text-[#1d1d1f]">
              {title}
            </p>
          </div>
          <div className="w-11" />
        </div>
      </div>
    </div>
  );
}

