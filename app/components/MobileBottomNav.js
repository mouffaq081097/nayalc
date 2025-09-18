'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { cart } = useAppContext();
  const { isAuthenticated } = useAuth();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { name: 'Home', icon: 'home', href: '/' },
    { name: 'Shop', icon: 'grid', href: '/products' },
    { name: 'Account', icon: 'user', href: isAuthenticated ? '/account' : '/auth' },
    { name: 'Cart', icon: 'bag', href: '/cart', count: cartItemCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="flex justify-around h-16 items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.name} className="flex flex-col items-center justify-center text-xs font-medium relative" style={{ color: isActive ? 'var(--brand-pink)' : 'var(--brand-muted)' }}>
              <Icon name={item.icon} className="w-6 h-6" />
              <span className="mt-1">{item.name}</span>
              {item.count > 0 && item.name === 'Cart' && (
                <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-brand-pink text-white text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;