'use client';

import React from 'react';
import {
  Sparkles,
  Package,
  Heart,
  MapPin,
  Settings,
  Star,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { setAccountNavDirection } from './navDirection';

const sections = [
  { id: 'dashboard', label: 'Dashboard', href: '/account/dashboard', icon: Sparkles },
  { id: 'orders', label: 'Orders', href: '/account/orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { id: 'addresses', label: 'Addresses', href: '/account/addresses', icon: MapPin },
  { id: 'settings', label: 'Settings', href: '/account/settings', icon: Settings },
  { id: 'loyalty', label: 'Loyalty', href: '/account/loyalty', icon: Star },
];

export function AccountMenuList() {
  const router = useRouter();

  return (
    <div className="md:hidden">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-6">
        <p className="app-mobile-label mb-2 text-brand-pink">Account</p>
        <h1 className="font-serif text-[34px] font-light leading-[1.05] tracking-tight text-[#1d1d1f]">
          Settings
        </h1>
        <p className="mt-3 app-mobile-body">
          Manage your sanctuary, orders, and saved rituals.
        </p>

        <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-black/[0.06] bg-white/90 shadow-sm backdrop-blur-xl">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAccountNavDirection(1);
                  router.push(item.href);
                }}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[#1d1d1f]">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={16} className="text-black/30" />
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="pillSecondary"
            size="pill"
            onClick={() => router.push('/')}
            className="w-full max-w-2xl"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

