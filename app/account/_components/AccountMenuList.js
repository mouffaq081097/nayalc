'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User, Package, Heart, Star, MapPin, Settings, ChevronRight, LogOut,
} from 'lucide-react';
import { setAccountNavDirection } from './navDirection';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

const GROUPS = [
  {
    label: 'Account',
    items: [
      { id: 'profile',   label: 'Profile',      href: '/account/profile',   Icon: User,     color: '#8b5cf6' },
      { id: 'orders',    label: 'Orders',        href: '/account/orders',    Icon: Package,  color: '#f59e0b' },
      { id: 'wishlist',  label: 'Wishlist',      href: '/account/wishlist',  Icon: Heart,    color: '#ef4444', badge: true },
    ],
  },
  {
    label: 'Rewards',
    items: [
      { id: 'loyalty',   label: 'Naya Rewards',  href: '/account/loyalty',   Icon: Star,     color: '#f59e0b' },
    ],
  },
  {
    label: 'More',
    items: [
      { id: 'addresses', label: 'Addresses',     href: '/account/addresses', Icon: MapPin,   color: '#10b981' },
      { id: 'settings',  label: 'Settings',      href: '/account/settings',  Icon: Settings, color: '#6b7280' },
    ],
  },
];

export function AccountMenuList() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { loyaltyData, wishlistItems } = useAppContext();

  const points    = loyaltyData?.stats?.points ?? 0;
  const tier      = loyaltyData?.stats?.tier   || 'Member';
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;
  const initials  = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'NL';

  const go = (href) => {
    setAccountNavDirection(1);
    router.push(href);
  };

  return (
    <div className="md:hidden min-h-screen font-sans" style={{ background: '#f2f2f7' }}>
      <div className="max-w-lg mx-auto px-4 pt-14 pb-12">

        {/* Profile hero */}
        <div className="flex flex-col items-center text-center mb-8 pt-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 relative overflow-hidden shadow-md"
            style={{ background: 'linear-gradient(135deg,#c087fc,#9869f7)' }}
          >
            {user?.profile_image
              ? <Image src={user.profile_image} alt={user.first_name} fill className="object-cover" />
              : initials}
          </div>
          <h2 className="text-[18px] font-semibold text-gray-900">{user?.first_name} {user?.last_name}</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm">
            <Star size={11} className="fill-amber-400 stroke-amber-400" />
            <span className="text-[12px] font-semibold text-gray-700">{tier} Member</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-[12px] font-semibold text-purple-600">{points.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Nav groups */}
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-1 mb-1.5">
                {group.label}
              </p>
              <div className="rounded-2xl bg-white overflow-hidden shadow-sm divide-y divide-gray-100">
                {group.items.map(({ id, label, href, Icon, color, badge }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => go(href)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
                  >
                    {/* iOS-style icon bubble */}
                    <div
                      className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
                      style={{ background: color }}
                    >
                      <Icon size={16} strokeWidth={2} className="text-white" />
                    </div>
                    <span className="flex-1 text-[15px] font-normal text-gray-900">{label}</span>
                    {badge && wishCount > 0 && (
                      <span className="text-[11px] font-semibold bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 mr-1">
                        {wishCount}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <div className="rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => { logout(); router.push('/'); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 bg-red-500">
                <LogOut size={16} strokeWidth={2} className="text-white" />
              </div>
              <span className="flex-1 text-[15px] font-normal text-red-500">Sign Out</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
