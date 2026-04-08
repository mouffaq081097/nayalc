'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    headline: 'THE ART OF\nSKIN SCIENCE',
    body: 'Biological cellular treatments crafted in France. Trusted by dermatologists worldwide.',
    cta: { text: 'SHOP NOW', href: '/all-products' },
    imageSrc: '/ROUTINE 4.mp4', // mobile
    imageSrcDesktop: '/Body protocol.mp4', // desktop
    isVideo: true,
    imagePosition: 'object-center',
    textPosition: 'left',   // products are center-right
    ctaStyle: 'solid-dark', // dark CTA on light background
    scrimDirection: 'none',
    textTheme: 'dark',
  },
  {
    id: 2,
    eyebrow: 'OXYGENATING EXPERTISE',
    headline: 'DOUBLE-UP\nFACIAL TREATMENT',
    body: 'Breathe new life into your skin. A transformative oxygenating facial for instant radiance.',
    cta: { text: 'DISCOVER MORE', href: '/all-products' },
    imageSrc: '/18012026.mov',
    imageSrcDesktop: '/Double-Up Oxygenating Facial.mp4',
    isVideo: true,
    imagePosition: 'object-center object-top',
    textPosition: 'right',  // products are on left
    ctaStyle: 'outlined',   // white outlined on blue background
    scrimDirection: 'right',
    textTheme: 'light',
  },
  {
    id: 3,
    eyebrow: 'DAILY RITUALS',
    headline: 'YOUR SKINCARE\nSYMPHONY',
    body: 'Discover the perfect sequence for lasting radiance. A comprehensive routine tailored for luxury care.',
    cta: { text: 'SHOP ROUTINES', href: '/all-products' },
    imageSrc: '/ROUTINE 3.mov',
    imageSrcDesktop: '/Untitled design.png', 
    isVideo: true,
    imagePosition: 'object-center object-bottom',
    textPosition: 'left',
    ctaStyle: 'outlined-dark',
    scrimDirection: 'left',
    textTheme: 'dark',
  },
];

// ─── Design maps ─────────────────────────────────────────────────────────────
const SCRIM_CLASS = {
  left:   'absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none',
  right:  'absolute inset-0 bg-gradient-to-l from-black/40 via-black/15 to-transparent pointer-events-none',
  bottom: 'absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none',
  none:   null,
};

const TEXT_POS_CLASS = {
  left:   'absolute left-[6%] md:left-[8%] lg:left-[10%] top-1/2 -translate-y-1/2 max-w-xs md:max-w-md',
  right:  'absolute right-[6%] md:right-[8%] lg:right-[10%] top-1/2 -translate-y-1/2 max-w-xs md:max-w-md text-right',
  center: 'absolute inset-0 flex flex-col items-center justify-center text-center px-6',
};

const CTA_CLASS = {
  'outlined':      'border border-white text-white hover:bg-white hover:text-black',
  'solid-dark':    'bg-gray-900 text-white hover:bg-gray-700',
  'outlined-dark': 'border border-gray-800 text-gray-800 hover:bg-gray-900 hover:text-white',
  'solid-white':   'bg-white text-black hover:bg-black hover:text-white',
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
      visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
      exit:    { opacity: 0, transition: { duration: 0.2 } },
    },
    item: {
      hidden:  { opacity: 0, y: 14 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
      exit:    { opacity: 0, y: -8, transition: { duration: 0.25 } },
    },
  };
}

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

  const eyebrowCls  = isMobile ? 'text-white/75'  : isLight ? 'text-white/80'  : 'text-gray-500';
  const headlineCls = isMobile ? 'text-white'      : isLight ? 'text-white'     : 'text-gray-900';
  const bodyCls     = isMobile ? 'text-white/80'   : isLight ? 'text-white/85'  : 'text-gray-600';
  const ctaCls      = isMobile ? CTA_CLASS['outlined'] : CTA_CLASS[slide.ctaStyle];

  const headlineSize = isMobile
    ? 'text-[1.85rem] leading-[1.05]'
    : 'text-4xl lg:text-5xl xl:text-6xl leading-[1.05]';

  return (
    <motion.div
      key={`text-${slide.id}${isMobile ? '-m' : ''}`}
      className={
        isMobile
          ? 'absolute bottom-0 left-0 right-0 p-6 pb-16 z-10 md:hidden'
          : `${TEXT_POS_CLASS[slide.textPosition]} z-10 hidden md:block`
      }
      variants={variants.container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Eyebrow */}
      <motion.p
        variants={variants.item}
        className={`text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-medium mb-2 md:mb-3 ${eyebrowCls}`}
      >
        {slide.eyebrow}
      </motion.p>

      {/* Headline */}
      <motion.h1
        variants={variants.item}
        className={`font-bold uppercase tracking-tight whitespace-pre-line mb-3 md:mb-4 ${headlineSize} ${headlineCls}`}
      >
        {slide.headline}
      </motion.h1>

      {/* Body */}
      {slide.body && (
        <motion.p
          variants={variants.item}
          className={`text-xs md:text-sm font-light leading-relaxed mb-5 md:mb-6 max-w-[280px] md:max-w-xs ${bodyCls}`}
        >
          {slide.body}
        </motion.p>
      )}

      {/* CTA */}
      <motion.div variants={variants.item}>
        <Link
          href={slide.cta.href}
          className={`inline-block px-7 md:px-8 py-2.5 md:py-3 text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-semibold transition-all duration-300 ${ctaCls}`}
        >
          {slide.cta.text}
        </Link>
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
      className="relative w-full overflow-hidden bg-[var(--cl-bg)]"
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

      {/* ── Lavender atmosphere veil (non-destructive tint over photography) ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'linear-gradient(160deg, rgba(168,85,247,0.10) 0%, rgba(216,180,254,0.06) 50%, rgba(219,39,119,0.05) 100%)' }}
      />

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
        className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center text-white/60 hover:text-white border border-white/25 hover:border-purple-300/60 bg-black/10 hover:bg-purple-900/25 transition-all duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center text-white/60 hover:text-white border border-white/25 hover:border-purple-300/60 bg-black/10 hover:bg-purple-900/25 transition-all duration-300"
        aria-label="Next slide"
      >
        <ChevronRight size={18} strokeWidth={1.5} />
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
