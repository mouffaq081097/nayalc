import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingBag, Award, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Moon, Sun, Droplets } from 'lucide-react';
import Image from 'next/image';
import productPng from '../../public/ChatGPT_Image_Apr_12__2025__01_41_20_PM-removebg-preview.png';
import secondProductPng from '../../public/Untitled design.png';
import midnightProductPng from '../../public/WhatsApp_Image_2025-07-14_at_19.58.12_7d2e719f-removebg-preview.png';
import pureProductPng from '../../public/Adobe Express - file (8).png';
import vibrantProductPng from '../../public/Adobe Express - file (9).png';
import rivieraProductPng from '../../public/Adobe Express - file (10).png';

const heroSlides = [
  {
    id: 1,
    type: 'purete',
    title: { main: "PURE", sub: "L'ESSENCE" },
    subtitle: "COLLECTION MINIMALISTE • GENÈVE",
    description: "Experience the pinnacle of dermatological purity. A masterclass in minimalist luxury, where architectural precision meets dreamlike silk textures for transformative results.",
    image: pureProductPng,
    bgText: "PURITY",
    accent: "#4B5563",
    colors: { from: "#F9FAFB", via: "#F3F4F6", to: "#E5E7EB" }
  },
  {
    id: 2,
    type: 'atelier',
    title: { main: "SYNCHRO", sub: "LA LÉGENDE" },
    subtitle: "ÉDITION HÉRITAGE • PARIS",
    description: "The gold standard of cellular nutrition. Our legendary French formula harmonizes skin health with biological science and the soul of Parisian luxury.",
    image: productPng,
    bgText: "LUXURY",
    accent: "#f59e0b",
    colors: { from: "#FFFBEB", via: "#FEF3C7", to: "#FDE68A" }
  },
  {
    id: 3,
    type: 'riviera',
    title: { main: "RIVIERA", sub: "ÉCLAT PUR" },
    subtitle: "RIVIERA MORNING COLLECTION",
    description: "Wake up to the luminosity of the Côte d'Azur. A fresh, dewy symphony of hydration designed for the ultimate morning glow and effortless radiance.",
    image: rivieraProductPng,
    bgText: "GLOW",
    accent: "#06b6d4",
    colors: { from: "#ECFEFF", via: "#CFFAFE", to: "#A5F3FC" }
  },
  {
    id: 4,
    type: 'midnight',
    title: { main: "MIDNIGHT", sub: "REBORN" },
    subtitle: "THE NOCTURNAL FRAGRANCE • PARIS",
    description: "A deep, mysterious essence inspired by the soul of a Parisian night. Discover the art of haute parfumerie through notes of rare amber and smoked wood.",
    image: midnightProductPng,
    bgText: "MYSTERY",
    accent: "#f97316",
    notes: [
        { label: "Top", scent: "Bergamot", x: "10%", y: "20%" },
        { label: "Heart", scent: "Rare Amber", x: "85%", y: "45%" },
        { label: "Base", scent: "Smoked Wood", x: "15%", y: "75%" }
    ],
    colors: { from: "#000000", via: "#431407", to: "#000000" }
  },
  {
    id: 5,
    type: 'signature',
    title: { main: "VIBRANT", sub: "ENERGY" },
    subtitle: "SOINS DE PEAU • PARIS",
    description: "Ignite your skin's natural vitality with our most potent radiance ritual yet. Infused with vitamin-rich botanicals for an instant, modern glow.",
    image: vibrantProductPng,
    bgText: "ENERGY",
    accent: "#98764D",
    colors: { from: "#98764D", via: "#B8966D", to: "#78562D" }
  }
];

