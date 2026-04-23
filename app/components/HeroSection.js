'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// ─── Slide data ──────────────────────────────────────────────────────────────
// Each slide: full-bleed photography IS the hero.
// textTheme 'light' = white text (for dark/colored photo backgrounds)
// textTheme 'dark'  = charcoal text (for light/neutral photo backgrounds)
const heroSlides = [
  {
    id: 1,
    eyebrow: 'GERNÉTIC INTERNATIONAL',
    headline: 'The Art of\nSkin Science',
    body: 'Biological cellular treatments crafted in France. Trusted by dermatologists worldwide for transformative results.',
    cta: { text: 'Shop the Collection', href: '/all-products' },
    imageSrc: '/ROUTINE 4.mp4',
    imageSrcDesktop: '/Body protocol.mp4',
    isVideo: true,
    imagePosition: 'object-center',
    textPosition: 'left',
    ctaStyle: 'lavender-cloud',
    scrimDirection: 'left-light',
    textTheme: 'dark',
  },
  {
    id: 2,
    eyebrow: 'OXYGENATING EXPERTISE',
    headline: 'Luminous\nRadiance',
    body: 'Breathe new life into your skin with our transformative oxygenating facial. Instant vitality, enduring glow.',
    cta: { text: 'Discover the Secret', href: '/all-products' },
    imageSrc: '/18012026.mov',
    imageSrcDesktop: '/Double-Up Oxygenating Facial.mp4',
    isVideo: true,
    imagePosition: 'object-center object-top',
    textPosition: 'right',
    ctaStyle: 'lavender-cloud',
    scrimDirection: 'right',
    textTheme: 'light',
  },
  {
    id: 3,
    eyebrow: 'DAILY RITUALS',
    headline: 'Your Skincare\nSymphony',
    body: 'Discover the perfect sequence for lasting radiance. A comprehensive routine tailored for luxury care.',
    cta: { text: 'View the Ritual', href: '/all-products' },
    imageSrc: '/ROUTINE 3.mov',
    imageSrcDesktop: '/Untitled design.png', 
    isVideo: true,
    imagePosition: 'object-center object-bottom',
    textPosition: 'left',
    ctaStyle: 'lavender-cloud',
    scrimDirection: 'left',
    textTheme: 'dark',
  },
];

// ─── Design maps ─────────────────────────────────────────────────────────────
const SCRIM_CLASS = {
  left:        'absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 via-transparent to-transparent pointer-events-none',
  right:       'absolute inset-0 bg-gradient-to-l from-black/85 via-black/40 via-transparent to-transparent pointer-events-none',
  bottom:      'absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 via-transparent to-transparent pointer-events-none',
  'left-light':'absolute inset-0 bg-gradient-to-r from-white/60 via-white/20 via-transparent to-transparent pointer-events-none',
  none:        null,
};

const TEXT_POS_CLASS = {
  left:   'absolute left-[6%] md:left-[8%] lg:left-[10%] top-1/2 -translate-y-1/2 max-w-xs md:max-w-2xl',
  right:  'absolute right-[6%] md:right-[8%] lg:right-[10%] top-1/2 -translate-y-1/2 max-w-xs md:max-w-2xl text-right',
  center: 'absolute inset-0 flex flex-col items-center justify-center text-center px-6',
};

const CTA_CLASS = {
  'outlined':      'border border-white text-white hover:bg-white hover:text-black',
  'solid-dark':    'bg-[#3b0764] text-white hover:bg-[#6b21a8]',
  'outlined-dark': 'border border-gray-800 text-gray-800 hover:bg-gray-900 hover:text-white',
  'solid-white':   'bg-white text-black hover:bg-gray-100',
  'lavender-cloud': 'bg-transparent border-2 border-[#c4b5fd] text-white hover:bg-white/10 hover:border-[#a78bfa] shadow-[0_0_15px_rgba(196,167,254,0.3)] transform hover:-translate-y-0.5 transition-all duration-300 rounded-full flex items-center justify-center gap-2 group',
};

// ─── Animation variants ───────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1];

