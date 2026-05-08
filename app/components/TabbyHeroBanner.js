"use client";
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function TabbyHeroBanner() {
  return (
    <section className="w-full py-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative rounded-3xl overflow-hidden"
        style={{ background: '#f0eff5' }}
      >

        {/* ── Blobs ── */}
        <div className="absolute pointer-events-none" style={{
          width: 340, height: 300, top: -80, left: -60,
          borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%',
          background: 'rgba(61,255,160,0.55)', filter: 'blur(2px)',
        }} />
        <div className="absolute pointer-events-none" style={{
          width: 200, height: 200, bottom: -60, right: 180,
          borderRadius: '45% 55% 40% 60% / 55% 45% 60% 40%',
          background: 'rgba(61,255,160,0.35)', filter: 'blur(2px)',
        }} />
        <div className="absolute pointer-events-none" style={{
          width: 130, height: 130, top: 20, right: 30,
          borderRadius: '50%',
          background: 'rgba(61,255,160,0.18)', filter: 'blur(1px)',
        }} />

        {/* ── Decorative wavy lines ── */}
        <svg className="absolute pointer-events-none hidden sm:block"
          style={{ right: 0, top: 0, height: '100%', width: 260, opacity: 0.13 }}
          viewBox="0 0 260 380" preserveAspectRatio="none"
        >
          <path d="M260 0 Q180 95 220 190 Q260 285 180 380" stroke="#1a1a1a" strokeWidth="1.2" fill="none" />
          <path d="M260 40 Q190 120 230 210 Q270 300 200 380" stroke="#1a1a1a" strokeWidth="0.8" fill="none" />
          <path d="M260 80 Q200 150 240 235 Q280 320 220 380" stroke="#1a1a1a" strokeWidth="0.6" fill="none" />
        </svg>

        {/* ── MOBILE layout (< sm): stacked ── */}
        <div className="flex sm:hidden flex-col relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2 pt-5 px-6 z-20">
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/tabby-logo-charcoal.png" alt="Tabby" width={96} height={96} className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Product image */}
          <div className="relative w-full" style={{ height: 300 }}>
            <Image
              src="/tabby-product.png"
              alt="Shop with Tabby"
              fill
              className="object-contain scale-150 -translate-y-29"
              style={{ objectPosition: 'center top' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Copy */}
          <div className="px-6 pb-8 pt-2 flex flex-col gap-2">
            <h2 className="font-black uppercase leading-tight text-[28px]" style={{ color: '#00b67a', letterSpacing: '-0.01em' }}>
              Shop luxury
            </h2>
            <h2 className="font-black uppercase leading-tight text-[28px]" style={{ color: '#0d0d0d', letterSpacing: '-0.01em' }}>
              and pay in up to 4 months
            </h2>
            <p className="text-[14px] leading-snug mt-1" style={{ color: 'rgba(13,13,13,0.45)' }}>
              Tabby makes payments effortless
            </p>
          </div>
        </div>

        {/* ── DESKTOP layout (sm+): side by side ── */}
        <div className="hidden sm:flex items-stretch relative z-10" style={{ height: 380 }}>

          {/* Logo — absolute over left panel */}
          <div className="absolute top-5 left-7 z-20 flex items-center gap-2">
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/tabby-logo-charcoal.png" alt="Tabby" width={96} height={96} className="w-full h-full object-contain" />
            </div>
          </div>

          {/* LEFT — product image */}
          <div className="relative flex-[0_0_58%] overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, transparent, #f0eff5)' }} />
            <div className="relative w-full h-full" style={{ position: 'absolute', inset: 0 }}>
              <Image
                src="/tabby-product.png"
                alt="Shop with Tabby"
                fill
                className="object-contain"
                style={{ objectPosition: 'center 100%', transform: 'scale(1.25)', transformOrigin: 'center 100%' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          {/* RIGHT — copy */}
          <div className="flex-1 flex flex-col justify-center px-6 lg:px-10 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <h2 className="font-black uppercase leading-tight"
                style={{ fontSize: 'clamp(26px, 3.2vw, 44px)', color: '#00b67a', letterSpacing: '-0.01em' }}>
                Shop luxury
              </h2>
              <h2 className="font-black uppercase leading-tight"
                style={{ fontSize: 'clamp(26px, 3.2vw, 44px)', color: '#0d0d0d', letterSpacing: '-0.01em' }}>
                and pay in up to<br />4 months
              </h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-[15px] leading-snug"
              style={{ color: 'rgba(13,13,13,0.45)', maxWidth: 280 }}
            >
              Tabby makes payments effortless
            </motion.p>
          </div>
        </div>

      </motion.div>
    </section>
  );
}
