'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical, Leaf, Award } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const pillars = [
  { icon: FlaskConical, label: 'Bio-Cosmetic Science', detail: 'Cell-active formulas developed with dermatologists since 1971' },
  { icon: Leaf, label: 'Natural Intelligence', detail: 'Plant-origin ingredients working in harmony with your skin' },
  { icon: Award, label: 'Paris Expertise', detail: 'Trusted by skin professionals across 40+ countries worldwide' },
];

export const EditorialShowcase = () => {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#0f0520', minHeight: '520px' }}
    >
      {/* Lavender aura orbs */}
      <div
        className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(196,167,254,0.14) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-[-60px] right-[-60px] w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(249,168,212,0.10) 0%, transparent 65%)',
          filter: 'blur(36px)',
        }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-[280px] h-[280px] rounded-full pointer-events-none -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(147,104,236,0.08) 0%, transparent 70%)',
          filter: 'blur(48px)',
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(196,167,254,0.5) 40%, rgba(216,180,254,0.5) 60%, transparent)' }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch min-h-[520px]">

        {/* Left — Image panel (55%) */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="relative w-full md:w-[55%] min-h-[320px] md:min-h-[520px] overflow-hidden"
        >
          <Image
            src="/Argini+MyMyoso_2x3.jpg"
            alt="GERnétic bio-cosmetic collection"
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover object-center"
            priority
          />
          {/* Dark gradient vignette on right edge (desktop) to blend with copy panel */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{ background: 'linear-gradient(to right, transparent 55%, #0f0520 100%)' }}
          />
          {/* Bottom gradient on mobile */}
          <div
            className="absolute inset-0 md:hidden"
            style={{ background: 'linear-gradient(to top, #0f0520 0%, transparent 60%)' }}
          />

          {/* Floating badge */}
          <div
            className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex items-center gap-3 px-4 py-2.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.09)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(216,180,254,0.25)',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))' }} />
            <span className="text-[11px] font-black tracking-[0.18em] uppercase text-white/80">
              GERnétic Paris
            </span>
          </div>
        </motion.div>

        {/* Right — Copy panel (45%) */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: 'easeOut', delay: 0.15 }}
          className="w-full md:w-[45%] flex flex-col justify-center px-8 py-12 md:px-12 md:py-16 lg:px-16 space-y-7"
        >
          {/* Body */}
          <p className="text-[14px] md:text-[15px] leading-7 max-w-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>
            GERnétic bio-cosmetic formulas are built on 50 years of cellular research —
            precision skincare that nourishes at the deepest level.
          </p>

          {/* Pillars */}
          <div className="space-y-3">
            {pillars.map(({ icon: Icon, label, detail }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                className="flex items-start gap-3.5"
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(196,167,254,0.12)',
                    border: '1px solid rgba(196,167,254,0.20)',
                  }}
                >
                  <Icon size={15} style={{ color: 'rgb(196,167,254)' }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[12px] font-black tracking-wide text-white/80">{label}</p>
                  <p className="text-[11px] leading-5 mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-1">
            <Link
              href="/collections/gernetique"
              className="inline-flex items-center gap-3 px-7 py-3.5 text-[12px] font-black tracking-widest uppercase rounded-full text-white transition-all duration-300 group border-none"
              style={{
                background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))',
                boxShadow: '0 4px 24px rgba(147,104,236,0.35)',
              }}
            >
              Discover GERnétic
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
