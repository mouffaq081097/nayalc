'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import StoreCategoryNav from './StoreCategoryNav';
import { useHeader } from '../context/HeaderContext';
import { NayaLumiereLogo } from './Icons';

const HeroUnit = ({ 
  title, 
  headline, 
  subheadline, 
  primaryLink, 
  secondaryLink, 
  imageSrc, 
  dark = false, 
  videoSrc = null,
  overlay = false,
  align = "center",
  mode = "background", // 'background' or 'product'
  decorative = false,
  fullWidthImage = false,
  headlineColor,
  bgClass,
  bubbles = false,
  aura = false,
  decorativeImage = null,
  headlineFontClass,
  imageOffset = 0,
  animateDecorative = true
}) => {
  const [bubbleList, setBubbleList] = React.useState([]);
  const [particleList, setParticleList] = React.useState([]);

  React.useEffect(() => {
    if (bubbles) {
      const newBubbles = [...Array(40)].map((_, i) => ({
        id: i,
        // Shift to the right side (50-100% range)
        size: 20 + Math.random() * 100,
        left: (50 + Math.random() * 50) + "%",
        duration: 5 + Math.random() * 10,
        delay: Math.random() * 8,
        drift: (Math.random() * 100 - 70)
      }));
      setBubbleList(newBubbles);
    }
    
    // Add tiny drifting particles for all modes to fill space
    const newParticles = [...Array(20)].map((_, i) => ({
        id: i,
        size: 1 + Math.random() * 3,
        left: Math.random() * 100 + "%",
        top: Math.random() * 100 + "%",
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 10
    }));
    setParticleList(newParticles);
  }, [bubbles]);

  return (
    <section className={`relative w-full h-[650px] md:h-[750px] overflow-hidden flex flex-col pt-8 md:pt-12 mb-3 border-b-[12px] border-white ${bgClass || (mode === 'product' ? 'bg-[#FAF9F6]' : 'bg-gray-100')} ${align === 'left' ? 'items-start' : 'items-center'}`}>
      
      {/* Decorative Floating Images - New */}
      {decorativeImage && (
          <>
            <div 
                className="absolute left-[2%] md:left-[5%] bottom-[10%] w-[25%] h-[50%] pointer-events-none hidden md:block z-10"
            >
                <Image src={decorativeImage} alt="" fill className="object-contain object-left-bottom drop-shadow-xl" />
            </div>
            <div 
                className="absolute right-[2%] md:right-[5%] bottom-[10%] w-[25%] h-[50%] pointer-events-none hidden md:block z-10"
            >
                <div className="relative w-full h-full scale-x-[-1]">
                    <Image src={decorativeImage} alt="" fill className="object-contain object-right-bottom drop-shadow-xl" />
                </div>
            </div>
          </>
      )}

      {/* Dynamic Aura Blobs (Fills Empty Space with Light) */}
      {aura && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
              <motion.div 
                animate={{ 
                    x: [0, 100, 0], 
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1] 
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-pink/10 rounded-full blur-[120px]"
              />
              <motion.div 
                animate={{ 
                    x: [0, -80, 0], 
                    y: [0, 100, 0],
                    scale: [1, 1.3, 1] 
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-blue/10 rounded-full blur-[120px]"
              />
          </div>
      )}

      {/* Floating Essence Particles (Global Ambient Detail) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {particleList.map((p) => (
              <motion.div
                key={p.id}
                animate={{ 
                    y: [0, -100, 0],
                    x: [0, 50, 0],
                    opacity: [0, 0.3, 0]
                }}
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
                className="absolute bg-brand-pink/30 rounded-full"
                style={{ 
                    width: p.size + "px",
                    height: p.size + "px",
                    left: p.left,
                    top: p.top
                }}
              />
          ))}
      </div>

      {/* Liquid Bubbles Engine */}
      {bubbles && bubbleList.length > 0 && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {bubbleList.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ 
                        opacity: 0, 
                        y: 800, 
                        x: b.left 
                    }}
                    animate={{ 
                        opacity: [0, 0.7, 0],
                        y: -400,
                        x: `calc(${b.left} + ${b.drift}px)`
                    }}
                    transition={{ 
                        duration: b.duration,
                        repeat: Infinity,
                        delay: b.delay,
                        ease: "easeIn"
                    }}
                    className="absolute rounded-full border border-blue-200/50 shadow-[0_4px_15px_rgba(0,113,227,0.1),inset_0_-4px_8px_rgba(0,113,227,0.1),inset_0_4px_12px_rgba(255,255,255,0.9)] bg-gradient-to-br from-white/40 via-blue-100/20 to-transparent backdrop-blur-[1px]"
                    style={{ 
                        width: b.size + "px",
                        height: b.size + "px"
                    }}
                  >
                      {/* Highlight Glint */}
                      <div className="absolute top-[15%] left-[15%] w-[25%] h-[25%] rounded-full bg-white/80 blur-[0.5px]"></div>
                  </motion.div>
              ))}
          </div>
      )}

      {/* Decorative Floating Elements */}
      {decorative && (
          <>
            {!fullWidthImage && !decorativeImage && (
                <>
                    <motion.div 
                        animate={animateDecorative ? { y: [0, -10, 0], rotate: [0, 5, 0] } : {}}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="absolute left-[10%] md:left-[15%] top-[20%] text-brand-pink/20 pointer-events-none hidden md:block"
                    >
                        <Heart size={80} fill="currentColor" stroke="none" />
                    </motion.div>
                    <motion.div 
                        animate={animateDecorative ? { y: [0, 15, 0], scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 7, repeat: Infinity }}
                        className="absolute right-[10%] md:right-[15%] top-[25%] text-brand-pink/20 pointer-events-none hidden md:block"
                    >
                        <Sparkles size={100} />
                    </motion.div>
                </>
            )}
            
            {/* Elements for Advanced Protocol (Full Width Mode) */}
            {fullWidthImage && !decorativeImage && (
                <>
                    {/* Left Decorative Shapes (Always Static) */}
                    <div className="absolute left-[8%] md:left-[12%] top-[20%] text-brand-blue/20 pointer-events-none hidden md:block">
                        <Sparkles size={90} />
                    </div>
                    <div className="absolute left-[15%] md:left-[18%] top-[35%] text-brand-pink/10 pointer-events-none hidden md:block">
                        <Heart size={60} fill="currentColor" stroke="none" />
                    </div>

                    <motion.div 
                        animate={animateDecorative ? { y: [0, 15, 0], rotate: [0, -10, 0] } : {}}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-[8%] md:right-[12%] top-[20%] text-brand-blue/20 pointer-events-none hidden md:block"
                    >
                        <Heart size={90} fill="currentColor" stroke="none" />
                    </motion.div>
                </>
            )}
          </>
      )}

      {/* Background Media (Cover Mode) */}
      {mode === 'background' && (
        <div className="absolute inset-0 z-0">
           {videoSrc ? (
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                  <source src={videoSrc} type="video/mp4" />
              </video>
           ) : imageSrc ? (
              <div className="relative w-full h-full">
                  <Image 
                      src={imageSrc} 
                      alt={headline} 
                      fill 
                      className="object-cover md:object-center"
                      priority
                  />
              </div>
           ) : (
              <div className={`w-full h-full ${dark ? 'bg-black' : 'bg-gray-100'}`}></div>
           )}
           {overlay && <div className="absolute inset-0 bg-black/20"></div>}
        </div>
      )}

      {/* Content */}
      <div className={`relative z-20 w-full max-w-[1400px] mx-auto px-6 md:px-20 flex flex-col ${align === 'left' ? 'items-start text-left' : 'items-center text-center'} gap-1.5`}>
        {title && (
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 mb-2"
             >
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-brand-pink' : 'text-brand-pink'}`}>
                    {title}
                </span>
             </motion.div>
        )}
        
                <motion.h2 
        
                    initial={{ opacity: 0, scale: 0.98 }}
        
                    whileInView={{ opacity: 1, scale: 1 }}
        
                    viewport={{ once: true }}
        
                    transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        
                    className={`text-[42px] md:text-[52px] lg:text-[64px] tracking-[-0.02em] md:tracking-[-0.04em] leading-[1.05] mb-1 
                      ${headlineFontClass || 'font-bold'}
                      ${headlineColor && headlineColor.includes('bg-') ? 'text-transparent bg-clip-text ' + headlineColor : (headlineColor || (dark ? 'text-white' : 'text-brand-pink'))}
                    `}
        
                    style={{ paddingBottom: '0.05em' }} 
        
                >
        
                    {headline}
        
                </motion.h2>
        
        
        
                <motion.p 
        
                    initial={{ opacity: 0, y: 10 }}
        
                    whileInView={{ opacity: 1, y: 0 }}
        
                    viewport={{ once: true }}
        
                    transition={{ delay: 0.2, duration: 0.8 }}
        
                    className={`text-lg md:text-[20px] lg:text-[22px] font-medium mt-0 max-w-md md:max-w-2xl tracking-tight leading-[1.2] ${dark ? 'text-gray-200' : 'text-[#1d1d1f]'}`}
        
                >
        
                    {subheadline}
        
                </motion.p>

        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className={`flex flex-wrap ${align === 'left' ? 'justify-start' : 'justify-center'} items-center gap-6 mt-4`}
        >
            {primaryLink && (
                <Link href={primaryLink.href} className={`group flex items-center gap-1 text-[15px] md:text-[17px] font-medium hover:underline ${dark ? 'text-brand-pink' : 'text-[#0066CC]'}`}>
                    {primaryLink.text} <ChevronRight size={14} strokeWidth={3} className="mt-[1px] group-hover:translate-x-0.5 transition-transform" />
                </Link>
            )}
            {secondaryLink && (
                <Link href={secondaryLink.href} className={`group flex items-center gap-1 text-[15px] md:text-[17px] font-medium hover:underline ${dark ? 'text-brand-pink' : 'text-[#0066CC]'}`}>
                    {secondaryLink.text} <ChevronRight size={14} strokeWidth={3} className="mt-[1px] group-hover:translate-x-0.5 transition-transform" />
                </Link>
            )}
        </motion.div>
      </div>

      {/* Product Image (Product Mode) - Floats at bottom */}
      {mode === 'product' && imageSrc && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 1 }}
            className="absolute inset-0 w-full flex items-end justify-center z-10 pointer-events-none"
            style={{ transform: `translateX(${imageOffset}px)` }}
          >
              <div className={`relative w-full h-full ${fullWidthImage ? 'max-w-none' : 'max-w-7xl'} mx-auto`}>
                <Image 
                    src={imageSrc} 
                    alt={headline} 
                    fill 
                    className="object-contain object-bottom pt-48 md:pt-64"
                    priority
                />
              </div>
          </motion.div>
      )}
    </section>
  );
};

