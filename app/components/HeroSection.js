'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { headingFont } from './home/headingFont';
import { useLocale, useT } from '../context/LocaleContext';

// ─── Slide data Fallback ──────────────────────────────────────────────────────────────
const fallbackSlides = [
  {
    id: 'f1',
    eyebrow: 'GERNÉTIC INTERNATIONAL',
    headline: 'The Art of\nSkin Science',
    body: 'Biological cellular treatments crafted in France. Trusted by dermatologists worldwide for transformative results.',
    cta: { text: 'Shop the Collection', href: '/all-products' },
    imageSrc: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000',
    imageSrcDesktop: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=2000',
    isVideo: false,
    imagePosition: 'object-center',
    textPosition: 'left',
    ctaStyle: 'lavender-cloud',
    scrimDirection: 'left-light',
    textTheme: 'dark',
  },
  {
    id: 'f2',
    eyebrow: 'OXYGENATING EXPERTISE',
    headline: 'Luminous\nRadiance',
    body: 'Breathe new life into your skin with our transformative oxygenating facial. Instant vitality, enduring glow.',
    cta: { text: 'Discover the Secret', href: '/all-products' },
    imageSrc: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1000',
    imageSrcDesktop: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=2000',
    isVideo: false,
    imagePosition: 'object-center object-top',
    textPosition: 'right',
    ctaStyle: 'lavender-cloud',
    scrimDirection: 'right',
    textTheme: 'light',
  },
  {
    id: 'f3',
    eyebrow: 'DAILY RITUALS',
    headline: 'Your Skincare\nSymphony',
    body: 'Discover the perfect sequence for lasting radiance. A comprehensive routine tailored for luxury care.',
    cta: { text: 'View the Ritual', href: '/all-products' },
    imageSrc: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=1000',
    imageSrcDesktop: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=2000', 
    isVideo: false,
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
  left:   'absolute left-[6%] md:left-[8%] lg:left-[9%] top-1/2 -translate-y-1/2 max-w-xs md:max-w-[480px]',
  right:  'absolute right-[6%] md:right-[8%] lg:right-[9%] top-1/2 -translate-y-1/2 max-w-xs md:max-w-[480px] text-right',
  center: 'absolute inset-0 flex flex-col items-center justify-center text-center px-6',
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

// ─── Sub-components ───────────────────────────────────────────────────────────
function SlideBackground({ slide, reduceMotion, playing }) {
  const videos = useRef([]);
  // The pause button freezes the video too, not just the slide changes
  useEffect(() => {
    videos.current.forEach((v) => {
      if (!v) return;
      if (playing) v.play().catch(() => {});
      else v.pause();
    });
  }, [playing]);

  const isVideoDesktop = slide.is_video_desktop || (slide.imageSrcDesktop && (typeof slide.imageSrcDesktop === 'string' && (slide.imageSrcDesktop.endsWith('.mp4') || slide.imageSrcDesktop.endsWith('.mov'))));
  const isVideoMobile = slide.is_video_mobile || (slide.imageSrc && (typeof slide.imageSrc === 'string' && (slide.imageSrc.endsWith('.mp4') || slide.imageSrc.endsWith('.mov'))));

  return (
    <motion.div
      key={`bg-${slide.id}`}
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.65, ease: 'easeInOut' }}
    >
      {/* Mobile Background */}
      <div className="md:hidden w-full h-full relative">
        {isVideoMobile ? (
          <video
            ref={(el) => { videos.current[0] = el; }}
            src={slide.imageSrc}
            autoPlay={playing}
            muted
            loop
            playsInline
            className={`object-cover w-full h-full ${slide.imagePosition}`}
          >
            <track kind="captions" />
          </video>
        ) : (
          <Image
            src={slide.imageSrc}
            alt={slide.headline}
            fill
            sizes="100vw"
            className={`object-cover ${slide.imagePosition}`}
            priority={slide.id === 1 || slide.id === 'f1'}
          />
        )}
      </div>

      {/* Desktop Background */}
      <div className="hidden md:block w-full h-full relative">
        {isVideoDesktop ? (
          <video
            ref={(el) => { videos.current[1] = el; }}
            src={slide.imageSrcDesktop || slide.imageSrc}
            autoPlay={playing}
            muted
            loop
            playsInline
            className={`object-cover w-full h-full ${slide.imagePosition}`}
          >
            <track kind="captions" />
          </video>
        ) : (
          <Image
            src={slide.imageSrcDesktop || slide.imageSrc}
            alt={slide.headline}
            fill
            sizes="100vw"
            className={`object-cover ${slide.imagePosition}`}
            priority={slide.id === 1 || slide.id === 'f1'}
          />
        )}
      </div>

      {/* Directional scrim for text legibility */}
      {SCRIM_CLASS[slide.scrimDirection] && (
        <div className={`hidden md:block ${SCRIM_CLASS[slide.scrimDirection]}`} />
      )}
      {/* Mobile: dark at the top (header + headline) and the bottom (button) */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.55)_0%,rgba(10,10,12,0.1)_38%,rgba(10,10,12,0)_60%,rgba(10,10,12,0.45)_100%)] pointer-events-none md:hidden" />
      {/* Subtle bottom fade on all slides — keeps nav dots legible */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
    </motion.div>
  );
}

