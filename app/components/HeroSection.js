import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

import { ChevronLeft, ChevronRight, Search, User, ShoppingBag, Gift, Star, Clock } from 'lucide-react';
import Image from 'next/image';
import imagePng from '../../public/Untitled design.png';
import imageTwoJpg from '../../public/2.jpg';
import Link from 'next/link'; // Import Link
import { ImageWithFallback } from './figma/ImageWithFallback';

const heroSlides = [
  {
    id: 1,
    title: "Welcome to Paradise",
    description: "Discover the ultimate beauty destination",
    image: "https://zorah.ca/cdn/shop/files/zorah_spring-banner-web1.jpg?v=1710357646&width=2000",
    link: "/promo/paradise"
  },
  {
    id: 2,
    title: "First Order Special",
    description: "Get 20% off your first purchase",
    image: imagePng.src,
    link: "/promo/first-order"
  },
  {
    id: 3,
    title: "Luxury Collection",
    description: "Exclusive premium beauty products",
    image: imageTwoJpg.src,
    link: "/collections/luxury"
  }
];

const personalCards = [
  {
    id: 1,
    title: "Get bonus points for registration",
    points: 100,
    iconType: "gift",
    type: "bonus"
  },
  {
    id: 2,
    title: "Your bonus points will be here",
    iconType: "star",
    type: "points"
  },
  {
    id: 3,
    title: "The status of your orders will be here",
    iconType: "bag",
    type: "orders"
  },
  {
    id: 4,
    title: "Our App is Coming Soon",
    iconType: "clock",
    type: "store"
  }
];

export function HeroSection({ onNavigate }) {
  const { isAuthenticated, user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  // Auto-advance main slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <section className="relative h-[500px] md:h-[650px] w-full overflow-hidden bg-[#FBFBFC]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Image Layer */}
          <div className="absolute inset-0">
            <Image
              src={heroSlides[currentSlide].image}
              alt={heroSlides[currentSlide].title}
              fill
              className="object-cover"
              priority
            />
            {/* Elegant Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          {/* Content Layer */}
          <div className="relative h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center items-start">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="h-[1px] w-12 bg-[var(--brand-pink)]" />
                <span className="text-[var(--brand-pink)] text-xs font-bold uppercase tracking-[0.3em]">Exclusive Collection</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-5xl md:text-7xl font-serif text-white mb-6 leading-[1.1] drop-shadow-2xl"
              >
                {heroSlides[currentSlide].title.split(' ').map((word, i) => (
                  <span key={i} className={i === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 italic" : ""}>
                    {word}{' '}
                  </span>
                ))}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed font-light max-w-lg"
              >
                {heroSlides[currentSlide].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <Button 
                  onClick={() => router.push(heroSlides[currentSlide].link)}
                  className="bg-white text-black hover:bg-amber-50 h-14 px-10 rounded-2xl font-bold transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  Shop Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                
                {!isAuthenticated && (
                  <Button 
                    variant="ghost"
                    onClick={() => router.push('/auth')}
                    className="bg-white/10 backdrop-blur-md text-white border border-white/20 h-14 px-8 rounded-2xl font-bold hover:bg-white/20 transition-all"
                  >
                    Join the Club
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 right-6 md:right-12 flex items-center gap-6 z-20">
        <div className="flex gap-2">
          <button
            onClick={prevSlide}
            className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="group relative h-8 flex items-center"
            >
              <div className={`transition-all duration-500 rounded-full ${
                index === currentSlide ? 'w-8 bg-[var(--brand-pink)] h-1.5' : 'w-2 bg-white/40 h-1.5 group-hover:bg-white/60'
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Animated Sparkles Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-amber-200/20 blur-[100px] rounded-full"
        />
      </div>
    </section>
  );
}