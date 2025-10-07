'use client';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--brand-rose)] via-[var(--brand-cream)] to-[var(--brand-blue)] text-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <Rocket className="w-24 h-24 mx-auto mb-6 text-gray-800" />
        <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">Coming Soon!</h1>
        <p className="text-xl md:text-2xl text-center mb-8 max-w-2xl mx-auto font-light leading-relaxed text-gray-800 drop-shadow-md">
          We're launching something amazing to enhance your experience. Our app is currently under development and will be available shortly.
        </p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-lg font-medium text-gray-800 drop-shadow-md"
        >
          Stay tuned for updates!
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-8 text-sm text-gray-800 drop-shadow-sm"
      >
        Naya Lumiere Cosmetics keeping Parisian beauty
      </motion.div>
    </div>
  );
}