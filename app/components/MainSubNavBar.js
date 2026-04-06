"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { getNewArrivals } from '../lib/api';
import { motion } from 'framer-motion';

export function MainSubNavBar({ loyaltyPoints, user }) {
  const router = useRouter();
  const [newArrivalsCount, setNewArrivalsCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    async function fetchNewArrivalsCount() {
      try {
        const products = await getNewArrivals();
        setNewArrivalsCount(products.length);
      } catch (error) {
        console.error("Failed to fetch new arrivals count:", error);
      }
    }
    fetchNewArrivalsCount();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (currentY < 80) {
        setIsVisible(true);
      } else if (diff > 6) {
        setIsVisible(false);
      } else if (diff < -6) {
        setIsVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Skincare', path: '/SkinCare' },
    { name: 'All Products', path: '/all-products' },
    { name: 'Brands', path: '/brands' },
    { name: 'Fragrance', path: '/fragrance' },
    { name: 'Collections', path: '/collections' },
    { name: 'Gift Sets', path: '/gift-sets' },
    { name: 'Sales', path: '/sales' },
  ];

  if (newArrivalsCount > 0) {
    navItems.unshift({ name: 'New Arrivals', path: '/new-arrivals' });
  }

  return (
    <motion.div
      animate={{ y: isVisible ? 0 : -48 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="hidden md:block overflow-x-auto no-scrollbar py-1"
      style={{ background: 'var(--cl-bg)', borderBottom: '1px solid var(--cl-glass-border)' }}
    >
      <div className="container mx-auto flex items-center justify-center gap-6 min-w-max px-4 text-[11px] font-medium tracking-tight">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className="transition-colors py-2 whitespace-nowrap"
            style={{ color: 'var(--cl-text-light)' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--cl-purple)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--cl-text-light)'}
          >
            {item.name}
          </button>
        ))}
        {user && (
          <button
            onClick={() => router.push('/loyalty')}
            className="flex items-center gap-1 transition-opacity py-2 cl-gradient-text font-semibold hover:opacity-80"
          >
            <Star className="h-3 w-3" />
            <span>Loyalty ({loyaltyPoints.toLocaleString()})</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
