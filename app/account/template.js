'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { getAccountNavDirection } from './_components/navDirection';

const easeLuxury = [0.16, 1, 0.3, 1];

export default function Template({ children }) {
  const pathname = usePathname();
  const direction = getAccountNavDirection();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: direction === 1 ? 28 : -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction === 1 ? -12 : 28, opacity: 0 }}
        transition={{ duration: 0.35, ease: easeLuxury }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

