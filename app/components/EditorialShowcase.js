'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const EditorialShowcase = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Global Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>
      
      <div className="container mx-auto px-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-7xl mx-auto">
          
          {/* Visual Side: Minimal Spotlight */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-square md:aspect-[4/5] bg-[#FAF9F6] rounded-[3rem] overflow-hidden group shadow-2xl shadow-gray-200/50"
          >
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/Argini+MyMyoso_2x3.jpg" 
                    alt="Editorial Selection" 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
            
            {/* Minimal floating badge */}
            <div className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-black/5 shadow-sm">
                <Star size={12} className="text-brand-pink fill-brand-pink" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Selection of the Month</span>
            </div>
          </motion.div>

          {/* Content Side: Typographic Elegance */}
          <div className="flex flex-col items-start text-left space-y-10">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3">
                    <span className="w-10 h-px bg-brand-pink/30"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-pink flex items-center gap-2">
                        <Sparkles size={10} />
                        Editorial Spotlight
                    </span>
                </div>
                
                <h2 className="text-5xl md:text-7xl font-serif italic text-gray-900 leading-[1.1] tracking-tight">
                    The Essence of <br/>
                    <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500">Pure Radiance.</span>
                </h2>
                
                <p className="text-lg md:text-xl font-sans text-gray-500 max-w-lg leading-relaxed font-medium">
                    Discover the transformative power of Swiss molecular precision combined with the soul of wild-harvested botanicals.
                </p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-10 w-full border-t border-gray-100 pt-10"
            >
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 block mb-2">Purity Standard</span>
                    <p className="text-sm text-gray-400 font-medium">100% Organic & Certified Bio-extraction.</p>
                </div>
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 block mb-2">Clinical Results</span>
                    <p className="text-sm text-gray-400 font-medium">Visible cellular renewal within 14 days.</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
            >
                <Link href="/all-products" className="group relative flex items-center gap-6 px-10 py-5 bg-black text-white rounded-full overflow-hidden transition-all duration-500 hover:pr-14">
                    <span className="relative z-10 font-sans font-bold text-[11px] uppercase tracking-[0.2em]">Explore the Science</span>
                    <ArrowRight size={18} className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute inset-0 bg-brand-pink translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </Link>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Background Decorative Aura */}
      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-brand-blue/[0.03] rounded-full blur-[120px]"></div>
      </div>
    </section>
  );
};
