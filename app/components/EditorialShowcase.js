'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const EditorialShowcase = () => {
  const highlights = [
    {
      title: 'Swiss origin',
      desc: 'Clinical formulas selected for a refined skincare ritual.',
      icon: ShieldCheck,
    },
    {
      title: 'Curated pairing',
      desc: 'Layered textures chosen to support glow, firmness, and comfort.',
      icon: Star,
    },
    {
      title: 'Visible radiance',
      desc: 'A polished routine built for skin that looks rested and luminous.',
      icon: Sparkles,
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-gray-100 bg-transparent py-12 md:py-16">
      <div className="absolute inset-0 bg-[url('/textures/natural-paper.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b4fe]/70 to-transparent" />

      <div className="container relative z-20 mx-auto px-6">
        <div className="grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-[#eadcff] bg-[#ffffff] shadow-[0_28px_70px_-35px_rgba(59,7,100,0.38)] md:rounded-[34px]">
              <Image
                src="/Argini+MyMyoso_2x3.jpg"
                alt="Master skincare collection"
                fill
                sizes="(max-width: 768px) 100vw, 52vw"
                className="object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2f1646]/35 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/50 bg-white/80 px-4 py-3 backdrop-blur-xl md:bottom-5 md:left-5 md:right-5">
                <span className="text-[12px] font-semibold tracking-normal text-[#3b0764]">
                  Complete ritual
                </span>
                <span className="text-[12px] font-medium tracking-normal text-gray-600">
                  Skincare edit
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-7"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-[#c4a7fe] to-[#d8b4fe]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#9368ec]">
                  Editorial spotlight
                </span>
              </div>

              <h2 className="text-3xl font-serif italic leading-tight text-cl-deep md:text-5xl">
                The master{' '}
                <span
                  className="font-sans not-italic font-black"
                  style={{
                    backgroundImage: 'var(--brand-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  collection
                </span>
              </h2>

              <p className="max-w-xl text-[15px] font-medium leading-7 text-gray-600 md:text-base">
                A composed edit of high-performance skincare selected for customers who want a complete,
                polished routine without visual noise.
              </p>
            </div>

            <div className="space-y-3">
              {highlights.map(({ title, desc, icon: Icon }) => (
                <div
                  key={title}
                  className="group flex items-start gap-4 rounded-2xl border border-[#eadcff] bg-white/70 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-[#d8b4fe] hover:bg-white"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#7e22ce] transition-colors duration-300 group-hover:bg-[#9333ea] group-hover:text-white">
                    <Icon size={17} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold tracking-normal text-[#24152f]">
                      {title}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium leading-6 text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/all-products"
              className="group inline-flex items-center gap-3 rounded-full border-2 border-[#c4b5fd] bg-white/40 px-6 py-3 text-[14px] font-semibold text-[#8b5cf6] transition-all duration-300 hover:border-[#a78bfa] hover:bg-[#f5f3ff] hover:text-[#6b21a8] hover:shadow-[0_0_16px_2px_rgba(196,167,254,0.4)] md:px-8"
            >
              Explore the collection
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
