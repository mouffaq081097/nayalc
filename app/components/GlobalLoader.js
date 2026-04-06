'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const GlobalLoader = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-2xl"
        >
          {/* Paper Grain Effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          
          <div className="relative">
            {/* Pulsing Aura */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-[-20px] rounded-full bg-gradient-to-tr from-brand-pink/20 to-brand-blue/20 blur-2xl"
            />
            
            {/* Central Spinner */}
            <div className="relative flex flex-col items-center gap-8">
              <div className="w-24 h-24 relative flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-brand-pink/10 border-t-brand-pink"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border border-brand-blue/10 border-b-brand-blue"
                />
                <Sparkles className="text-brand-pink/40 w-8 h-8 animate-pulse" />
              </div>

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-[11px] font-black tracking-[0.6em] text-gray-900 ml-[0.6em]">
                  Naya Lumière
                </h2>
                <div className="flex gap-1.5 mt-2">
                   <motion.div 
                     animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                     transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                     className="w-1 h-1 rounded-full bg-brand-pink" 
                   />
                   <motion.div 
                     animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                     transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                     className="w-1 h-1 rounded-full bg-brand-pink" 
                   />
                   <motion.div 
                     animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                     transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                     className="w-1 h-1 rounded-full bg-brand-pink" 
                   />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
