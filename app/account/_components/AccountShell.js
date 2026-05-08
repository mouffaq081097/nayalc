'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { User, Package, Heart, Star, MapPin, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { AccountMobileTopBar } from './AccountMobileTopBar';

const SIDEBAR_W = 200; // px

const NAV_ITEMS = [
  { id: 'profile',   label: 'Profile',      href: '/account/profile',   Icon: User     },
  { id: 'orders',    label: 'Orders',        href: '/account/orders',    Icon: Package  },
  { id: 'wishlist',  label: 'Wishlist',      href: '/account/wishlist',  Icon: Heart    },
  { id: 'loyalty',   label: 'Naya Rewards',  href: '/account/loyalty',   Icon: Star     },
  { id: 'addresses', label: 'Addresses',     href: '/account/addresses', Icon: MapPin   },
  { id: 'settings',  label: 'Settings',      href: '/account/settings',  Icon: Settings },
];

const PAGE_TITLES = {
  '/account/profile':   'Profile',
  '/account/orders':    'Orders',
  '/account/wishlist':  'Wishlist',
  '/account/loyalty':   'Naya Rewards',
  '/account/addresses': 'Addresses',
  '/account/settings':  'Settings',
};

export default function AccountShell({ children, wishCount = 0 }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const { loyaltyData } = useAppContext();

  // Track navbar scroll state to match its height exactly
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // When scrolled the navbar is: fixed top-0 + pt-3 (12px) + h-[60px] = 72px total
  // When not scrolled: fixed top-0 + h-[60px] = 60px
  const navbarH = scrolled ? 72 : 60;

  const tier      = loyaltyData?.stats?.tier || 'Member';
  const pageTitle = PAGE_TITLES[pathname] || 'My Account';
  const initials  = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'NL';

  return (
    <>
      {/* ── Mobile ── */}
      <AccountMobileTopBar title={pageTitle} />
      <div className="md:hidden min-h-screen pb-12 font-sans" style={{ background: '#f2f2f7' }}>
        <div className="max-w-lg mx-auto px-4 pt-4">{children}</div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden md:block font-sans">

        {/* Fixed sidebar — spans full viewport height, top adjusts with navbar */}
        <aside
          style={{
            position: 'fixed',
            top: navbarH,
            left: 0,
            bottom: 0,
            width: SIDEBAR_W,
            background: '#fff',
            borderRight: '1px solid #eaeaea',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 100,
            transition: 'top 0.3s ease',
          }}
        >
          {/* Page title */}
          <div className="px-5 pt-5 pb-4 border-b border-[#eaeaea]">
            <h1 className="text-[13px] font-semibold text-gray-900 tracking-tight">{pageTitle}</h1>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 px-3 space-y-0.5">
            {NAV_ITEMS.map(({ id, label, href, Icon }) => {
              const active = pathname === href || pathname?.startsWith(href + '/');
              return (
                <Link
                  key={id}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                    active
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon size={14} strokeWidth={active ? 2 : 1.75}
                    className={active ? 'text-gray-700' : 'text-gray-400'} />
                  {label}
                  {id === 'wishlist' && wishCount > 0 && (
                    <span className="ml-auto text-[10px] font-semibold bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
                      {wishCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User row */}
          <div className="border-t border-[#eaeaea] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-6 h-6 rounded-full overflow-hidden relative shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: 'linear-gradient(135deg,#c087fc,#9869f7)' }}
              >
                {user?.profile_image
                  ? <Image src={user.profile_image} alt={initials} fill className="object-cover" />
                  : initials}
              </div>
              <span className="text-[12px] text-gray-700 font-medium truncate">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </aside>

        {/* Content area — offset by sidebar width */}
        <div style={{ marginLeft: SIDEBAR_W, background: '#fafafa', minHeight: '100vh' }}>
          <main className="py-8 px-8 lg:px-14">
            {children}
          </main>
        </div>

      </div>
    </>
  );
}
