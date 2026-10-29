'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { LAVENDER, BORDER, WELL } from './theme';
import { useLocale, useT } from '@/app/context/LocaleContext';

/**
 * Product gallery (phones and tablets): swipe + dots + a thumbnail strip, and
 * the full-screen Lightbox below on a tap.
 */
export default function ProductGallery({ images, name, discountPct, badge }) {
  const { t, dir } = useLocale();
  // Right to left, the next photo is the one to the left
  const sign = dir === 'rtl' ? -1 : 1;
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;

  const go = (next) => setIndex(i => Math.min(count - 1, Math.max(0, typeof next === 'function' ? next(i) : next)));

  // A different product (client navigation) starts on its first image
  const firstImage = images[0];
  useEffect(() => { setIndex(0); }, [firstImage]);

  const onSwipe = (_, { offset }) => {
    if (offset.x < -50) go(i => i + sign);
    else if (offset.x > 50) go(i => i - sign);
  };

  return (
    <>
      <div className="flex gap-4">
        {/* Desktop thumbnail rail */}
        {count > 1 && (
          <div className="hidden md:flex flex-col gap-2.5 flex-shrink-0 w-[76px] max-h-[600px] overflow-y-auto pe-0.5">
            {images.map((img, i) => (
              <button key={i} onClick={() => go(i)} onMouseEnter={() => go(i)}
                aria-label={t('Show image {n}', { n: i + 1 })}
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
            className="relative aspect-square lg:rounded-2xl overflow-hidden cursor-zoom-in group"
            style={{ background: WELL }}
            onClick={() => setZoomed(true)}>

            {/* Badges */}
            <div className="absolute top-4 start-4 z-10 flex flex-col items-start gap-2">
              {discountPct > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[12px] font-bold text-white shadow-sm" style={{ background: LAVENDER }} dir="ltr">
                  −{discountPct}%
                </span>
              )}
              {badge}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={index}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-3 md:p-6"
                drag={count > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
                onDragEnd={onSwipe}>
                {/* Fill the frame and fit inside it. Sizing from the file's own dimensions left
                    small uploads (often the lifestyle photos) as a little square mid-frame. */}
                {images[index] && (
                  <div className="relative w-full h-full">
                    <Image
                      src={images[index]}
                      alt={count > 1 ? t('{name} — image {n} of {count}', { name, n: index + 1, count }) : name}
                      fill priority={index === 0}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-contain group-hover:scale-[1.04] transition-transform duration-500 pointer-events-none select-none"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Desktop arrows */}
            {count > 1 && (
              <>
                <ArrowButton side="prev" disabled={index === 0} onClick={e => { e.stopPropagation(); go(i => i - 1); }} />
                <ArrowButton side="next" disabled={index === count - 1} onClick={e => { e.stopPropagation(); go(i => i + 1); }} />
              </>
            )}

            <span className="absolute top-4 end-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm"
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
            <div className="md:hidden flex gap-2 mt-2 overflow-x-auto pb-1 px-4">
              {images.map((img, i) => (
                <button key={i} onClick={() => go(i)} aria-label={t('Show image {n}', { n: i + 1 })}
                  className="relative w-16 h-16 overflow-hidden border-2 flex-shrink-0 transition-all"
                  style={{ borderColor: index === i ? LAVENDER : 'transparent', background: WELL }}>
                  <Image src={img} alt="" fill sizes="64px" className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Lightbox images={images} name={name} open={zoomed} index={index} onIndex={go} onClose={() => setZoomed(false)} />
    </>
  );
}

/**
 * The full-screen photo viewer: arrows, swipe, thumbnails, ← → and Esc. Used by
 * the phone gallery above and by the stacked photos on laptops (ProductClient).
 * `onIndex(n | fn)` moves to a photo; the owner keeps the index.
 */
export function Lightbox({ images, name, open, index, onIndex, onClose }) {
  const { t, dir } = useLocale();
  const sign = dir === 'rtl' ? -1 : 1;
  const count = images.length;
  // The latest callbacks, so the key listener isn't re-added on every render
  const actions = useRef({ onIndex, onClose });
  actions.current = { onIndex, onClose };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') actions.current.onClose();
      if (e.key === 'ArrowRight') actions.current.onIndex(i => i + sign);
      if (e.key === 'ArrowLeft') actions.current.onIndex(i => i - sign);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, sign]);

  const onSwipe = (_, { offset }) => {
    if (offset.x < -50) onIndex(i => i + sign);
    else if (offset.x > 50) onIndex(i => i - sign);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-3 md:p-8"
          style={{ background: 'rgba(17,17,20,0.78)' }}
          onClick={onClose}
          role="dialog" aria-modal="true" aria-label={t('{name} images', { name })}>
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="relative flex flex-col bg-white overflow-hidden shadow-2xl"
            style={{ width: 'min(960px, 96vw)', maxHeight: '94vh' }}
            onClick={e => e.stopPropagation()}>

            <button onClick={onClose} aria-label={t('Close')}
              className="absolute top-3 end-3 z-10 w-10 h-10 rounded-full bg-white hover:bg-[#f6f5f2] shadow flex items-center justify-center">
              <X size={17} className="text-[#111114]" />
            </button>
            {count > 1 && (
              <div className="absolute top-4 start-4 z-10 px-2.5 py-1 rounded-full text-white text-[11px] font-semibold tabular-nums bg-black/55">
                {index + 1} / {count}
              </div>
            )}

            <div className="relative flex items-center justify-center" style={{ background: WELL, height: count > 1 ? 'min(74vh, 720px)' : 'min(84vh, 800px)' }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={index}
                  initial={{ opacity: 0, x: 20 * sign }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 * sign }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0"
                  drag={count > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
                  onDragEnd={onSwipe}>
                  {images[index] && (
                    <Image src={images[index]} alt={t('{name} — image {n}', { name, n: index + 1 })}
                      fill sizes="(min-width: 1024px) 960px, 100vw" className="object-contain p-2 md:p-8 pointer-events-none select-none mix-blend-multiply" />
                  )}
                </motion.div>
              </AnimatePresence>
              {count > 1 && (
                <>
                  <ArrowButton side="prev" always disabled={index === 0} onClick={() => onIndex(i => i - 1)} />
                  <ArrowButton side="next" always disabled={index === count - 1} onClick={() => onIndex(i => i + 1)} />
                </>
              )}
            </div>

            {count > 1 && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-t overflow-x-auto" style={{ borderColor: BORDER }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => onIndex(i)} aria-label={t('Show image {n}', { n: i + 1 })} aria-current={index === i}
                    className="relative w-14 h-14 overflow-hidden border shrink-0 transition-colors"
                    style={{ borderColor: index === i ? '#111114' : 'transparent', background: WELL }}>
                    <Image src={img} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// `side` is "prev" (the start edge: left, or right in Arabic) or "next"
function ArrowButton({ side, disabled, onClick, always = false }) {
  const t = useT();
  const Icon = side === 'prev' ? ChevronLeft : ChevronRight;
  // On the main image there is nowhere to go — hide it rather than fight hover opacity
  if (disabled && !always) return null;
  return (
    <button onClick={onClick} disabled={disabled} aria-label={side === 'prev' ? t('Previous image') : t('Next image')}
      className={`${always ? 'flex disabled:opacity-25' : 'hidden md:flex md:opacity-0 md:group-hover:opacity-100'} absolute ${side === 'prev' ? 'start-3' : 'end-3'} top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md items-center justify-center text-gray-600 hover:text-gray-900 transition-all`}>
      <Icon size={18} className="flip-rtl" />
    </button>
  );
}
