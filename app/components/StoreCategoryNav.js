'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function StoreCategoryNav({ onFilterClick }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();

        const formatted = data.map(cat => {
          let image = cat.imageUrl;
          const lowerName = cat.name?.toLowerCase() || '';

          if (lowerName.includes('anti-aging') || lowerName.includes('serum'))
            image = '/Adobe Express - file (12).png';
          if (lowerName.includes('fragrance') || cat.id === 4)
            image = '/Screenshot 2026-02-04 154042.png';
          if (lowerName.includes('lifting') || lowerName.includes('firming'))
            image = '/Screenshot 2026-02-04 155300.png';
          if (lowerName.includes('makeup removal') || lowerName.includes('cleansing'))
            image = '/Screenshot 2026-02-04 160151.png';
          if (lowerName.includes('concerns') || lowerName.includes('treatments'))
            image = '/Screenshot 2026-02-04 160817.png';
          if (lowerName.includes('supplement'))
            image = '/CalmingCapi_2_2x3 copie.png';
          if (lowerName.includes('gift') || lowerName.includes('set'))
            image = '/Coffret Peaux Ractives.png';

          return {
            id: cat.id,
            name: cat.name ? cat.name.charAt(0).toUpperCase() + cat.name.slice(1) : '',
            image,
            href: cat.id === 4 ? '/fragrance' : (lowerName === 'skincare' ? '/SkinCare' : `/collections/${cat.id}`)
          };
        });

        setCategories(formatted);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) return (
    <div className="w-full bg-[var(--cl-bg)]/80 border-b border-[var(--cl-glass-border)]/50 h-16 flex items-center px-6 md:px-10">
      <div className="flex gap-2 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-9 w-28 rounded-full bg-gray-200/60" />
        ))}
      </div>
    </div>
  );

  const isAllActive = pathname === '/all-products';

  return (
    <nav className="w-full bg-[var(--cl-bg)]/80 backdrop-blur-md border-b border-[var(--cl-glass-border)]/50 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 px-6 md:px-10 py-3 min-w-max">

          {/* "All" pill */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/all-products"
              className={`flex-shrink-0 flex items-center px-5 py-2 rounded-full text-[11px] font-bold tracking-tight transition-all duration-300 ${
                isAllActive
                  ? 'text-white shadow-sm'
                  : 'bg-white/70 border border-[var(--cl-glass-border)] text-cl-mid hover:border-[var(--cl-purple)] hover:text-[var(--cl-purple)]'
              }`}
              style={isAllActive ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' } : {}}
            >
              All
            </Link>
          </motion.div>

          {categories.map((cat, index) => {
            const isActive = pathname.includes(cat.href) && cat.href !== '/all-products';
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
              >
                <Link
                  href={cat.href}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-full text-[11px] font-semibold tracking-tight transition-all duration-300 ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-white/70 border border-[var(--cl-glass-border)] text-cl-mid hover:border-[var(--cl-purple)] hover:text-[var(--cl-purple)]'
                  }`}
                  style={isActive ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' } : {}}
                >
                  {cat.image && (
                    <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-contain mix-blend-multiply"
                      />
                    </div>
                  )}
                  {cat.name}
                </Link>
              </motion.div>
            );
          })}

        </div>
      </div>
    </nav>
  );
}
