'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const EditorialShowcase = () => {
  return (
    <section className="py-10 relative overflow-hidden bg-transparent">
      {/* ── Animated Background Atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(216,180,254,0.1)_0%,transparent_70%)]" />
        
        {/* Breathing Aura Orb 1 */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(196,167,254,0.4) 0%, transparent 70%)' }}
        />
        
        {/* Breathing Aura Orb 2 */}
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(249,168,212,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-20 text-center">
        {/* ── Eyebrow & Headline ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 md:mb-12 space-y-3"
        >
          {/* Animated pill badge */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#f5f3ff] rounded-full border border-[#e9d5ff]"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={10} className="text-[#9333ea] md:w-[12px]" />
            </motion.div>
            <span className="text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase text-[#9333ea]">Editorial Spotlight</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-6xl font-sans font-black uppercase tracking-tight text-gray-900 leading-[0.95]">
            The Master <br/>
            <motion.span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#c4b5fd] via-[#9333ea] to-[#7e22ce] inline-block"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ backgroundSize: '200% 200%' }}
            >
              Collection.
            </motion.span>
          </h2>
        </motion.div>

        {/* ── Main Composition ── */}
        <div className="relative max-w-4xl mx-auto">
          {/* Floating Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="aspect-[4/3] md:aspect-[2.4/1] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-10px_rgba(147,51,234,0.1)] md:shadow-[0_30px_60px_-15px_rgba(147,51,234,0.15)]"
            >
              <Image 
                src="/Argini+MyMyoso_2x3.jpg" 
                alt="Editorial Showcase" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                className="object-cover object-center" 
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
            </motion.div>
          </motion.div>

          {/* Overlapping Info Cards - Grid on mobile with smaller cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 -mt-6 md:-mt-16 relative z-20 px-4 md:px-10">
            {[
              { title: 'Swiss Origin', desc: 'Molecular precision meets alpine purity.', icon: <ShieldCheck className="w-3.5 h-3.5" />, floatDelay: 0 },
              { title: 'Selection', desc: 'Voted #1 for cellular rejuvenation.', icon: <Star className="w-3.5 h-3.5" />, floatDelay: 1 },
              { title: 'Results', desc: 'Noticeable radiance in just 7 days.', icon: <Sparkles className="w-3.5 h-3.5" />, floatDelay: 2 }
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ y: -4, boxShadow: '0 15px 30px -8px rgba(147,51,234,0.1)' }}
                className="bg-white/95 backdrop-blur-xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-[#f3e8ff] shadow-sm transition-all duration-300 group cursor-pointer"
              >
                {/* Compact icon container */}
                <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: card.floatDelay * 0.5 }}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#f5f3ff] flex items-center justify-center text-[#9333ea] md:mb-3 group-hover:bg-[#ede9fe] transition-colors duration-300 shrink-0"
                  >
                    {card.icon}
                  </motion.div>
                  <div className="text-left">
                    <h3 className="text-[10px] md:text-[11px] font-black tracking-widest uppercase text-gray-900 mb-0.5 md:mb-1">{card.title}</h3>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Final CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 md:mt-8"
        >
          <Link
            href="/all-products"
            className="bg-transparent border-2 border-[#c4b5fd] text-[#a78bfa] hover:bg-[#f5f3ff] hover:border-[#a78bfa] hover:text-[#7e22ce] shadow-sm px-4 py-2.5 md:px-8 md:py-3.5 text-[11px] md:text-[13px] font-black tracking-tight rounded-full transition-all duration-300 inline-flex items-center gap-2 md:gap-3 group shrink-0"
          >
            Explore the Science
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
