'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import AiConsultant from './AiConsultant';

export default function StoreHeader({ title = "Store.", subtitle = "The definitive collection of luxury beauty and curated masterpieces." }) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  // Split title to style the dot if it exists
  const titleText = title.endsWith('.') ? title.slice(0, -1) : title;
  const hasDot = title.endsWith('.');

  return (
    <section className="relative pt-24 pb-16 px-6 md:px-10 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
        
        {/* Left Side: Big Bold Title */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-shrink-0 relative z-10"
        >
            <h1 className="text-6xl md:text-7xl lg:text-[90px] font-bold tracking-tighter text-[#1d1d1f] leading-none">
                {titleText}
                {hasDot && <span className="text-gray-400">.</span>}
            </h1>
        </motion.div>

        {/* Right Side: Subtitle & Context */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="flex flex-col items-start lg:items-end lg:text-right max-w-xl pt-2 lg:pt-4 relative z-10"
        >
            {/* Heart & Title Block */}
            <div className="flex flex-col lg:items-end gap-3">
                 <h2 className="text-2xl md:text-3xl lg:text-[28px] font-semibold text-[#1d1d1f] leading-[1.15] tracking-tight">
                    <span className="text-brand-pink inline-block mr-2 lg:mr-0 lg:ml-2">
                        {subtitle}
                    </span>
                 </h2>
                 
                 <div className="flex items-center gap-2 mt-1 group cursor-pointer" onClick={() => setIsAiOpen(true)}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center group-hover:bg-brand-pink group-hover:text-white transition-all duration-500"
                    >
                         <Sparkles size={18} />
                    </motion.div>
                    <p className="text-gray-500 font-medium text-lg group-hover:text-brand-pink transition-colors">
                        Consult AI Specialist <span className="text-brand-pink ml-1 text-xl group-hover:translate-x-1 inline-block transition-transform">›</span>
                    </p>
                 </div>
            </div>
        </motion.div>
      </div>

      <AiConsultant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </section>
  );
}