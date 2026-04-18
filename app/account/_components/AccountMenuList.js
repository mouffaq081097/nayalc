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

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
};

export function AccountMenuList() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="md:hidden min-h-screen" style={{ background: 'var(--cl-bg)' }}>
      {/* Aura */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]" style={{ background: 'rgba(196,167,254,0.18)' }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: 'rgba(249,168,212,0.12)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-10 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-px" style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' }} />
            <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'rgb(126,105,230)' }}>My Account</p>
          </div>
          <h1 className="text-[30px] font-bold leading-tight tracking-tight" style={{ color: '#3b0764' }}>
            {user?.first_name ? `Hello, ${user.first_name}.` : 'My Sanctuary'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(59,7,100,0.50)' }}>
            Manage your orders, wishlist, and preferences.
          </p>
        </div>

        {/* Nav list */}
        <div className="overflow-hidden rounded-3xl" style={glass}>
          {sections.map((item, i) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(216,180,254,0.25)' }} />}
                <button
                  type="button"
                  onClick={() => {
                    setAccountNavDirection(1);
                    router.push(item.href);
                  }}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all active:bg-purple-50/60"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                      <Icon size={17} strokeWidth={1.75} />
                    </span>
                    <span className="text-[15px] font-semibold tracking-tight" style={{ color: '#3b0764' }}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={15} style={{ color: 'rgba(147,51,234,0.4)' }} />
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="mt-4 overflow-hidden rounded-3xl" style={glass}>
          <button
            type="button"
            onClick={() => { logout?.(); router.push('/'); }}
            className="flex w-full items-center gap-4 px-5 py-4 text-left transition-all text-red-400 active:bg-red-50/60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(254,202,202,0.3)' }}>
              <LogOut size={17} strokeWidth={1.75} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Sign Out</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-5 w-full py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all"
          style={{ border: '1px solid rgba(216,180,254,0.45)', color: 'rgb(126,105,230)', background: 'rgba(255,255,255,0.6)' }}
        >
          Back to Shop
        </button>
      </div>
    </div>
  );
}
