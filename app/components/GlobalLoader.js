'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const LoaderSpinner = ({ size = "md", className = "" }) => {
  const sizes = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const dim = sizes[size] || sizes.md;

  return (
    <div className={`relative ${dim} ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-purple-100 border-t-purple-500"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[15%] rounded-full border border-purple-50 border-b-purple-300"
      />
    </div>
  );
};

const GlobalLoader = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fdf8ff]/90 backdrop-blur-xl"
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
              className="absolute inset-[-40px] rounded-full bg-gradient-to-tr from-purple-200/30 to-rose-200/20 blur-3xl"
            />
            
            {/* Central Content */}
            <div className="relative flex flex-col items-center gap-10">
              <div className="relative flex items-center justify-center">
                <LoaderSpinner size="xl" />
                <Sparkles className="absolute text-purple-300 w-8 h-8 animate-pulse" strokeWidth={1} />
              </div>

              <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-serif italic text-cl-deep">
                  Naya Lumière
                </h2>
                <div className="flex gap-2">
                   {[0, 0.2, 0.4].map((delay, i) => (
                     <motion.div 
                       key={i}
                       animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                       transition={{ duration: 1, repeat: Infinity, delay }}
                       className="w-1.5 h-1.5 rounded-full bg-purple-400" 
                     />
                   ))}
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
