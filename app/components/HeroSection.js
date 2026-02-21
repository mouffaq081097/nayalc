'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight, Sparkles, Droplets, Leaf, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import productPng from '../../public/ChatGPT_Image_Apr_12__2025__01_41_20_PM-removebg-preview.png';
import rivieraProductPng from '../../public/Adobe Express - file (10).png';
import midnightProductPng from '../../public/WhatsApp_Image_2025-07-14_at_19.58.12_7d2e719f-removebg-preview.png';
import pureProductPng from '../../public/Adobe Express - file (8).png';
import vibrantProductPng from '../../public/Adobe Express - file (9).png';
import botanicalLightPng from '../../public/Adobe Express - file (13)-Photoroom.png';

const heroSlides = [
  {
    id: 1,
    title: "L'Excellence Organique",
    headline: "Botanical Light.",
    subheadline: "Synchronizing with your cellular frequency through pure biological extraction.",
    primaryLink: { text: "Shop Now", href: "/all-products" },
    imageSrc: botanicalLightPng,
    bgClass: "bg-[#FAF9F6]",
    dark: false,
    aura: true
  },
  {
    id: 2,
    title: "The Legend",
    headline: "Synchro Essence.",
    subheadline: "The gold standard of cellular nutrition. Legendary French formula.",
    primaryLink: { text: "Discover Now", href: "/collections/skincare" },
    imageSrc: productPng,
    bgClass: "bg-[#FDFCFB]",
    dark: false,
    aura: true
  },
  {
    id: 3,
    title: "Riviera Morning",
    headline: "Éclat Pur.",
    subheadline: "Wake up to the luminosity of the Côte d'Azur. A fresh symphony of hydration.",
    primaryLink: { text: "Shop Riviera", href: "/collections/riviera" },
    imageSrc: rivieraProductPng,
    bgClass: "bg-[#ECFEFF]",
    dark: false,
    aura: true
  }
];

// --- ANIMATED TYPOGRAPHY COMPONENT ---
const RevealText = ({ children, className, delay = 0 }) => {
    return (
        <div className={`overflow-hidden ${className}`}>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
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

  const slide = heroSlides[currentSlide];

  return (
    <section 
        ref={sectionRef}
        className={`relative w-full h-[500px] md:h-[600px] overflow-hidden transition-colors duration-1000 ${slide.bgClass} border-b border-black/5`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
            {/* Dynamic Background Aura */}
            {slide.aura && (
                <div className="absolute inset-0 opacity-30">
                    <motion.div 
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-pink/10 via-transparent to-brand-blue/5 blur-[120px]"
                    />
                </div>
            )}
        </motion.div>
      </AnimatePresence>

      {/* Global Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      {/* Product Image - Aligned Left and Flush to Bottom */}
      <div className={`absolute -left-12 md:left-0 bottom-0 w-full md:w-1/2 h-full ${slide.id === 2 ? 'z-30' : 'z-10'} pointer-events-none flex items-end justify-start`}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: -150, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-[65%] md:h-[95%] max-w-[700px] md:max-w-[950px]"
          >
            <Image 
                src={slide.imageSrc} 
                alt={slide.headline} 
                fill
                className="object-contain object-left-bottom drop-shadow-[0_30px_60px_rgba(0,0,0,0.12)]"
                priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content - Middle Center (Desktop) / Top Center (Mobile) */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-start md:justify-center pointer-events-none px-6 pt-12 md:pt-0">
        <div className="pointer-events-auto flex flex-col items-center text-center max-w-[90%] md:max-w-[1200px]">
            <AnimatePresence mode="wait">
            <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-4"
            >
                <RevealText className="mb-1" delay={0.1}>
                    <span className="text-[10px] md:text-[12px] font-sans font-black uppercase tracking-[0.5em] text-brand-pink">
                        {slide.title}
                    </span>
                </RevealText>
                
                <RevealText delay={0.2}>
                    <h2 className={`text-[42px] md:text-[72px] lg:text-[84px] font-serif italic leading-[1.1] tracking-tight ${slide.dark ? 'text-white' : 'text-black'}`}>
                        {slide.headline}
                    </h2>
                </RevealText>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className={`text-base md:text-xl font-sans font-medium max-w-xl leading-relaxed ${slide.dark ? 'text-gray-300' : 'text-gray-500'}`}
                >
                    {slide.subheadline}
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 md:mt-10 flex items-center gap-6"
                >
                    <Link href={slide.primaryLink.href} className="group relative flex items-center gap-4 px-8 md:px-12 py-3 md:py-5 bg-black text-white rounded-full overflow-hidden transition-all duration-500 hover:pr-14 md:hover:pr-16">
                        <span className="relative z-10 font-sans font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em]">{slide.primaryLink.text}</span>
                        <ArrowRight size={18} className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        <div className="absolute inset-0 bg-brand-pink translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </Link>
                </motion.div>
            </motion.div>
            </AnimatePresence>
        </div>
      </div>

      {/* Navigation Controls - Bottom Right */}
      <div className="absolute bottom-12 right-12 z-30 flex items-center gap-6 md:gap-8">
        <button onClick={prevSlide} className="p-2 md:p-3 rounded-full bg-white/50 backdrop-blur-md border border-black/5 hover:bg-white transition-all">
            <ChevronLeft size={20} />
        </button>
        <div className="flex gap-2 md:gap-3">
            {heroSlides.map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => { setIsAutoPlaying(false); setCurrentSlide(i); }}
                    className={`h-1 md:h-1.5 transition-all duration-500 rounded-full ${currentSlide === i ? 'w-8 md:w-12 bg-black' : 'w-2 md:w-3 bg-black/10'}`}
                />
            ))}
        </div>
        <button onClick={nextSlide} className="p-2 md:p-3 rounded-full bg-white/50 backdrop-blur-md border border-black/5 hover:bg-white transition-all">
            <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
