'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Droplets, Sparkles } from 'lucide-react';
import { NayaLumiereLogo } from './Icons';

const RevealText = ({ children, className }) => {
    return (
        <div className={`overflow-hidden ${className}`}>
            <motion.div
                initial={{ y: "100%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export const BrandPhilosophy = () => {
  return (
    <section className="py-32 bg-white text-center px-6 overflow-hidden relative border-t border-gray-50">
      {/* Global Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>
      
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] border border-black/[0.02] rounded-full pointer-events-none"
      />
      
      <div className="max-w-4xl mx-auto space-y-12 flex flex-col items-center relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <NayaLumiereLogo className="h-16 w-auto opacity-90" />
          </motion.div>
          
          <div className="w-20 h-[1px] bg-brand-pink/20"></div>
          
          <div className="max-w-3xl">
            <RevealText>
                <h2 className="text-4xl md:text-6xl font-serif italic text-gray-900 leading-[1.15] tracking-tight">
                    "We do not create beauty. <br />
                    We help you <span className="text-brand-pink">remember</span> it."
                </h2>
            </RevealText>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl font-sans font-medium text-gray-400 max-w-2xl leading-relaxed"
          >
              Naya Lumière is the intersection of raw botanical intelligence and the precision of Swiss molecular science. A commitment to the purity of light.
          </motion.p>

          <div className="flex gap-10 md:gap-16 pt-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-3 group"
              >
                  <div className="w-12 h-12 rounded-full bg-brand-pink/5 flex items-center justify-center text-brand-pink/40 group-hover:text-brand-pink transition-colors duration-500 shadow-sm">
                    <Leaf size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-sans font-black uppercase tracking-[0.3em] text-gray-400">Organic Purity</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="flex flex-col items-center gap-3 group"
              >
                  <div className="w-12 h-12 rounded-full bg-brand-pink/5 flex items-center justify-center text-brand-pink/40 group-hover:text-brand-pink transition-colors duration-500 shadow-sm">
                    <Droplets size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-sans font-black uppercase tracking-[0.3em] text-gray-400">Vital Moisture</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center gap-3 group"
              >
                  <div className="w-12 h-12 rounded-full bg-brand-pink/5 flex items-center justify-center text-brand-pink/40 group-hover:text-brand-pink transition-colors duration-500 shadow-sm">
                    <Sparkles size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-sans font-black uppercase tracking-[0.3em] text-gray-400">Molecular Light</span>
              </motion.div>
          </div>
      </div>

      {/* Background Decorative Aura */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
        <div className="absolute top-[10%] -right-[5%] w-[30%] h-[30%] bg-brand-pink/[0.02] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] -left-[5%] w-[30%] h-[30%] bg-brand-blue/[0.02] rounded-full blur-[100px]"></div>
      </div>
    </section>
  );
};