// Slide copy comes from Admin → Hero banner; t() translates it when the dictionary has it
function SlideText({ slide, variants, isMobile = false }) {
  const t = useT();
  const textAlignment = isMobile ? 'text-center' : slide.textPosition === 'right' ? 'text-right' : 'text-left';
  const cta = slide.cta && slide.cta.text ? slide.cta : null;
  const pillBase = 'inline-flex items-center justify-center h-10 px-6 rounded-full border-[1.5px] border-white text-[13px] font-semibold transition-colors';
  const pill = `${pillBase} text-white hover:bg-white hover:text-[#111114]`;

  return (
    <motion.div
      key={`text-${slide.id}${isMobile ? '-m' : ''}`}
      className={
        isMobile
          ? 'absolute inset-x-4 top-[calc(var(--header-h)+28px)] bottom-[60px] z-10 flex flex-col items-center justify-between md:hidden'
          : `${TEXT_POS_CLASS[slide.textPosition] || TEXT_POS_CLASS.left} z-10 hidden md:block`
      }
      variants={variants.container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div variants={variants.item} className={`grid gap-2.5 ${textAlignment}`}>
        {slide.eyebrow && (
          <p dir="auto" className="text-[11px] md:text-[12px] font-semibold tracking-[0.14em] uppercase text-white/80">
            {t(slide.eyebrow.trim())}
          </p>
        )}
        <h1 dir="auto" className={`${headingFont} font-medium text-white whitespace-pre-line text-balance leading-[1.1] tracking-[-0.01em] text-[26px] md:text-[clamp(30px,3.4vw,46px)]`}>
          {t(slide.headline)}
        </h1>
        {slide.body && (
          <p dir="auto" className={`text-[14px] md:text-[15px] leading-relaxed text-white/85 max-w-[340px] md:max-w-[440px] ${isMobile ? 'mx-auto' : slide.textPosition === 'right' ? 'ml-auto' : ''}`}>
            {t(slide.body)}
          </p>
        )}
        {/* Desktop: the button follows the copy */}
        {cta && !isMobile && (
          <div className="pt-3.5">
            <Link href={cta.href || '/'} className={pill}>{t(cta.text)}</Link>
          </div>
        )}
      </motion.div>
      {/* Phones: the button sits at the bottom of the photo */}
      {cta && isMobile && (
        <motion.div variants={variants.item}>
          <Link href={cta.href || '/'} className={`${pillBase} bg-white text-[#111114]`}>{t(cta.text)}</Link>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HeroSection({ dbSlides = [] }) {
  const { t, dir: textDir } = useLocale();
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // Pressed pause (or asked the OS for reduced motion): no slide changes and no video until play is pressed
  const [stopped, setStopped] = useState(false);
  useEffect(() => { if (reduceMotion) setStopped(true); }, [reduceMotion]);

  // Map DB slides to the format expected by the component
  const mappedDbSlides = dbSlides.map(s => ({
    id: s.id,
    eyebrow: s.eyebrow,
    headline: s.headline,
    body: s.body,
    cta: { text: s.cta_text, href: s.cta_href },
    imageSrc: s.image_src_mobile,
    imageSrcDesktop: s.image_src_desktop,
    isVideo: s.is_video_mobile || s.is_video_desktop,
    is_video_mobile: s.is_video_mobile,
    is_video_desktop: s.is_video_desktop,
    imagePosition: s.image_position,
    textPosition: s.text_position,
    ctaStyle: s.cta_style,
    scrimDirection: s.scrim_direction,
    textTheme: s.text_theme,
  }));

  const activeSlides = mappedDbSlides.length > 0 ? mappedDbSlides : fallbackSlides;

  useEffect(() => {
    if (paused || stopped) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % activeSlides.length), 7000);
    return () => clearInterval(t);
  }, [paused, stopped, activeSlides.length]);

  const slide = activeSlides[current];
  const variants = getTextVariants(reduceMotion);

  const goTo = (i) => { setPaused(true); setCurrent(i); };
  const prev  = () => { setPaused(true); setCurrent(p => (p - 1 + activeSlides.length) % activeSlides.length); };
  const next  = () => { setPaused(true); setCurrent(p => (p + 1) % activeSlides.length); };

  // ── Touch / swipe support ──────────────────────────────────────────────────
  const touchStartX = React.useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    // Right to left, the next slide is the one to the left
    const forward = textDir === 'rtl' ? delta < 0 : delta > 0;
    if (Math.abs(delta) > 40) forward ? next() : prev();
    touchStartX.current = null;
  };

  // Phones: at least as tall as the 9:16 phone photo is at this width, so the whole
  // photo shows (its empty top holds the headline) instead of being zoomed and cropped
  return (
    <section
      id="home-hero"
      className="relative w-full overflow-hidden bg-[#2a2622] h-[max(84svh,calc(100vw*16/9))] min-h-[520px] md:h-[min(92vh,860px)] md:min-h-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Full-bleed background ── */}
      <AnimatePresence>
        <SlideBackground key={`bg-${slide.id}`} slide={slide} reduceMotion={reduceMotion} playing={!stopped} />
      </AnimatePresence>

      {/* ── Scrims: top keeps the white header legible; desktop adds a left wash for the copy ── */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-black/35 to-transparent" />
        <div className="absolute inset-0 hidden md:block bg-[linear-gradient(90deg,rgba(10,10,12,0.5)_0%,rgba(10,10,12,0.15)_45%,rgba(10,10,12,0)_70%)]" />
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
        className="absolute start-7 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-[38px] h-[38px] items-center justify-center rounded-full text-white border border-white/40 hover:border-white transition-colors"
        aria-label={t('Previous slide')}
      >
        <ChevronLeft size={18} strokeWidth={1.5} className="flip-rtl" />
      </button>
      <button
        onClick={next}
        className="absolute end-7 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-[38px] h-[38px] items-center justify-center rounded-full text-white border border-white/40 hover:border-white transition-colors"
        aria-label={t('Next slide')}
      >
        <ChevronRight size={18} strokeWidth={1.5} className="flip-rtl" />
      </button>

      {/* ── Dot navigation ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={t('Go to slide {n}', { n: i + 1 })}
            aria-current={i === current ? 'true' : undefined}
            className="rounded-full transition-colors duration-300"
            style={{
              width: i === current ? 7 : 6,
              height: i === current ? 7 : 6,
              background: i === current ? 'rgb(183,156,255)' : 'rgba(255,255,255,0.55)',
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => setStopped((v) => !v)}
          aria-label={stopped ? t('Play slideshow') : t('Pause slideshow')}
          aria-pressed={stopped}
          className="ms-2 w-6 h-6 -my-2 flex items-center justify-center text-white/85 hover:text-white transition-colors"
        >
          {stopped ? <Play size={12} fill="currentColor" strokeWidth={0} /> : <Pause size={12} fill="currentColor" strokeWidth={0} />}
        </button>
      </div>
    </section>
  );
}
