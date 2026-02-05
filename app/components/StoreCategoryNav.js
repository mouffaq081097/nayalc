'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Filter } from 'lucide-react';

export default function StoreCategoryNav({ onFilterClick }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        // Map the database categories to the Apple shelf format
        const formatted = data.map(cat => {
            let image = cat.imageUrl;
            const lowerName = cat.name?.toLowerCase() || '';
            
            // Override for Anti-Aging / Serums
            if (lowerName.includes('anti-aging') || lowerName.includes('serum')) {
                image = '/Adobe Express - file (12).png';
            }

            // Override for Fragrance
            if (lowerName.includes('fragrance') || cat.id === 4) {
                image = '/Screenshot 2026-02-04 154042.png';
            }

            // Override for Lifting & Firming
            if (lowerName.includes('lifting') || lowerName.includes('firming')) {
                image = '/Screenshot 2026-02-04 155300.png';
            }

            // Override for Makeup Removal / Cleansing
            if (lowerName.includes('makeup removal') || lowerName.includes('cleansing')) {
                image = '/Screenshot 2026-02-04 160151.png';
            }

            // Override for Specific Skin Concerns / Treatments
            if (lowerName.includes('concerns') || lowerName.includes('treatments')) {
                image = '/Screenshot 2026-02-04 160817.png';
            }

            // Override for Supplements
            if (lowerName.includes('supplement')) {
                image = '/CalmingCapi_2_2x3 copie.png';
            }

            // Override for Gift Sets
            if (lowerName.includes('gift') || lowerName.includes('set')) {
                image = '/Coffret Peaux Ractives.png';
            }

            return {
                id: cat.id,
                // Ensure name starts with capital letter for Apple style
                name: cat.name ? cat.name.charAt(0).toUpperCase() + cat.name.slice(1) : '',
                image: image,
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
    <div className="w-full bg-white border-b border-gray-100 h-24 md:h-32 flex items-center justify-center">
        <div className="flex gap-10 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100"></div>
                    <div className="h-2 w-10 bg-gray-100 rounded"></div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
        <div className="max-w-[1400px] mx-auto flex items-center justify-center min-w-max px-6 py-4 md:py-6 gap-8 md:gap-14">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
            >
              <Link 
                href={cat.href} 
                className="flex flex-col items-center gap-3 group transition-all"
              >
                <div className="relative w-16 h-12 md:w-24 md:h-16 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                    {cat.image ? (
                      <Image 
                          src={cat.image} 
                          alt={cat.name}
                          fill
                          className="object-contain object-center mix-blend-multiply drop-shadow-sm group-hover:drop-shadow-xl transition-all" 
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center text-[10px] text-gray-300 uppercase font-black">
                          N/A
                      </div>
                    )}
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-[#1d1d1f]/60 group-hover:text-brand-pink group-hover:font-black transition-all tracking-[0.1em] uppercase text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}