"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { getNewArrivals } from '../lib/api';

export function MainSubNavBar({ loyaltyPoints, user }) {
  const router = useRouter();

  const [newArrivalsCount, setNewArrivalsCount] = useState(0);

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
    <div className="hidden md:block bg-white border-b border-gray-100 overflow-hidden transition-[height] duration-300 ease-in-out py-1">
      <div className="container mx-auto flex items-center justify-center space-x-6 text-sm font-medium">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors py-2"
          >
            {item.name}
          </button>
        ))}
        {user && <button 
          onClick={() => router.push('/loyalty')} 
          className="flex items-center gap-1 text-[var(--brand-pink)] hover:text-[var(--brand-pink-dark)] transition-colors py-2"
        >
          <Star className="h-4 w-4" />
          <span>Loyalty ({loyaltyPoints.toLocaleString()})</span>
        </button>}
      </div>
    </div>
  );
}
