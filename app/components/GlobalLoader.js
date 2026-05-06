'use client';
import { AnimatePresence, motion } from 'framer-motion';

export const LoaderSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { xs: 'w-4 h-4', sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16', xl: 'w-24 h-24' };
  return (
    <div className={`${sizes[size] || sizes.md} rounded-full animate-spin border-[3px] border-purple-100 border-t-[#8b5cf6] ${className}`} />
  );
};

const GlobalLoader = ({ isLoading }) => (
  <AnimatePresence>
    {isLoading && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm"
      >
        <LoaderSpinner size="md" />
      </motion.div>
    )}
  </AnimatePresence>
);

export default GlobalLoader;
