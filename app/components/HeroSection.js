import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

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
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPersonalCard, setCurrentPersonalCard] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const autoplayTimeoutRef = useRef(null);
  const autoplayIntervalRef = useRef(null);

  const resetAutoplay = useCallback(() => {
    clearInterval(autoplayIntervalRef.current);
    clearTimeout(autoplayTimeoutRef.current);

    autoplayTimeoutRef.current = setTimeout(() => {
      autoplayIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
    }, 60000); // 1 minute
  }, []);

  // Auto-advance main slider
  useEffect(() => {
    autoplayIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => {
      clearInterval(autoplayIntervalRef.current);
      clearTimeout(autoplayTimeoutRef.current);
    };
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    resetAutoplay();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    resetAutoplay();
  };

  const nextPersonalCard = () => {
    setCurrentPersonalCard((prev) => (prev + 1) % personalCards.length);
  };

  const prevPersonalCard = () => {
    setCurrentPersonalCard((prev) => (prev - 1 + personalCards.length) % personalCards.length);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const renderIcon = (iconType, className) => {
    switch (iconType) {
      case 'gift':
        return <Gift className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'bag':
        return <ShoppingBag className={className} />;
      case 'clock':
        return <Clock className={className} />;
      default:
        return <Star className={className} />;
    }
  };

  return (
    <>
      <section className="relative bg-white">
          <div className={`grid grid-cols-1 ${isAuthenticated ? '' : 'lg:grid-cols-[1fr_max-content] lg:gap-x-0 lg:gap-y-0'} items-stretch`}>
            {/* Main Slider - Left Column */}
            <div className="relative">
              <div className="relative h-[400px] lg:h-[480px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-white hover:scale-105 transition-all duration-300 border border-white/20"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-white hover:scale-105 transition-all duration-300 border border-white/20"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>

              {/* Slider Content */}
              <div className="relative w-full h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={heroSlides[currentSlide].image}
                      alt={heroSlides[currentSlide].title}
                      className="w-full h-full object-cover"
                      width={1920} // Placeholder, user might need to adjust
                      height={1080} // Placeholder, user might need to adjust
                      priority={true} // Since it's a hero image, load immediately
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-transparent" />
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex items-start justify-start p-8">
                      <div className="text-white max-w-md text-left">
                        <motion.h2 
                          key={`title-${currentSlide}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="text-3xl font-light mb-2 tracking-wide drop-shadow-lg"
                        >
                          {heroSlides[currentSlide].title}
                        </motion.h2>
                        <motion.p 
                          key={`desc-${currentSlide}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          className="text-lg opacity-90 font-light drop-shadow-lg"
                        >
                          {heroSlides[currentSlide].description}
                        </motion.p>
                        <Link href="/all-products" passHref>
                          <motion.button
                            key={`btn-${currentSlide}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="mt-4 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                          >
                            Explore All
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pagination Dots */}
              <div className="absolute bottom-6 left-8 z-20 flex gap-3">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-8 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white shadow-lg' 
                        : 'bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              {/* Expand Button */}
              <button 
                onClick={toggleFullscreen}
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-white hover:scale-105 transition-all duration-300 border border-white/20"
              >
                <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>

            {/* Mobile Search Bar */}
            <div className="mt-6 hidden">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search luxury beauty products..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 focus:border-[var(--brand-blue)] transition-all duration-300 bg-white shadow-sm"
                />
              </div>
            </div>
          </div>

                      {/* Personal Widget - Right Column */}
                      {!isAuthenticated && (
                      <div className="relative max-w-sm ml-auto">
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden h-[360px] lg:h-[440px] flex flex-col hidden md:block">              {/* Header */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white ">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-pink)] rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Welcome to Naya Lumière</p>
                    <p className="text-sm text-gray-600">Sign in for exclusive benefits and personalized experience</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={prevPersonalCard}
                      className="w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all duration-200"
                      disabled={currentPersonalCard === 0}
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={nextPersonalCard}
                      className="w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all duration-200"
                      disabled={currentPersonalCard === personalCards.length - 1}
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal Cards */}
              <div className="flex-1 p-4">
                <div className="relative h-32 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPersonalCard}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <div className="bg-gradient-to-br from-[var(--brand-blue)]/8 via-[var(--brand-pink)]/5 to-[var(--brand-blue)]/8 rounded-2xl p-6 h-full flex items-center gap-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                          {renderIcon(personalCards[currentPersonalCard].iconType, "h-8 w-8 text-[var(--brand-blue)]")}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2 leading-tight">
                            {personalCards[currentPersonalCard].title}
                          </h4>
                          {personalCards[currentPersonalCard].points && (
                            <div className="flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 w-fit">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {personalCards[currentPersonalCard].points} points
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                {/* Features List */}
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-gray-900 mb-4">Member Benefits</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-[var(--brand-pink)]" />
                      <span>Exclusive early access to new products</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-[var(--brand-blue)]" />
                      <span>Free shipping on orders over 200 AED</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-[var(--brand-pink)]" />
                      <span>Birthday rewards and special offers</span>
                    </div>
                  </div>
                </div>
              </div>

              
                          </div>
            
                        </div>
                        )}
                                </div>
                      
                            {/* Elegant Divider */}
      <div className="relative hidden md:block">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <div className="bg-white px-6">
            <div className="w-8 h-1 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] rounded-full" />
          </div>
        </div>
      </div>
    </section>

    {/* Fullscreen Modal */}
    <AnimatePresence>
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Fullscreen Slider */}
            <div className="relative w-full max-w-6xl h-full max-h-[80vh] rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <ImageWithFallback
                    src={heroSlides[currentSlide].image}
                    alt={heroSlides[currentSlide].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/20" />
                  
                  {/* Fullscreen Content */}
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center text-white max-w-2xl">
                      <motion.h1 
                        key={`fs-title-${currentSlide}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-6xl font-light mb-6 tracking-wide"
                      >
                        {heroSlides[currentSlide].title}
                      </motion.h1>
                      <motion.p 
                        key={`fs-desc-${currentSlide}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-2xl opacity-90 font-light mb-8"
                      >
                        {heroSlides[currentSlide].description}
                      </motion.p>
                      <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        onClick={() => onNavigate?.(heroSlides[currentSlide].link.replace('/', ''))}
                        className="bg-white text-gray-900 px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                      >
                        Explore Collection
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Fullscreen Navigation */}
              <button
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>

              {/* Fullscreen Pagination */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}