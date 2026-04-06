'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronLeft, ChevronDown, Sparkles, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import productPng from '../../public/ChatGPT_Image_Apr_12__2025__01_41_20_PM-removebg-preview.png';
import rivieraProductPng from '../../public/GER LIFT1.png';
import botanicalLightPng from '../../public/Adobe Express - file (13)-Photoroom.png';

const easeLuxury = [0.16, 1, 0.3, 1];

const heroSlides = [
  {
    id: 1,
    title: 'Biological Extraction',
    headline: 'Botanical Light.',
    subheadline:
      'Cellular frequency meets pure botanical power. A new era of skin regeneration has arrived.',
    primaryLink: { text: 'Shop Collection', href: '/all-products' },
    secondaryLink: { text: 'Learn more', href: '/all-products' },
    imageSrc: botanicalLightPng,
    productName: 'Botanical Light Serum',
    productPrice: 'AED 385',
  },
  {
    id: 2,
    title: 'Cellular Nourishment',
    headline: 'Synchro Essence.',
    subheadline:
      'The legendary French formula redefined. A masterpiece of cellular nutrition for timeless, golden radiance.',
    primaryLink: { text: 'Discover the Legacy', href: '/collections/skincare' },
    secondaryLink: { text: 'Learn more', href: '/all-products' },
    imageSrc: productPng,
    productName: 'Synchro Essence',
    productPrice: 'AED 520',
  },
  {
    id: 3,
    title: 'Riviera Luminous',
    headline: 'Éclat Pur.',
    subheadline:
      "A fresh symphony of hydration inspired by Côte d'Azur luminosity. Marine botanicals and pure glacial water for deep moisture and a Mediterranean glow.",
    primaryLink: { text: 'Explore Riviera', href: '/collections/riviera' },
    secondaryLink: { text: 'Learn more', href: '/all-products' },
    imageSrc: rivieraProductPng,
    productName: 'Éclat Pur Mist',
    productPrice: 'AED 295',
  },
];

function getContainerVariants(reduceMotion) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.15 } },
    };
  }
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.12 },
    },
    exit: {
      opacity: 0,
      transition: { staggerChildren: 0.04, staggerDirection: -1, duration: 0.35 },
    },
  };
}

function getItemVariants(reduceMotion) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.15 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: easeLuxury },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.35, ease: easeLuxury },
    },
  };
}

