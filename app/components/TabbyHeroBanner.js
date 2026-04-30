"use client";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function TabbyHeroBanner() {
  const router = useRouter();

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-6xl mx-auto relative rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row"
        style={{ minHeight: 360, background: '#2a1060' }}
      >

        {/* ── LEFT — green blob ─────────────────────────────────── */}
        <div className="relative flex-1 flex items-center justify-center p-10 md:p-14 overflow-hidden z-10 min-h-[320px] md:min-h-0">

          {/* Blob shape */}
          <motion.div
            animate={{ borderRadius: [
              '56% 44% 38% 62% / 44% 56% 62% 38%',
              '44% 56% 62% 38% / 56% 44% 38% 62%',
              '56% 44% 38% 62% / 44% 56% 62% 38%',
            ]}}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-3 md:inset-5"
            style={{ background: '#3DFFA0' }}
          />

          {/* Content on top of blob */}
          <div className="relative z-10 w-full max-w-xs flex flex-col gap-4">

            {/* tabby logo + wordmark */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
                <Image src="/0x0.png" alt="Tabby" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <span className="text-[20px] font-black tracking-tight" style={{ color: '#1A1A2E' }}>tabby</span>
            </div>

            {/* Headline */}
            <h2 className="text-[42px] md:text-[50px] font-black leading-[1.02] tracking-tight" style={{ color: '#1A1A2E' }}>
              Pay in 4.<br />Shop Beauty.
            </h2>

            {/* Sub */}
            <p className="text-[15px] font-semibold" style={{ color: 'rgba(26,26,46,0.6)' }}>
              No interest. No fees.
            </p>

            {/* CTA */}
            <button
              onClick={() => router.push('/all-products')}
              className="mt-1 w-fit px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-[0.18em] transition-all hover:scale-105 active:scale-95"
              style={{ background: '#1A1A2E', color: '#3DFFA0' }}
            >
              Shop Now
            </button>

          </div>
        </div>

        {/* ── RIGHT — purple luxury backdrop ────────────────────── */}
        <div className="relative flex-1 overflow-hidden min-h-[260px] md:min-h-0">

          {/* Purple velvet gradient */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(145deg, #6d28d9 0%, #4c1d95 45%, #2d1b69 100%)' }}
          />

          {/* Fabric texture overlay */}
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)' }}
          />

          {/* Glow orbs */}
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 rounded-full blur-[80px]" style={{ background: 'rgba(109,40,217,0.6)' }} />
          <div className="absolute bottom-[-10%] left-[10%] w-56 h-56 rounded-full blur-[70px]" style={{ background: 'rgba(61,255,160,0.12)' }} />

          {/* Product image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="https://res.cloudinary.com/dhjmoqu2n/image/upload/fl_preserve_transparency/v1777533776/Glyco_1x1_gxvxsq.jpg?_s=public-apps"
              alt="Naya Lumière Products"
              fill
              className="object-cover object-center"
              
            />        
          </div>

          {/* Tabby green accent stripe at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[6px]" style={{ background: '#3DFFA0' }} />

          {/* "4 installments" badge — bottom right of image */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-10 right-8 px-4 py-2.5 rounded-2xl"
            style={{ background: '#3DFFA0', boxShadow: '0 8px 24px rgba(61,255,160,0.4)' }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(26,26,46,0.6)' }}>Split into</p>
            <p className="text-[22px] font-black leading-none" style={{ color: '#1A1A2E' }}>4×</p>
            <p className="text-[9px] font-bold" style={{ color: 'rgba(26,26,46,0.55)' }}>interest-free</p>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
}