export function HeroSection() {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const router = useRouter();
  const sectionRef = useRef(null);

  // --- INTERACTIVE ENGINE ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 60, stiffness: 80 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const productX = useTransform(smoothX, [-0.5, 0.5], ["-8%", "0%"]);
  const productY = useTransform(smoothY, [-0.5, 0.5], ["-0.5%", "0.5%"]);
  const bgTextX = useTransform(smoothX, [-0.5, 0.5], ["-4%", "4%"]);
  
  // Lens Flare for Midnight
  const flareX = useTransform(smoothX, [-0.5, 0.5], ["-50px", "50px"]);
  const flareY = useTransform(smoothY, [-0.5, 0.5], ["-50px", "50px"]);

  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth) - 0.5);
    mouseY.set((clientY / innerHeight) - 0.5);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 10000);
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

  // --- MAGNETIC BUTTONS ENGINE ---
  const buttonX = useMotionValue(0);
  const buttonY = useMotionValue(0);
  const buttonSpringX = useSpring(buttonX, { stiffness: 150, damping: 15 });
  const buttonSpringY = useSpring(buttonY, { stiffness: 150, damping: 15 });

  const handleMagneticMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    buttonX.set(x * 0.35);
    buttonY.set(y * 0.35);
  };

  const resetMagnetic = () => {
    buttonX.set(0);
    buttonY.set(0);
  };

  return (
    <section 
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className={`relative h-[80dvh] min-h-[650px] w-full overflow-hidden flex items-center transition-colors duration-1000 cursor-default font-sans ${slide.type === 'midnight' || slide.type === 'signature' ? 'bg-[#0a0a0a]' : 'bg-[#FAF9F6]'}`}
    >
      {/* --- LUXURY NOISE OVERLAY --- */}
      <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay contrast-150 brightness-100 animate-noise"></div>

      {/* --- CLASSIC ACCENT FRAME --- */}
      <div className={`absolute inset-6 md:inset-10 border transition-all duration-1000 pointer-events-none z-50 ${slide.type === 'atelier' ? 'border-[#D4AF37]/20' : slide.type === 'midnight' || slide.type === 'signature' ? 'border-white/5' : 'border-black/5'}`}></div>

      {/* --- BACKGROUND DECOR --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="wait">
            <motion.div 
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0"
            >
                {/* Modern Mesh Gradients / Liquid Blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            x: [0, 100, -50, 0],
                            y: [0, -50, 100, 0],
                            scale: [1, 1.2, 0.9, 1],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full blur-[120px] opacity-40"
                        style={{ backgroundColor: slide.accent }}
                    />
                    <motion.div
                        animate={{
                            x: [0, -100, 50, 0],
                            y: [0, 100, -50, 0],
                            scale: [1, 0.8, 1.1, 1],
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full blur-[100px] opacity-30"
                        style={{ backgroundColor: slide.type === 'midnight' ? '#431407' : slide.accent }}
                    />
                </div>

                {/* --- AMBIENT PARTICLES --- */}
                <div className="absolute inset-0 z-0">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ 
                                x: Math.random() * 100 + "%", 
                                y: Math.random() * 100 + "%",
                                opacity: 0
                            }}
                            animate={{ 
                                x: [null, (Math.random() * 100) + "%"],
                                y: [null, (Math.random() * 100) + "%"],
                                opacity: [0, 0.3, 0],
                                scale: [0, 1, 0]
                            }}
                            transition={{ 
                                duration: 10 + Math.random() * 20, 
                                repeat: Infinity, 
                                ease: "linear" 
                            }}
                            className="absolute pointer-events-none"
                        >
                            {slide.type === 'riviera' ? (
                                <Droplets size={Math.random() * 20 + 10} className="text-cyan-200/40" />
                            ) : slide.type === 'midnight' || slide.type === 'signature' ? (
                                <div className="w-1 h-1 bg-orange-400 rounded-full blur-[1px]" />
                            ) : (
                                <div className="w-2 h-2 rounded-full border border-gray-400/20" />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Specific Backgrounds */}
                {slide.type === 'midnight' ? (
                    <div className="absolute inset-0 bg-black">
                        {/* Midnight Embers */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ 
                                    y: [0, -250, 0],
                                    x: [0, (i % 2 === 0 ? 50 : -50), 0],
                                    opacity: [0, 0.6, 0],
                                    scale: [0.5, 1.5, 0.5]
                                }}
                                transition={{ duration: 5 + Math.random() * 10, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute w-1 h-1 bg-orange-500 rounded-full blur-[1px]"
                                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to left, ${slide.colors.from}, ${slide.colors.via}, ${slide.colors.to})` }}></div>
                )}

                {/* Grainy Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                
                {/* Large Architectural Watermark - Refined */}
                <motion.div 
                    style={{ x: bgTextX }}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-sans font-black select-none tracking-[-0.05em] uppercase whitespace-nowrap z-0 transition-colors duration-1000 ${slide.type === 'midnight' ? 'text-white/[0.03]' : 'text-black/[0.03]'}`}
                >
                    {slide.bgText}
                </motion.div>
            </motion.div>
        </AnimatePresence>
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 h-full">
        <AnimatePresence mode="wait">
            <motion.div 
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 h-full items-center -mt-16 lg:-mt-32"
            >
                {/* --- PRODUCT SIDE --- */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`order-2 lg:order-1 ${slide.type === 'atelier' || slide.type === 'purete' || slide.type === 'signature' || slide.type === 'riviera' ? 'lg:justify-start lg:-ml-12' : 'lg:justify-end lg:-mr-8'} relative flex items-center justify-center h-[40vh] lg:h-full`}
                >
                    <div className="absolute top-0 lg:top-1/4 left-0 hidden xl:flex flex-col gap-2 opacity-20 select-none">
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase">Coord: 25.2048° N / 55.2708° E</span>
                        <div className="w-12 h-[1px] bg-current"></div>
                    </div>

                    <motion.div 
                        style={{ x: productX, y: productY }}
                        className="relative w-full max-w-[300px] sm:max-w-[450px] lg:max-w-[700px] aspect-[4/5] group flex items-center"
                    >
                        {/* Fragrance Notes Callouts - Scaled Down & Responsive */}
                        {slide.type === 'midnight' && slide.notes.map((note, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.5 + (i * 0.2), type: "spring" }}
                                className="absolute z-30 hidden sm:flex flex-col items-center gap-1.5"
                                style={{ left: note.x, top: note.y }}
                            >
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></div>
                                <div className="px-4 py-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl shadow-xl">
                                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-orange-400 block leading-none mb-1">{note.label}</span>
                                    <span className="text-[10px] font-bold text-white whitespace-nowrap">{note.scent}</span>
                                </div>
                            </motion.div>
                        ))}

                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-10 w-full h-full overflow-hidden"
                        >
                            <Image
                                src={slide.image}
                                alt={slide.title.main}
                                className={`w-full h-full object-contain filter drop-shadow-[0_25px_25px_rgba(0,0,0,0.1)] transition-all duration-1000 ${slide.type === 'midnight' ? 'brightness-110' : ''}`}
                                priority
                            />
                        </motion.div>

                        {/* --- ARCHITECTURAL WALL ELEMENT --- */}
                        <div className={`absolute top-1/2 -right-8 lg:-right-24 -translate-y-1/2 w-24 lg:w-48 h-[120%] transition-all duration-1000 hidden sm:block z-20 ${slide.type === 'midnight' ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/5'} backdrop-blur-md border-l skew-x-[-15deg] shadow-[-20px_0_50px_rgba(0,0,0,0.1)]`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20"></div>
                            {/* Decorative lines on the wall */}
                            <div className={`absolute top-1/4 left-0 w-full h-[1px] opacity-20 ${slide.type === 'midnight' ? 'bg-white' : 'bg-black'}`}></div>
                            <div className={`absolute top-3/4 left-0 w-full h-[1px] opacity-10 ${slide.type === 'midnight' ? 'bg-white' : 'bg-black'}`}></div>
                            {/* Inner Glow/Reflection */}
                            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </div>

                        {/* Enhanced Shadow/Reflection - Scaled Down */}
                        <div className={`absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[60%] h-[20px] rounded-[100%] blur-[20px] opacity-40 mix-blend-multiply ${slide.type === 'midnight' ? 'bg-orange-900' : 'bg-gray-400'}`}></div>
                    </motion.div>
                </motion.div>

                {/* --- CONTENT SIDE --- */}
                <motion.div
                    initial={{ opacity: 0, x: slide.type === 'atelier' || slide.type === 'purete' || slide.type === 'signature' || slide.type === 'riviera' ? 40 : -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className={`order-1 lg:order-2 flex flex-col justify-center gap-6 lg:gap-8 pb-0 pt-12 lg:pt-0 text-center lg:text-left items-center lg:items-start`}
                >
                    <div className="flex flex-col gap-3 lg:gap-4 items-center lg:items-start w-full">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-3 lg:gap-4"
                        >
                            <span className="h-[1.5px] w-6 lg:w-8 rounded-full" style={{ backgroundColor: slide.accent }}></span>
                            <span className={`text-[8px] lg:text-[9px] font-black tracking-[0.4em] uppercase flex items-center gap-2 transition-colors duration-1000 ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-white' : 'text-gray-900'}`}>
                                {slide.type === 'midnight' ? <Droplets size={10} className="text-orange-500" /> : <Sparkles size={10} className="animate-pulse" style={{ color: slide.accent }} />}
                                {slide.subtitle}
                            </span>
                        </motion.div>
                        
                        <div className="relative py-1 w-full">
                            <div className="overflow-hidden mb-1">
                                <motion.h1
                                    initial={{ y: "110%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                    className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.9] tracking-tight font-black transition-colors duration-1000 ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-white' : 'text-gray-900'}`}
                                >
                                    {slide.title.main}
                                </motion.h1>
                            </div>
                            <div className="overflow-hidden">
                                <motion.h2
                                    initial={{ y: "110%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                                    className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight font-light transition-colors duration-1000 opacity-40 ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-white' : 'text-gray-900'}`}
                                >
                                    {slide.title.sub}
                                </motion.h2>
                            </div>
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 0.05, scale: 1 }}
                                transition={{ duration: 2, delay: 0.5 }}
                                className="absolute -top-4 lg:-top-6 left-1/2 lg:-left-4 -translate-x-1/2 lg:translate-x-0 text-6xl md:text-7xl lg:text-8xl font-black text-transparent stroke-1 pointer-events-none whitespace-nowrap select-none hidden sm:block" 
                                style={{ WebkitTextStroke: `1px ${slide.type === 'midnight' || slide.type === 'signature' ? 'white' : 'black'}` }}
                            >
                                {slide.title.main}
                            </motion.div>
                        </div>
                    </div>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className={`text-xs sm:text-sm lg:text-base font-medium leading-relaxed max-w-[280px] sm:max-w-md transition-colors duration-1000 ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                        {slide.description}
                    </motion.p>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 lg:gap-8 mt-2 lg:mt-4 w-full">
                        <motion.button
                            onMouseMove={handleMagneticMove}
                            onMouseLeave={resetMagnetic}
                            style={{ x: buttonSpringX, y: buttonSpringY }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/all-products')}
                            className={`group relative h-12 lg:h-14 px-6 lg:px-8 rounded-full transition-all duration-500 shadow-lg flex items-center gap-4 lg:gap-6 overflow-hidden ${slide.type === 'midnight' || slide.type === 'signature' ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}
                        >
                            <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" style={{ backgroundColor: slide.accent }}></div>
                            <span className={`relative z-10 font-black uppercase tracking-[0.2em] text-[9px] lg:text-[10px] ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-gray-900 group-hover:text-white' : 'text-white'}`}>
                                Discover More
                            </span>
                            <div className={`relative z-10 w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all ${slide.type === 'midnight' || slide.type === 'signature' ? 'bg-black/5' : 'bg-white/10 group-hover:bg-white/20'}`}>
                                <ArrowRight size={14} className={slide.type === 'midnight' || slide.type === 'signature' ? 'text-gray-900 group-hover:text-white' : 'text-white'} />
                            </div>
                        </motion.button>

                        <motion.button
                            onClick={() => router.push('/collections/new-arrivals')}
                            className={`flex items-center gap-3 lg:gap-5 font-black uppercase tracking-[0.3em] text-[8px] lg:text-[9px] transition-all group ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-white' : 'text-gray-900'}`}
                        >
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-current flex items-center justify-center group-hover:bg-current group-hover:text-black transition-all">
                                <ShoppingBag size={14} />
                            </div>
                            Shop New
                        </motion.button>
                    </div>

                    <div className="flex items-center justify-center lg:justify-start gap-6 lg:gap-8 mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-current/10 w-full">
                        {(slide.type === 'midnight' || slide.type === 'signature' ? 
                            [ 
                                { label: 'HAUTE', sub: 'PARFUME', icon: Sparkles },
                                { label: 'ELITE', sub: 'ESSENCE', icon: Award }
                            ] : [ 
                                { label: 'FRANÇAIS', sub: 'LABO', icon: ShieldCheck },
                                { label: 'LAURÉAT', sub: '2026', icon: Award }
                            ]
                        ).map((badge, idx) => (
                            <div key={idx} className="flex items-center gap-3 lg:gap-4 group/badge">
                                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-500 group-hover/badge:scale-110 shadow-lg" style={{ color: slide.accent }}>
                                    <badge.icon size={16} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className={`text-[8px] lg:text-[10px] font-black tracking-widest transition-colors ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-white' : 'text-gray-900'}`}>{badge.label}</span>
                                    <span className="text-[7px] lg:text-[9px] font-medium uppercase tracking-[0.1em] opacity-40" style={{ color: slide.type === 'midnight' || slide.type === 'signature' ? 'white' : 'black' }}>{badge.sub}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
      </div>

      {/* --- CAROUSEL NAVIGATION --- */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-12 z-[60] flex items-center gap-10">
        <div className="flex gap-4">
            {heroSlides.map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => { setIsAutoPlaying(false); setCurrentSlide(i); }}
                    className={`h-1.5 transition-all duration-700 rounded-full ${currentSlide === i ? 'w-14' : 'w-5 bg-gray-400/20 hover:bg-gray-400/40'}`}
                    style={currentSlide === i ? { backgroundColor: slide.accent } : {}}
                />
            ))}
        </div>
        <div className="hidden md:flex gap-4">
            <button onClick={prevSlide} className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center hover:scale-110 ${slide.type === 'midnight' || slide.type === 'signature' ? 'border-white/10 text-white hover:bg-white/10' : 'border-black/5 text-gray-900 hover:bg-black/5'}`}>
                <ChevronLeft size={22} strokeWidth={1.5} />
            </button>
            <button onClick={nextSlide} className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center hover:scale-110 ${slide.type === 'midnight' || slide.type === 'signature' ? 'border-white/10 text-white hover:bg-white/10' : 'border-black/5 text-gray-900 hover:bg-black/5'}`}>
                <ChevronRight size={22} strokeWidth={1.5} />
            </button>
        </div>
      </div>

      {/* --- SCROLL INDICATOR --- */}
      <motion.div 
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12 left-12 hidden lg:flex flex-col items-center gap-4 z-50"
      >
        <span className={`text-[9px] font-black uppercase tracking-[0.5em] [writing-mode:vertical-lr] ${slide.type === 'midnight' || slide.type === 'signature' ? 'text-white/40' : 'text-gray-400'}`}>SCROLL</span>
        <div className={`w-[1px] h-10 ${slide.type === 'midnight' || slide.type === 'signature' ? 'bg-white/20' : 'bg-gray-200'}`}></div>
      </motion.div>

      {/* --- GLASSMORPHIC PROGRESS BAR --- */}
      <div className="absolute bottom-0 left-0 w-full h-[4px] bg-black/5 z-[70]">
        <motion.div 
            key={currentSlide}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 10, ease: "linear" }}
            className="h-full"
            style={{ backgroundColor: slide.accent }}
        />
      </div>

      <style jsx>{`
        .mask-gradient-b {
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
        }
        @keyframes noise {
          0% { transform: translate(0,0) }
          10% { transform: translate(-5%,-5%) }
          20% { transform: translate(-10%,5%) }
          30% { transform: translate(5%,-10%) }
          40% { transform: translate(-5%,15%) }
          50% { transform: translate(-10%,5%) }
          60% { transform: translate(15%,0) }
          70% { transform: translate(0,10%) }
          80% { transform: translate(-15%,0) }
          90% { transform: translate(10%,5%) }
          100% { transform: translate(5%,0) }
        }
        .animate-noise {
          animation: noise 0.2s infinite;
        }
      `}</style>
    </section>
  );
}
