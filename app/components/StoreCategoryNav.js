'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function StoreCategoryNav({ onFilterClick }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const scrollRef = useRef(null);
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

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 16);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 16);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [categories]);

  if (isLoading) return (
    <div className="w-full h-[68px] flex items-center px-6 md:px-10 border-b"
      style={{ background: 'rgba(253,248,255,0.92)', borderColor: 'rgba(216,180,254,0.2)' }}>
      <div className="flex gap-2.5 animate-pulse">
        {[80, 140, 120, 100, 160, 130].map((w, i) => (
          <div key={i} className="h-9 rounded-full bg-purple-100/60 flex-shrink-0" style={{ width: w }} />
        ))}
      </div>
    </div>
  );

  const isAllActive = pathname === '/all-products';

  return (
    <nav
      className="w-full sticky top-0 z-40 border-b"
      style={{
        background: 'rgba(253,248,255,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(216,180,254,0.22)',
      }}
    >
      {/* Scroll container with fade masks */}
      <div className="relative max-w-[1400px] mx-auto">

        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to right, rgba(253,248,255,0.95) 0%, transparent 100%)',
            opacity: showLeftFade ? 1 : 0,
          }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to left, rgba(253,248,255,0.95) 0%, transparent 100%)',
            opacity: showRightFade ? 1 : 0,
          }}
        />

        <div
          ref={scrollRef}
          className="flex items-center gap-2 px-6 md:px-10 py-3.5 overflow-x-auto no-scrollbar"
        >

          {/* "All" pill */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-shrink-0"
          >
            <Link
              href="/all-products"
              className="flex items-center px-6 py-2.5 rounded-full text-[12.5px] font-bold tracking-wide transition-all duration-300 border"
              style={isAllActive ? {
                background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
                color: '#fff',
                borderColor: 'transparent',
                boxShadow: '0 4px 14px rgba(167,139,250,0.35)',
              } : {
                background: 'rgba(255,255,255,0.7)',
                color: '#6b21a8',
                borderColor: 'rgba(216,180,254,0.5)',
              }}
            >
              All
            </Link>
          </motion.div>

          {/* Divider */}
          <div className="flex-shrink-0 w-px h-5 mx-1" style={{ background: 'rgba(216,180,254,0.35)' }} />

          {categories.map((cat, index) => {
            const isActive = pathname.includes(cat.href) && cat.href !== '/all-products';
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
                className="flex-shrink-0"
              >
                <Link
                  href={cat.href}
                  className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[12.5px] font-semibold tracking-wide transition-all duration-300 border"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
                    color: '#fff',
                    borderColor: 'transparent',
                    boxShadow: '0 4px 14px rgba(167,139,250,0.32)',
                  } : {
                    background: 'rgba(255,255,255,0.65)',
                    color: '#4b2d7a',
                    borderColor: 'rgba(216,180,254,0.45)',
                  }}
                >
                  {cat.image && (
                    <div
                      className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 transition-transform duration-300"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(248,240,255,0.9)',
                        border: isActive ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(216,180,254,0.5)',
                      }}
                    >
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-contain p-0.5"
                        style={{ mixBlendMode: isActive ? 'normal' : 'multiply' }}
                      />
                    </div>
                  )}
                  <span className="whitespace-nowrap">{cat.name}</span>
                </Link>
              </motion.div>
            );
          })}

        </div>
      </div>
    </nav>
  );
}
