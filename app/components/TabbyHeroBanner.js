"use client";
import { motion } from 'framer-motion';

export default function TabbyHeroBanner() {
  return (
    <section className="w-full py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Screenshot 2026-06-02 144628.png"
            alt="Shop GERnétic skincare with Tabby — split into 4 interest-free payments"
            className="w-full h-auto hidden md:block"
          />
        </motion.div>
      </div>
    </section>
  );
}
