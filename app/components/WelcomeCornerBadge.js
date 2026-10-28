'use client';

import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

const LAVENDER = 'rgb(147,104,236)';
const STORAGE_KEY = 'naya_corner_badge_dismissed';

/**
 * Persistent reminder of the same real WELCOME10 offer as WelcomePopup,
 * shown as a vertical tab docked to the end edge (right; left in Arabic). Opens the same WelcomePopup on click (via onOpen, lifted to
 * LayoutContent.js) rather than duplicating the email-capture form — useful
 * for someone who dismissed the popup earlier without taking the code.
 */
export function WelcomeCornerBadge({ onOpen }) {
  const { t, dir } = useLocale();
  const [hidden, setHidden] = useState(true); // stay hidden until localStorage check resolves, to avoid a flash

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setHidden(false);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
  };

  return (
    // Phones: a short "10%" tab low on the edge, so it doesn't
    // sit over the hero copy and product cards mid-screen. Desktop: the full tab, mid-edge.
    <div
      className="fixed end-0 bottom-[96px] md:bottom-auto md:top-[60%] md:-translate-y-1/2 z-[120] flex flex-col items-center rounded-s-2xl shadow-lg overflow-hidden"
      style={{ background: LAVENDER, boxShadow: `${dir === 'rtl' ? 6 : -6}px 8px 24px -8px rgba(147,104,236,0.55)` }}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('Dismiss offer')}
        className="w-full flex items-center justify-center py-1.5 text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X size={12} />
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('Get 10% off your first order')}
        className="flex flex-col items-center gap-1.5 md:gap-2 px-2 md:px-2.5 pb-3 md:pb-4 pt-1 cursor-pointer"
      >
        <span
          className="text-white text-[11px] font-bold tracking-wide whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span className="md:hidden">{t('10% OFF')}</span>
          <span className="hidden md:inline">{t('GET 10% OFF')}</span>
        </span>
        <Tag size={14} className="text-white" strokeWidth={2} />
      </button>
    </div>
  );
}
