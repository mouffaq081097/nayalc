'use client';

import React from 'react';
import { Sparkles, Package, Heart, MapPin, Settings, Star, ChevronRight, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { setAccountNavDirection } from './navDirection';
import { useAuth } from '../../context/AuthContext';

const sections = [
  { id: 'dashboard', label: 'Dashboard',  href: '/account/dashboard',  icon: Sparkles },
  { id: 'profile',   label: 'Profile',    href: '/account/profile',    icon: User     },
  { id: 'orders',    label: 'Orders',     href: '/account/orders',     icon: Package  },
  { id: 'wishlist',  label: 'Wishlist',   href: '/account/wishlist',   icon: Heart    },
  { id: 'addresses', label: 'Addresses',  href: '/account/addresses',  icon: MapPin   },
  { id: 'settings',  label: 'Settings',   href: '/account/settings',   icon: Settings },
  { id: 'loyalty',   label: 'Loyalty',    href: '/account/loyalty',    icon: Star     },
];

export function AccountMenuList() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="md:hidden min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-px bg-brand-purple" />
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-purple">My Account</p>
          </div>
          <h1 className="text-[30px] font-bold leading-tight tracking-tight text-ink-900">
            {user?.first_name ? `Hello, ${user.first_name}.` : 'My Sanctuary'}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Manage your orders, wishlist, and preferences.
          </p>
        </div>

        {/* Nav list */}
        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-1">
          {sections.map((item, i) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {i > 0 && <div className="h-px bg-ink-200" />}
                <button
                  type="button"
                  onClick={() => {
                    setAccountNavDirection(1);
                    router.push(item.href);
                  }}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all hover:bg-ink-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-brand-purple">
                      <Icon size={17} strokeWidth={1.75} />
                    </span>
                    <span className="text-[15px] font-semibold tracking-tight text-ink-900">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={15} className="text-ink-400" />
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="mt-4 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-1">
          <button
            type="button"
            onClick={() => { logout?.(); router.push('/'); }}
            className="flex w-full items-center gap-4 px-5 py-4 text-left transition-all text-status-danger hover:bg-status-danger/5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-danger/10">
              <LogOut size={17} strokeWidth={1.75} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Sign Out</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-5 w-full py-3 rounded-full border border-ink-200 text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-ink-100 text-ink-700"
        >
          Back to Shop
        </button>
      </div>
    </div>
  );
}