function RevealText({ children, delay = 0, className = '', reduceMotion }) {
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.75, ease: easeLuxury, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* Floating glass product spotlight — desktop only */
function ProductSpotlight({ slide, reduceMotion }) {
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 32, scale: 0.96 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 20, scale: 0.97 },
        transition: { duration: 0.55, ease: easeLuxury },
      };

  return (
    <motion.div
      key={slide.id}
      {...motionProps}
      className="cl-glass-card pointer-events-auto hidden overflow-hidden rounded-2xl lg:flex lg:w-[200px] xl:w-[220px]"
      style={{
        borderTop: '2px solid transparent',
        backgroundImage:
          'linear-gradient(var(--cl-glass), var(--cl-glass)), linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        border: 'none',
        outline: '2px solid transparent',
        boxShadow: 'var(--cl-shadow-card)',
      }}
    >
      {/* Purple gradient top accent bar */}
      <div className="flex flex-col">
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{ background: 'var(--cl-gradient)' }}
        />
        <div className="relative h-[160px] w-full xl:h-[180px]">
          <Image
            src={slide.imageSrc}
            alt={slide.productName}
            fill
            sizes="220px"
            className="object-contain object-center p-3"
          />
        </div>
        <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
          <p
            className="text-[11px] font-bold tracking-tight uppercase"
            style={{ color: 'var(--cl-text-soft)' }}
          >
            {slide.title}
          </p>
          <p
            className="font-serif text-sm font-light leading-snug"
            style={{ color: 'var(--cl-text-deep)' }}
          >
            {slide.productName}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span
              className="text-[11px] font-semibold"
              style={{ color: 'var(--cl-text-mid)' }}
            >
              {slide.productPrice}
            </span>
            <Link
              href={slide.primaryLink.href}
              className="bg-gray-900 text-white rounded-full px-3 py-1 text-[9px] font-semibold tracking-tight hover:bg-brand-pink transition-all duration-300"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeroSlide({ slide, reduceMotion, currentSlide, totalSlides, goToSlide, nextSlide, prevSlide }) {
  const containerVariants = getContainerVariants(reduceMotion);
  const itemVariants = getItemVariants(reduceMotion);
  const crossfade = reduceMotion ? 0.2 : 0.42;
  const imageMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 14 },
      };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: crossfade, ease: easeLuxury }}
    >
      {/* ── MOBILE LAYOUT: image dominant + bottom text panel ── */}
      <div className="flex h-full flex-col md:hidden">
        {/* Product image — fills upper area */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <motion.div
            {...imageMotion}
            transition={{ duration: reduceMotion ? 0.2 : 0.65, ease: easeLuxury }}
            className="absolute inset-0"
          >
            <Image
              src={slide.imageSrc}
              alt={slide.headline}
              fill
              sizes="100vw"
              className={`object-contain object-bottom origin-bottom px-2 pt-4 pb-0 ${slide.id === 3 ? 'scale-125' : slide.id === 1 ? 'scale-90' : 'scale-110'}`}
              priority={slide.id === 1}
            />
          </motion.div>
          {/* Soft fade into the bottom panel */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fff0f8] via-[#fff0f8]/80 to-transparent z-10" />
        </div>

        {/* Bottom text panel */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative z-20 flex-shrink-0 bg-[#fff0f8] px-6 pb-6 pt-0"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-2">
            <span className="w-5 h-px bg-brand-pink/40" />
            <span className="text-[9px] font-black text-brand-pink uppercase tracking-tight flex items-center gap-1.5">
              <Sparkles size={8} />
              {slide.title}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-serif italic text-gray-900 text-[1.75rem] leading-[1.05] tracking-tight mb-1.5"
          >
            {slide.headline}
          </motion.h1>

          {/* Subheadline — 2 lines max */}
          <motion.p
            variants={itemVariants}
            className="text-[0.7rem] leading-relaxed text-gray-400 font-light line-clamp-2 mb-4"
          >
            {slide.subheadline}
          </motion.p>

          {/* CTAs — full width primary, pill secondary */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            <Link
              href={slide.primaryLink.href}
              className="flex-1 text-center bg-gray-900 text-white rounded-full py-2.5 text-[10px] font-bold tracking-tight hover:bg-brand-pink transition-all duration-500"
            >
              {slide.primaryLink.text}
            </Link>
            <Link
              href={slide.secondaryLink.href}
              className="border border-gray-200 text-gray-600 rounded-full py-2.5 px-4 text-[10px] font-semibold tracking-tight bg-white/70 backdrop-blur-sm whitespace-nowrap"
            >
              {slide.secondaryLink.text}
            </Link>
          </motion.div>

          {/* ── Mobile slide controls (inline, no overlay) ── */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between pt-3 border-t border-gray-100/60 mt-1"
          >
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentSlide ? 20 : 6,
                    height: 6,
                    background: i === currentSlide ? '#1d1d1f' : '#d1d5db',
                  }}
                />
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white/70 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
                aria-label="Previous slide"
              >
                <ChevronLeft size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center active:scale-95 transition-all hover:bg-brand-pink duration-300"
                aria-label="Next slide"
              >
                <ChevronRight size={14} strokeWidth={1.75} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── DESKTOP LAYOUT (md+): The Atelier — dominant product, editorial text ── */}
      <div className="relative z-10 hidden h-full items-stretch md:flex">

        {/* Ghosted slide number — typographic texture */}
        <motion.div
          aria-hidden
          key={`num-${currentSlide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute bottom-0 right-0 z-0 select-none leading-none"
        >
          <span className="text-[22vw] font-black tabular-nums" style={{ color: 'rgba(0,0,0,0.025)' }}>
            0{currentSlide + 1}
          </span>
        </motion.div>

        {/* Left: editorial text column — content centred, nav pinned bottom */}
        <div className="relative z-10 flex w-[40%] flex-shrink-0 flex-col ml-8 xl:ml-16">

          {/* Vertical brand signature — runs up the left spine */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center justify-center w-10"
          >
            <span
              className="text-[9px] font-black uppercase select-none whitespace-nowrap"
              style={{
                writingMode: 'vertical-lr',
                transform: 'rotate(180deg)',
                color: 'rgba(219,39,119,0.12)',
                letterSpacing: '0.35em',
              }}
            >
              Naya Lumière Cosmetics
            </span>
          </div>

          {/* ── Editorial content — vertically centred ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-1 flex-col justify-center pl-24 pr-4 xl:pl-32 xl:pr-6"
          >
            {/* Collection tag row */}
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-7">
              <span className="inline-flex items-center gap-1.5 border border-brand-pink/30 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-brand-pink">
                <Sparkles size={7} />
                {slide.title}
              </span>
              <span className="text-[9px] font-medium tracking-[0.2em] text-gray-300 tabular-nums">
                N° 0{currentSlide + 1}
              </span>
            </motion.div>

            {/* Headline */}
            <RevealText delay={0.08} className="w-full mb-5" reduceMotion={reduceMotion}>
              <h1 className="font-serif italic text-gray-900 leading-[0.93] tracking-[-0.01em] text-[3.8rem] xl:text-[5rem]">
                {slide.headline}
              </h1>
            </RevealText>

            {/* Decorated separator */}
            <motion.div variants={itemVariants} className="relative flex items-center mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <div className="mx-3 w-1 h-1 rounded-full bg-brand-pink flex-shrink-0" />
              <div className="flex-1 h-px bg-gray-100" />
            </motion.div>

            {/* Subheadline — pull-quote with left accent */}
            <motion.p
              variants={itemVariants}
              className="text-[0.82rem] font-light leading-[1.85] text-gray-400 max-w-[280px] mb-8 pl-3 border-l border-brand-pink/25"
            >
              {slide.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <Link
                  href={slide.primaryLink.href}
                  className="bg-gray-900 text-white rounded-full px-8 py-3 text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-brand-pink transition-all duration-500 shadow-sm"
                >
                  {slide.primaryLink.text}
                </Link>
                <Link
                  href={slide.secondaryLink.href}
                  className="relative flex items-center gap-1.5 text-[12px] font-medium tracking-[0.04em] text-gray-400 hover:text-gray-900 transition-colors duration-300 group"
                >
                  <span className="relative">
                    {slide.secondaryLink.text}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
                  </span>
                  <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
              {/* Social proof — mirrors rating badge on product card */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={9} className="fill-brand-pink text-brand-pink" />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-gray-400">Trusted by 4,200+ clients</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Nav — pinned to bottom of column ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: easeLuxury }}
            className="flex items-end justify-between pl-14 pr-10 xl:pl-16 xl:pr-14 py-7 border-t border-gray-100/60"
          >
            {/* Large editorial counter + progress */}
            <div className="flex items-end gap-2 leading-none">
              <span className="font-serif italic text-[2.75rem] xl:text-[3.25rem] text-gray-900 leading-none tabular-nums">
                0{currentSlide + 1}
              </span>
              <div className="flex flex-col pb-1.5 gap-1">
                <div className="w-14 h-px bg-gray-100 overflow-hidden rounded-full">
                  <motion.div
                    key={currentSlide}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 8, ease: 'linear' }}
                    className="h-full bg-gray-300 origin-left rounded-full"
                  />
                </div>
                <span className="text-[9px] tracking-[0.15em] text-gray-300 tabular-nums font-medium">
                  / 0{totalSlides}
                </span>
              </div>
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/60 text-gray-400 transition-all duration-300 hover:border-gray-900 hover:text-gray-900 active:scale-95"
                aria-label="Previous slide"
              >
                <ChevronLeft size={13} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition-all duration-300 hover:bg-brand-pink active:scale-95"
                aria-label="Next slide"
              >
                <ChevronRight size={13} strokeWidth={1.75} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right: dominant product image */}
        <div className="relative flex-1 overflow-hidden">

          {/* Radial product spotlight — the halo the product floats in */}
          <motion.div
            key={`spotlight-${currentSlide}`}
            aria-hidden
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.1, ease: easeLuxury }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: [
                'radial-gradient(ellipse 58% 62% at 52% 48%, rgba(255,235,243,0.90) 0%, rgba(255,220,235,0.55) 30%, transparent 68%)',
                'radial-gradient(ellipse 38% 40% at 52% 48%, rgba(255,255,255,0.95) 0%, transparent 55%)',
              ].join(', '),
            }}
          />

          {/* Product image */}
          <motion.div
            {...imageMotion}
            transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: easeLuxury }}
            className="absolute inset-x-0 bottom-0 top-12 z-10"
            style={{ filter: 'drop-shadow(0 32px 64px rgba(219,39,119,0.10)) drop-shadow(0 8px 24px rgba(0,0,0,0.06))' }}
          >
            <Image
              src={slide.imageSrc}
              alt={slide.headline}
              fill
              sizes="80vw"
              className={`object-contain transition-transform duration-700 hover:-translate-y-2 object-bottom origin-bottom pb-0 mb-0 ${slide.id === 3 ? 'scale-[1.75]' : slide.id === 1 ? 'scale-100' : 'scale-125'}`}
              priority={slide.id === 1}
            />
          </motion.div>

          {/* Floating product badge — bottom-right glass card */}
          <motion.div
            key={`badge-${currentSlide}`}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.55, ease: easeLuxury }}
            className="pointer-events-none absolute bottom-14 right-8 z-20 xl:right-12"
          >
            <div
              className="flex flex-col gap-2 rounded-2xl px-4 py-3.5"
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 8px 32px rgba(219,39,119,0.10), 0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <span className="text-[8px] font-black tracking-[0.22em] text-brand-pink uppercase">
                {slide.productName}
              </span>
              <span className="font-serif italic text-[1.55rem] text-gray-900 leading-none">
                {slide.productPrice}
              </span>
              {/* Star rating row */}
              <div className="flex items-center gap-1 pt-0.5 border-t border-gray-100/70">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={8} className="fill-brand-pink text-brand-pink" />
                ))}
                <span className="ml-1 text-[8px] font-medium text-gray-400">5.0</span>
              </div>
            </div>
          </motion.div>

          {/* Left feather — image zone bleeds into text column */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-[#fff8fc] to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length),
      8000
    );
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
  };

  const slide = heroSlides[currentSlide];

  return (
    <section
      className="relative flex min-h-[min(88vh,760px)] w-full overflow-hidden font-sans md:min-h-[min(85vh,820px)]"
      style={{
        background: [
          'radial-gradient(ellipse 140% 110% at 50% 50%, rgba(255,248,252,0.96) 0%, rgba(255,242,249,0.80) 40%, #fff0f8 70%)',
          'radial-gradient(ellipse 60% 55% at 72% 30%, rgba(255,200,220,0.22) 0%, transparent 60%)',
          'radial-gradient(ellipse 45% 40% at 28% 70%, rgba(255,215,230,0.16) 0%, transparent 58%)',
          '#fff0f8',
        ].join(', '),
      }}
    >

      {/* Slide layer */}
      <AnimatePresence>
        <HeroSlide
          key={currentSlide}
          slide={slide}
          reduceMotion={reduceMotion}
          currentSlide={currentSlide}
          totalSlides={heroSlides.length}
          goToSlide={goToSlide}
          nextSlide={nextSlide}
          prevSlide={prevSlide}
        />
      </AnimatePresence>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-24 md:h-32"
        style={{
          background: 'linear-gradient(to top, rgba(255,240,248,0.85), transparent)',
        }}
      />

      {/* ── Left-side nav controls (hidden — nav is now integrated in text column) ── */}
      <div className="hidden">
        <div
          className="cl-glass-card pointer-events-auto flex w-fit flex-col gap-4 rounded-2xl px-4 py-4 md:px-5 md:py-5"
        >
          {/* Slide progress bar + counter */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative h-16 w-px overflow-hidden rounded-full"
              style={{ background: 'var(--cl-glass-border)' }}
            >
              <motion.div
                className="absolute left-0 top-0 w-full rounded-full"
                style={{ background: 'var(--cl-gradient)' }}
                initial={{ height: 0 }}
                animate={{
                  height: `${((currentSlide + 1) / heroSlides.length) * 100}%`,
                }}
                transition={{ duration: reduceMotion ? 0 : 0.45, ease: easeLuxury }}
              />
            </div>
            <div className="flex flex-col items-center tracking-tight">
              <span
                className="text-xl font-semibold tabular-nums md:text-2xl"
                style={{ color: 'var(--cl-text-deep)' }}
              >
                0{currentSlide + 1}
              </span>
              <span
                className="text-[10px] font-medium tracking-[0.2em]"
                style={{ color: 'var(--cl-text-muted)' }}
              >
                / 0{heroSlides.length}
              </span>
            </div>
          </div>

          {/* Prev / Next arrows */}
          <div
            className="flex items-center justify-center gap-2 pt-4"
            style={{ borderTop: '1px solid var(--cl-glass-border)' }}
          >
            <button
              type="button"
              onClick={prevSlide}
              className="cl-ghost-btn flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all active:scale-[0.97] md:h-11 md:w-11"
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="cl-ghost-btn flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all active:scale-[0.97] md:h-11 md:w-11"
              aria-label="Next slide"
            >
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating product spotlight (hidden — replaced by floating price tag in image zone) ── */}
      <div className="hidden">
        <AnimatePresence mode="wait">
          <ProductSpotlight key={currentSlide} slide={slide} reduceMotion={reduceMotion} />
        </AnimatePresence>
      </div>

      {/* ── Carousel dots (hidden — dots are inline on mobile; counter in text column on desktop) ── */}
      <div className="hidden">
        {heroSlides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="relative overflow-hidden rounded-full transition-all duration-300"
            style={{
              width: i === currentSlide ? 28 : 8,
              height: 8,
              background:
                i === currentSlide
                  ? 'var(--cl-gradient)'
                  : 'var(--cl-glass-border)',
            }}
          />
        ))}
      </div>

      {/* ── Timeline progress bar (mobile only — desktop has it in text column) ── */}
      <div
        className="absolute bottom-0 left-0 z-50 h-px w-full md:hidden"
        style={{ background: 'var(--cl-glass-border)' }}
      >
        <motion.div
          key={currentSlide}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduceMotion ? 0 : 8, ease: 'linear' }}
          className="h-full origin-left"
          style={{ background: 'var(--cl-gradient)' }}
        />
      </div>

      {/* ── Scroll-down chevron (hidden) ── */}
      <motion.div
        className="hidden"
        animate={reduceMotion ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <ChevronDown
          size={22}
          strokeWidth={1.5}
          style={{ color: 'var(--cl-purple)' }}
        />
      </motion.div>
    </section>
  );
}