const GridUnit = ({ headline, subheadline, link, imageSrc, dark = false }) => {
    return (
        <div className="relative h-[580px] md:h-[620px] bg-[#FAF9F6] overflow-hidden flex flex-col items-center pt-12 md:pt-16 group cursor-pointer group">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-[1.02]">
                <Image src={imageSrc} alt={headline} fill className="object-cover" />
                {dark && <div className="absolute inset-0 bg-black/30"></div>}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center flex flex-col items-center px-8">
                <h3 className={`text-3xl md:text-4xl font-bold tracking-tight mb-2 ${dark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {headline}
                </h3>
                <p className={`text-lg md:text-xl font-normal mb-4 max-w-xs mx-auto ${dark ? 'text-gray-100' : 'text-[#1d1d1f]'}`}>
                    {subheadline}
                </p>
                {link && (
                     <div className="mt-4">
                        <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold tracking-tight transition-all duration-300 backdrop-blur-md border ${
                            dark 
                            ? 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-black' 
                            : 'bg-black/5 border-black/5 text-[#1d1d1f] hover:bg-black hover:text-white'
                        }`}>
                            {link.text} <ChevronRight size={14} strokeWidth={3} className="mt-[0.5px]" />
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
}

export default function AppleStyleHome() {
  const { setSubHeader } = useHeader();

  React.useEffect(() => {
    setSubHeader(<StoreCategoryNav />);
    return () => setSubHeader(null);
  }, [setSubHeader]);

  return (
    <div className="bg-white pb-4 relative">
      {/* Global Tactile Paper Grain Overlay - Removes 'flat' empty spaces */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      {/* HERO 1: Flagship / Newest */}
      <HeroUnit 
        title="New Arrival"
        headline="Signature."
        subheadline="The essence of biological beauty."
        primaryLink={{ text: "Learn more", href: "/new-arrivals" }}
        secondaryLink={{ text: "Buy", href: "/all-products" }}
        imageSrc="/Adobe Express - file (13)-Photoroom.png"
        dark={false}
        align="center"
        mode="product"
        decorative={true}
        aura={true}
        fullWidthImage={true}
      />

      {/* HERO 2: Skincare / Scientific */}
      <HeroUnit 
        title="Skincare"
        headline="Advanced Protocols."
        subheadline="Engineered for your skin's unique frequency."
        primaryLink={{ text: "Explore the science", href: "/SkinCare" }}
        secondaryLink={{ text: "Take the quiz", href: "/skin-quiz" }}
        imageSrc="/7943_1x1-2.png"
        dark={false}
        overlay={false}
        mode="product"
        decorative={true}
        align="center"
        fullWidthImage={true}
        headlineColor="text-[#1d1d1f]"
        bgClass="bg-gradient-to-b from-[#f5faff] to-white"
        bubbles={false}
        aura={true}
        animateDecorative={false}
      />

      {/* HERO 3: Fragrance */}
      <HeroUnit 
        title="Fragrance"
        headline="L'Essence de Lumière."
        subheadline="A journey through olfactory art."
        primaryLink={{ text: "Discover scents", href: "/fragrance" }}
        secondaryLink={{ text: "Find your signature", href: "/fragrance" }}
        imageSrc="/CalmingCapi_2_2x3 copie.png"
        dark={false}
        overlay={false}
        mode="product"
        decorative={true}
        aura={true}
        align="center"
        headlineColor="text-brand-pink"
        fullWidthImage={true}
        decorativeImage="/CalmingCapi_2_2x3 copieh.png"
        headlineFontClass="font-serif italic font-normal"
        imageOffset={40}
      />

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3 md:px-3 max-w-[2000px] mx-auto">
        <GridUnit 
            headline="Valentine's Day."
            subheadline="Gifts they'll adore."
            link={{ text: "Shop the guide", href: "/collections/valentines" }}
            imageSrc="/GerLift_3_4x5 copie.jpg"
            dark={false}
        />
        <GridUnit 
            headline="Anti-Aging Serums."
            subheadline="Turn back the clock."
            link={{ text: "Shop Serums", href: "/collections/anti-aging" }}
            imageSrc="/Argini+MyMyoso_2x3.jpg"
            dark={false}
        />
        <GridUnit 
            headline="Sales."
            subheadline="Exclusive seasonal reductions."
            link={{ text: "View offers", href: "/sales" }}
            imageSrc="/Adobe Express - file (8).png"
            dark={false}
        />
        <GridUnit 
            headline="AI Consultant."
            subheadline="Your personal beauty curator."
            link={{ text: "Start consultation", href: "#" }} // Could trigger modal if integrated
            imageSrc="/Adobe Express - file (9).png"
            dark={true}
        />
      </div>

      {/* TEXT CAROUSEL / BRANDING */}
      <section className="py-24 bg-white text-center px-6">
        <div className="max-w-3xl mx-auto space-y-8 flex flex-col items-center">
            <NayaLumiereLogo className="h-12 md:h-16 w-auto" />
            <p className="text-xl md:text-2xl font-medium text-gray-500 leading-relaxed">
                We believe in the intelligence of nature and the precision of science. 
                Our collections are designed to synchronize with your biology, 
                revealing the light that already exists within.
            </p>
        </div>
      </section>
    </div>
  );
}
