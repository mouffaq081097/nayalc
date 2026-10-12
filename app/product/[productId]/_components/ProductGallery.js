'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { LAVENDER, BORDER, WELL } from './theme';

/**
 * Product gallery: vertical thumbnail rail on desktop, swipe + dots + a
 * horizontal thumbnail strip on mobile, and a full-screen lightbox with
 * keyboard navigation.
 */
export default function ProductGallery({ images, name, discountPct, badge }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;

  const go = (next) => setIndex(i => Math.min(count - 1, Math.max(0, typeof next === 'function' ? next(i) : next)));

  // A different product (client navigation) starts on its first image
  const firstImage = images[0];
  useEffect(() => { setIndex(0); }, [firstImage]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoomed(false);
      if (e.key === 'ArrowRight') go(i => i + 1);
      if (e.key === 'ArrowLeft') go(i => i - 1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [zoomed]);

  const onSwipe = (_, { offset }) => {
    if (offset.x < -50) go(i => i + 1);
    else if (offset.x > 50) go(i => i - 1);
  };

  return (
    <>
      <div className="flex gap-4">
        {/* Desktop thumbnail rail */}
        {count > 1 && (
          <div className="hidden md:flex flex-col gap-2.5 flex-shrink-0 w-[76px] max-h-[600px] overflow-y-auto pr-0.5">
            {images.map((img, i) => (
              <button key={i} onClick={() => go(i)} onMouseEnter={() => go(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={index === i}
                className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0"
                style={{ borderColor: index === i ? LAVENDER : 'transparent', background: WELL }}>
                <Image src={img} alt="" fill sizes="76px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div
            className="relative aspect-square rounded-2xl overflow-hidden cursor-zoom-in group"
            style={{ background: WELL }}
            onClick={() => setZoomed(true)}>

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
              {discountPct > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[12px] font-bold text-white shadow-sm" style={{ background: LAVENDER }}>
                  −{discountPct}%
                </span>
              )}
              {badge}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={index}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center p-8 md:p-12"
                drag={count > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
                onDragEnd={onSwipe}>
                {images[index] && (
                  <Image
                    src={images[index]}
                    alt={count > 1 ? `${name} — image ${index + 1} of ${count}` : name}
                    width={800} height={800} priority={index === 0}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="max-w-full max-h-full object-contain group-hover:scale-[1.04] transition-transform duration-500 pointer-events-none select-none"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Desktop arrows */}
            {count > 1 && (
              <>
                <ArrowButton side="left" disabled={index === 0} onClick={e => { e.stopPropagation(); go(i => i - 1); }} />
                <ArrowButton side="right" disabled={index === count - 1} onClick={e => { e.stopPropagation(); go(i => i + 1); }} />
              </>
            )}

            <span className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm"
              aria-hidden="true">
              <Maximize2 size={14} style={{ color: LAVENDER }} />
            </span>

            {/* Mobile dots */}
            {count > 1 && (
              <div className="md:hidden absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <span key={i} className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: index === i ? 18 : 6, background: index === i ? LAVENDER : 'rgba(17,24,39,0.15)' }} />
                ))}
              </div>
            )}
          </div>

          {/* Mobile thumbnail strip */}
          {count > 1 && (
            <div className="md:hidden flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => go(i)} aria-label={`Show image ${i + 1}`}
                  className="relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all"
                  style={{ borderColor: index === i ? LAVENDER : 'transparent', background: WELL }}>
                  <Image src={img} alt="" fill sizes="64px" className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-3 md:p-8"
            style={{ background: 'rgba(29,6,51,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setZoomed(false)}
            role="dialog" aria-modal="true" aria-label={`${name} images`}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl"
              style={{ width: 'min(860px, 96vw)', maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}>

              <button onClick={() => setZoomed(false)} aria-label="Close"
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center">
                <X size={16} className="text-gray-600" />
              </button>
              {count > 1 && (
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-white text-[11px] font-semibold tabular-nums" style={{ background: 'rgba(17,24,39,0.6)' }}>
                  {index + 1} / {count}
                </div>
              )}

              <div className="relative flex items-center justify-center" style={{ background: WELL, height: count > 1 ? 'min(70vh, 640px)' : 'min(80vh, 720px)' }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={index}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 flex items-center justify-center p-6 md:p-10"
                    drag={count > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
                    onDragEnd={onSwipe}>
                    {images[index] && (
                      <Image src={images[index]} alt={`${name} — image ${index + 1}`}
                        fill sizes="860px" className="object-contain p-6 md:p-10 pointer-events-none select-none" />
                    )}
                  </motion.div>
                </AnimatePresence>
                {count > 1 && (
                  <>
                    <ArrowButton side="left" always disabled={index === 0} onClick={() => go(i => i - 1)} />
                    <ArrowButton side="right" always disabled={index === count - 1} onClick={() => go(i => i + 1)} />
                  </>
                )}
              </div>

              {count > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t overflow-x-auto" style={{ borderColor: BORDER }}>
                  {images.map((img, i) => (
                    <button key={i} onClick={() => go(i)} aria-label={`Show image ${i + 1}`}
                      className="relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all"
                      style={{ borderColor: index === i ? LAVENDER : 'transparent', background: WELL }}>
                      <Image src={img} alt="" fill sizes="56px" className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ArrowButton({ side, disabled, onClick, always = false }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  // On the main image there is nowhere to go — hide it rather than fight hover opacity
  if (disabled && !always) return null;
  return (
    <button onClick={onClick} disabled={disabled} aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={`${always ? 'flex disabled:opacity-25' : 'hidden md:flex md:opacity-0 md:group-hover:opacity-100'} absolute ${side === 'left' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md items-center justify-center text-gray-600 hover:text-gray-900 transition-all`}>
      <Icon size={18} />
    </button>
  );
}
