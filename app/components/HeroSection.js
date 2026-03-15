'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import productPng from '../../public/ChatGPT_Image_Apr_12__2025__01_41_20_PM-removebg-preview.png';
import rivieraProductPng from '../../public/Adobe Express - file (10).png';
import botanicalLightPng from '../../public/Adobe Express - file (13)-Photoroom.png';

const heroSlides = [
  {
    id: 1,
    title: "Biological Extraction",
    headline: "Botanical Light.",
    subheadline: "Cellular frequency meets pure botanical power. A new era of skin regeneration has arrived.",
    primaryLink: { text: "Shop Collection", href: "/all-products" },
    imageSrc: botanicalLightPng,
    theme: {
        bg: "bg-[#FAF9F6]",
        accent: "text-brand-pink",
        accentBg: "bg-brand-pink",
        glow: "bg-brand-pink",
        btn: "bg-black text-white hover:bg-gray-900",
        text: "text-[#1d1d1f]",
        subtext: "text-gray-500",
    }
  },
  {
    id: 2,
    title: "Cellular Nourishment",
    headline: "Synchro Essence.",
    subheadline: "The legendary French formula redefined. A masterpiece of cellular nutrition for timeless, golden radiance.",
    primaryLink: { text: "Discover the Legacy", href: "/collections/skincare" },
    imageSrc: productPng,
    theme: {
        bg: "bg-[#FAF7F2]",
        accent: "text-[#C5A059]",
        accentBg: "bg-[#C5A059]",
        glow: "bg-[#C5A059]",
        btn: "bg-[#1d1d1f] text-white hover:bg-[#C5A059]",
        text: "text-[#1d1d1f]",
        subtext: "text-gray-500",
    }
  },
  {
    id: 3,
    title: "Riviera Luminous",
    headline: "Éclat Pur.",
    subheadline: "A fresh symphony of hydration inspired by Côte d'Azur luminosity. Infused with marine botanicals and pure glacial water for 24H deep cellular moisture and an unmistakable Mediterranean glow.",
    primaryLink: { text: "Explore Riviera", href: "/collections/riviera" },
    imageSrc: rivieraProductPng,
    layout: "reverse",
    theme: {
        bg: "bg-[#F5F9FA]",
        accent: "text-blue-500",
        accentBg: "bg-blue-500",
        glow: "bg-blue-400",
        btn: "bg-blue-600 text-white hover:bg-blue-700",
        text: "text-[#1d1d1f]",
        subtext: "text-gray-500",
    }
  }
];

const RevealText = ({ children, delay = 0, className = "" }) => (
    <div className={`overflow-hidden ${className}`}>
        <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay }}
        >
            {children}
        </motion.div>
    </div>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
            duration: 0.5
        },
    },
};

const itemVariants = (isReverse) => ({
    hidden: { opacity: 0, x: isReverse ? -30 : 30, filter: "blur(8px)" },
    visible: { 
        opacity: 1, 
        x: 0, 
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    },
    exit: { 
        opacity: 0, 
        x: isReverse ? 30 : -30, 
        filter: "blur(8px)",
        transition: { duration: 0.5 }
    },
});

