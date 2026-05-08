'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { getAccountNavDirection } from './_components/navDirection';

export default function Template({ children }) {
  const pathname  = usePathname();
  const direction = getAccountNavDirection();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: direction === 1 ? '100%' : '-30%', opacity: direction === 1 ? 1 : 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction === 1 ? '-30%' : '100%', opacity: direction === 1 ? 0.6 : 1 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