function getTextVariants(reduceMotion) {
  if (reduceMotion) {
    return {
      container: { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } },
      item:      { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } },
    };
  }
  return {
    container: {
      hidden:  {},
      visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
      exit:    { opacity: 0, transition: { duration: 0.3 } },
    },
    item: {
      hidden:  { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
      exit:    { opacity: 0, y: -10, transition: { duration: 0.3 } },
    },
  };
}

// ... SlideBackground remains the same ...

// ─── Sub-components ───────────────────────────────────────────────────────────
function SlideBackground({ slide, reduceMotion }) {
  return (
    <motion.div
      key={`bg-${slide.id}`}
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.65, ease: 'easeInOut' }}
    >
      {slide.isVideo ? (
        <>
          {slide.imageSrcDesktop ? (
            <>
              {/* Mobile Video */}
              <video
                src={slide.imageSrc}
                autoPlay
                muted
                loop
                playsInline
                className={`md:hidden object-cover w-full h-full ${slide.imagePosition}`}
              />
              {/* Desktop Video/Image */}
              {slide.imageSrcDesktop.endsWith('.mp4') || slide.imageSrcDesktop.endsWith('.mov') ? (
                <video
                  src={slide.imageSrcDesktop}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={`hidden md:block object-cover w-full h-full ${slide.imagePosition}`}
                />
              ) : (
                <Image
                  src={slide.imageSrcDesktop}
                  alt={slide.headline}
                  fill
                  sizes="100vw"
                  className={`hidden md:block object-cover ${slide.imagePosition}`}
                  priority={slide.id === 1}
                />
              )}
            </>
          ) : (
            <video
              src={slide.imageSrc}
              autoPlay
              muted
              loop
              playsInline
              className={`object-cover w-full h-full ${slide.imagePosition}`}
            />
          )}
        </>
      ) : (
        <Image
          src={slide.imageSrc}
          alt={slide.headline}
          fill
          sizes="100vw"
          className={`object-cover ${slide.imagePosition}`}
          priority={slide.id === 1}
        />
      )}
      {/* Directional scrim for text legibility */}
      {SCRIM_CLASS[slide.scrimDirection] && (
        <div className={`hidden md:block ${SCRIM_CLASS[slide.scrimDirection]}`} />
      )}
      {/* Mobile: always a bottom-up scrim (text is overlaid at bottom on mobile) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent pointer-events-none md:hidden" />
      {/* Subtle bottom fade on all slides — keeps nav dots legible */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
    </motion.div>
  );
}

