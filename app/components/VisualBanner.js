'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Microscope, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const VisualBanner = () => {
  return (
    <section className="py-4 px-4 md:px-6 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[1800px] mx-auto">
        
        {/* Banner 1: The Science */}
        <Link href="/SkinCare" className="group relative h-[450px] md:h-[600px] rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100">
            <div className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-105">
                <Image 
                    src="/Screenshot 2026-02-04 160151.png" 
                    alt="Scientific Excellence" 
                    fill 
                    className="object-cover opacity-80 mix-blend-multiply" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative z-10 h-full p-10 md:p-14 flex flex-col justify-end items-start text-left">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                            <Microscope size={14} className="text-brand-pink" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Molecular Research</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-serif italic text-white leading-tight">The Science of <br/>Lumière</h3>
                    <p className="text-white/80 text-sm md:text-base font-medium max-w-xs leading-relaxed">
                        Precision biological extraction from the heart of the Swiss Alps.
                    </p>
                    <div className="pt-4">
                        <span className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white border-b border-white/30 pb-1 group-hover:border-white transition-all">
                            Explore Protocols <ArrowRight size={14} />
                        </span>
                    </div>
                </motion.div>
            </div>
        </Link>

        {/* Banner 2: The Art of Ritual */}
        <Link href="/fragrance" className="group relative h-[450px] md:h-[600px] rounded-[2.5rem] overflow-hidden bg-[#FAF9F6] border border-gray-100">
            <div className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-105">
                <Image 
                    src="/GerLift_3_4x5 copie.jpg" 
                    alt="The Collection" 
                    fill 
                    className="object-cover opacity-90" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative z-10 h-full p-10 md:p-14 flex flex-col justify-end items-start text-left">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                            <Sparkles size={14} className="text-brand-pink" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Artisanal Curation</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-serif italic text-white leading-tight">The Art of <br/>The Ritual</h3>
                    <p className="text-white/80 text-sm md:text-base font-medium max-w-xs leading-relaxed">
                        Curated masterpieces for your daily transformative journey.
                    </p>
                    <div className="pt-4">
                        <span className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white border-b border-white/30 pb-1 group-hover:border-white transition-all">
                            Discover Collection <ArrowRight size={14} />
                        </span>
                    </div>
                </motion.div>
            </div>
        </Link>

      </div>
    </section>
  );
};