const HeroSlide = ({ slide }) => {
    const isReverse = slide.layout === "reverse";
    const isLargePinedBottom = slide.id === 1 || slide.id === 3;

    return (
        <motion.div 
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
        >
            {/* Background Transitions */}
            <div className={`absolute inset-0 z-0 ${slide.theme.bg}`}>
                {/* Subtle Texture/Grain */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply" />
                
                {/* Decorative Large Background Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
                    <span className="text-[15vw] font-black uppercase tracking-tighter leading-none text-black whitespace-nowrap">
                        {slide.headline.split(' ')[0]}
                    </span>
                </div>
            </div>

            {/* --- Typography Side --- */}
            <div className="absolute top-0 left-0 w-full h-[50%] md:h-full z-20 pointer-events-none">
                <div className="container mx-auto px-6 md:px-12 lg:px-20 h-full flex flex-col md:flex-row items-center justify-center md:justify-between pt-12 md:pt-0">
                    {/* Desktop Spacer - Now on the left for isReverse */}
                    {isReverse && <div className="hidden md:block w-1/2 h-full" />}
                    
                    <div className={`w-full md:w-1/2 flex flex-col items-center text-center ${!isReverse ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} relative pointer-events-auto z-40`}>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex flex-col gap-2 md:gap-5 md:max-w-xl"
                        >
                            <motion.div variants={itemVariants(!isReverse)} className="flex items-center gap-4 group justify-center md:justify-start">
                                {isReverse && <div className={`hidden md:block w-12 h-[1px] ${slide.theme.accentBg} transition-all group-hover:w-20`} />}
                                <span className={`text-[10px] md:text-[14px] font-bold uppercase tracking-[0.4em] ${slide.theme.accent}`}>
                                    {slide.title}
                                </span>
                                {!isReverse && <div className={`hidden md:block w-12 h-[1px] ${slide.theme.accentBg} transition-all group-hover:w-20`} />}
                            </motion.div>
                            
                            <RevealText delay={0.2} className="relative">
                                <h1 className={`text-[32px] md:text-[64px] lg:text-[80px] font-serif font-light ${slide.theme.text} leading-[0.9] tracking-tight`}>
                                    {slide.headline}
                                </h1>
                            </RevealText>

                            <motion.p 
                                variants={itemVariants(!isReverse)}
                                className={`text-[13px] md:text-lg ${slide.theme.subtext} font-light leading-relaxed max-w-xs md:max-w-md ${!isReverse ? 'md:ml-auto' : 'md:mr-auto'}`}
                            >
                                {slide.subheadline}
                            </motion.p>

                            <motion.div 
                                variants={itemVariants(!isReverse)}
                                className={`flex flex-wrap items-center gap-4 md:gap-6 mt-2 md:mt-4 justify-center ${!isReverse ? 'md:justify-end' : 'md:justify-start'}`}
                            >
                                <Link 
                                    href={slide.primaryLink.href} 
                                    className={`group relative px-6 py-2 md:px-8 md:py-2.5 ${slide.theme.btn} overflow-hidden rounded-full transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl`}
                                >
                                    <span className="relative z-10 font-bold tracking-wide uppercase text-[12px] md:text-[14px]">
                                        {slide.primaryLink.text}
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                </Link>
                                
                                <Link 
                                    href="/all-products" 
                                    className={`flex items-center gap-2 ${slide.theme.text} text-[10px] md:text-sm font-bold uppercase tracking-widest hover:opacity-60 transition-all border-b border-transparent hover:border-current pb-1`}
                                >
                                    Learn more
                                    <ArrowRight size={14} />
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Desktop Spacer - Now on the right for normal layout */}
                    {!isReverse && <div className="hidden md:block w-1/2 h-full" />}
                </div>
            </div>

            {/* --- Product Image Side --- */}
            <div className={`absolute bottom-0 ${!isReverse ? 'right-0' : 'left-0'} w-full md:w-1/2 h-[60%] md:h-full z-10 pointer-events-none md:pointer-events-auto`}>
                <div className={`w-full h-full flex ${isLargePinedBottom ? 'items-end' : 'items-center'} ${!isReverse ? 'justify-end' : 'justify-start'}`}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: !isReverse ? 100 : -100, rotate: !isReverse ? 5 : -5 }}
                        animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: !isReverse ? -100 : 100 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative w-[90%] md:w-[140%] h-full flex items-center group`}
                    >
                        {/* Interactive Glow Effect behind image */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${slide.theme.glow}`} />
                        
                        <div className={`relative w-full h-full animate-float-slow`}>
                            <Image 
                                src={slide.imageSrc} 
                                alt={slide.headline} 
                                fill
                                className={`object-contain ${!isReverse ? 'object-right' : 'object-left'} ${isLargePinedBottom ? 'object-bottom' : ''} drop-shadow-[0_40px_100px_rgba(0,0,0,0.12)] transition-transform duration-700 group-hover:scale-105`}
                                priority
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), 8000);
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
    <section className="relative w-full h-[70vh] md:h-[75vh] min-h-[600px] overflow-hidden flex items-center bg-[#FAF9F6] font-sans">
      <AnimatePresence>
        <HeroSlide key={currentSlide} slide={slide} />
      </AnimatePresence>

      {/* --- Refined Navigation Controls --- */}
      <div className="absolute bottom-10 left-6 md:left-12 lg:left-20 z-50 flex flex-col gap-10">
        {/* Slide Numbers */}
        <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-[1px] bg-black/10 relative overflow-hidden">
                <motion.div 
                    className="absolute top-0 left-0 w-full bg-black"
                    initial={{ height: 0 }}
                    animate={{ height: `${((currentSlide + 1) / heroSlides.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <div className="flex flex-col items-center font-sans tracking-tighter">
                <span className="text-2xl font-bold">0{currentSlide + 1}</span>
                <span className="text-[10px] text-black/40 font-bold uppercase">/ 0{heroSlides.length}</span>
            </div>
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-3">
            <button 
                onClick={prevSlide}
                className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all active:scale-90"
                aria-label="Previous slide"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={nextSlide}
                className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all active:scale-90"
                aria-label="Next slide"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* Progress Bar (at the very bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/5 z-50">
        <motion.div 
            key={currentSlide}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 8, ease: "linear" }}
            className={`h-full origin-left ${slide.theme.accentBg}`}
        />
      </div>
    </section>
  );
}