function SlideText({ slide, variants, isMobile = false }) {
  const isLight = slide.textTheme === 'light';
  
  const eyebrowCls  = isMobile ? 'text-white/80' : 'text-white/90';
  const headlineCls = 'text-white';
  const bodyCls     = isMobile ? 'text-white/80' : 'text-white/90';
  const ctaCls      = slide.ctaStyle === 'lavender-cloud' ? CTA_CLASS['lavender-cloud'] : CTA_CLASS[slide.ctaStyle];

  const headlineSize = isMobile
    ? 'text-[2.2rem] md:text-[2.5rem] leading-[1.1]'
    : 'text-4xl lg:text-5xl xl:text-6xl leading-[1.1]';

  const textAlignment = slide.textPosition === 'right' ? 'text-right' : 'text-left';

  return (
    <motion.div
      key={`text-${slide.id}${isMobile ? '-m' : ''}`}
      className={
        isMobile
          ? 'absolute bottom-0 left-0 right-0 p-10 pb-24 z-10 md:hidden'
          : `${TEXT_POS_CLASS[slide.textPosition]} z-10 hidden md:block`
      }
      variants={variants.container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div variants={variants.item} className={`space-y-2 md:space-y-3 ${textAlignment}`}>
        {/* Eyebrow */}
        <p className={`text-[11px] md:text-[13px] tracking-[0.25em] uppercase font-bold ${eyebrowCls}`}>
          {slide.eyebrow}
        </p>

        {/* Headline */}
        <h1 className={`font-sans font-black uppercase tracking-wide whitespace-pre-line ${headlineSize} ${headlineCls}`}>
          {slide.headline}
        </h1>

        {/* Body */}
        {slide.body && (
          <p className={`text-sm md:text-base font-medium leading-relaxed max-w-[300px] md:max-w-lg ${bodyCls} ${slide.textPosition === 'right' ? 'ml-auto' : ''}`}>
            {slide.body}
          </p>
        )}

        {/* CTA */}
        <div className="pt-1">
          <Link
            href={slide.cta.href}
            className={`inline-flex items-center justify-center px-10 py-4 text-[12px] tracking-[0.2em] uppercase font-black transition-all duration-300 ${ctaCls}`}
          >
            <span>{slide.cta.text}</span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % heroSlides.length), 7000);
    return () => clearInterval(t);
  }, [paused]);

  const slide = heroSlides[current];
  const variants = getTextVariants(reduceMotion);

  const goTo = (i) => { setPaused(true); setCurrent(i); };
  const prev  = () => { setPaused(true); setCurrent(p => (p - 1 + heroSlides.length) % heroSlides.length); };
  const next  = () => { setPaused(true); setCurrent(p => (p + 1) % heroSlides.length); };

  // ── Touch / swipe support ──────────────────────────────────────────────────
  const touchStartX = React.useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-transparent"
      style={{ height: 'min(90vh, 760px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Full-bleed background ── */}
      <AnimatePresence>
        <SlideBackground key={`bg-${slide.id}`} slide={slide} reduceMotion={reduceMotion} />
      </AnimatePresence>

      {/* ── Cinematic Glow Overlay ── */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        {/* Base Black Overlay for Video Contrast - Bottom-up fade for Desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[0] hidden md:block" />
        
        {/* Lighter Base Overlay for Mobile */}
        <div className="absolute inset-0 bg-black/25 z-[0] md:hidden" />

        {/* Primary Glow Orb - Intensified */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.45, 0.3],
            x: [0, 70, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[5%] w-[70%] h-[70%] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(196,167,254,0.5) 0%, transparent 75%)' }}
        />
        
        {/* Secondary Glow Orb - Intensified */}
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.25, 0.4, 0.25],
            x: [0, -60, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[15%] -right-[5%] w-[60%] h-[60%] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(216,180,254,0.4) 0%, transparent 75%)' }}
        />

        {/* Global Atmosphere Tint - More Lavender focused */}
        <div 
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(168,85,247,0.12) 0%, rgba(216,180,254,0.08) 50%, rgba(196,167,254,0.1) 100%)' }}
        />
      </div>

      {/* ── Desktop text overlay ── */}
      <AnimatePresence mode="wait">
        <SlideText key={`dt-${slide.id}`} slide={slide} variants={variants} />
      </AnimatePresence>

      {/* ── Mobile text overlay ── */}
      <AnimatePresence mode="wait">
        <SlideText key={`mt-${slide.id}`} slide={slide} variants={variants} isMobile />
      </AnimatePresence>

      {/* ── Desktop prev/next arrows ── */}
      <button
        onClick={prev}
        className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-14 h-14 items-center justify-center rounded-full text-white/40 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-500 group"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} strokeWidth={1} className="group-hover:-translate-x-1 transition-transform" />
      </button>
      <button
        onClick={next}
        className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-14 h-14 items-center justify-center rounded-full text-white/40 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-500 group"
        aria-label="Next slide"
      >
        <ChevronRight size={24} strokeWidth={1} className="group-hover:translate-x-1 transition-transform" />
      </button>

      {/* ── Dot navigation ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width:      i === current ? 24 : 7,
              height:     7,
              background: i === current ? 'rgb(216,180,254)' : 'rgba(255,255,255,0.40)',
            }}
          />
        ))}
      </div>

      {/* ── Slide progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10 z-20">
        <motion.div
          key={current}
          className="h-full origin-left"
          style={{ background: 'rgba(216,180,254,0.75)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduceMotion ? 0 : 7, ease: 'linear' }}
        />
      </div>
    </section>
  );
}
