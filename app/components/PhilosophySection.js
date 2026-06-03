'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Cloud Luxe deep purple palette
const DEEP   = 'rgba(59,7,100,0.97)';
const DEEP2  = 'rgba(59,7,100,0.95)';
const MID    = 'rgba(107,33,168,0.82)';
const SOFT   = 'rgba(147,51,234,0.38)';

const stats = [
  { value: '100%', label: 'Natural Origin Actives' },
  { value: '30+',  label: 'Years of Research' },
  { value: '0',    label: 'Harmful Fillers' },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export function PhilosophySection() {
  return (
    <section className="w-full py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── MOBILE ── stacked card */}
        <motion.div
          className="md:hidden rounded-2xl overflow-hidden"
          style={{ background: '#3b0764' }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Botanical image */}
          <div className="relative w-full" style={{ height: 200 }}>
            <Image
              src="/engin-akyurt-g-m8EDc4X6Q-unsplash.jpg"
              alt="Clean botanical ingredients"
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{ height: 72, background: 'linear-gradient(to bottom, transparent, #3b0764)' }}
            />
          </div>

          {/* Content */}
          <motion.div
            className="px-5 pt-1 pb-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp}
              className="text-[10px] font-bold uppercase mb-2"
              style={{ color: 'rgba(216,180,254,0.6)', letterSpacing: '0.22em' }}
            >
              Our Philosophy
            </motion.p>

            <motion.h2 variants={fadeUp}
              className="font-black leading-[1.06] mb-3"
              style={{ fontSize: 22, color: '#fff', letterSpacing: '-0.02em' }}
            >
              Science meets nature.
            </motion.h2>

            <motion.p variants={fadeUp}
              className="text-[12px] leading-relaxed mb-4"
              style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}
            >
              Every formula is built on clinically validated actives and pure botanical extracts —
              no fillers, no synthetic fragrance, no compromise.
            </motion.p>

            {/* Stats row */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2 mb-4">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl py-3 px-2 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(216,180,254,0.2)',
                  }}
                >
                  <p className="text-[18px] font-black leading-none mb-1" style={{ color: '#d8b4fe' }}>{value}</p>
                  <p className="text-[9px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp}>
              <Link
                href="/all-products"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer
                  transition-all duration-200 hover:gap-2.5"
                style={{ color: '#d8b4fe' }}
              >
                Explore our brands
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── DESKTOP ── full-bleed, diagonal gradient right→left */}
        {/*
          Gradient sweeps at 258° (mirror of Tabby's 106°).
          Image subject (botanicals) anchors to the left; the deep-purple overlay
          starts from the right and tapers diagonally — making the text area
          "curve" around whatever's in the left of the photo.
        */}
        <motion.div
          className="hidden md:block relative rounded-2xl overflow-hidden"
          style={{ minHeight: 340 }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Full-bleed botanical photo */}
          <Image
            src="/engin-akyurt-g-m8EDc4X6Q-unsplash.jpg"
            alt="Clean botanical ingredients"
            fill
            className="object-cover object-left"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />

          {/* Diagonal deep-purple overlay — wider at top, tapering at bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(
                258deg,
                ${DEEP}  0%,
                ${DEEP2} 36%,
                ${MID}   49%,
                ${SOFT}  60%,
                transparent 70%
              )`,
            }}
          />

          {/* Text — positioned in the deep-purple zone on the right */}
          <motion.div
            className="absolute inset-y-0 right-0 z-10 flex flex-col justify-center"
            style={{ width: '50%', padding: '36px 48px 36px 24px' }}
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp}
              className="text-[10px] font-bold uppercase mb-3"
              style={{ color: 'rgba(216,180,254,0.6)', letterSpacing: '0.22em' }}
            >
              Our Philosophy
            </motion.p>

            <motion.h2 variants={fadeUp}
              className="font-black leading-[1.05] mb-3"
              style={{
                fontSize: 'clamp(22px, 2.5vw, 40px)',
                color: '#fff',
                letterSpacing: '-0.025em',
              }}
            >
              Science meets nature.
            </motion.h2>

            <motion.p variants={fadeUp}
              className="text-[13px] leading-relaxed mb-5"
              style={{ color: 'rgba(255,255,255,0.58)', maxWidth: 320, lineHeight: 1.7 }}
            >
              Every formula is built on clinically validated actives and pure botanical
              extracts — no fillers, no synthetic fragrance, no compromise. We source
              globally, formulate with care, and test rigorously.
            </motion.p>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5 mb-5">
              {stats.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  className="rounded-xl py-3.5 px-2 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(216,180,254,0.22)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.09, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[20px] font-black leading-none mb-1" style={{ color: '#d8b4fe' }}>{value}</p>
                  <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.44)' }}>{label}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp}>
              <Link
                href="/all-products"
                className="inline-flex items-center gap-2 text-[12px] font-semibold cursor-pointer
                  transition-all duration-200 hover:gap-3"
                style={{ color: '#d8b4fe' }}
              >
                Explore our brands
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
