'use client';

import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';

const LAVENDER = 'rgb(147,104,236)';
const STORAGE_KEY = 'naya_corner_badge_dismissed';

/**
 * Persistent reminder of the same real WELCOME10 offer as PromoBar/WelcomePopup,
 * shown as a vertical tab docked to the right edge (clear of the mobile bottom
 * nav). Opens the same WelcomePopup on click (via onOpen, lifted to
 * LayoutContent.js) rather than duplicating the email-capture form — useful
 * for someone who dismissed the popup earlier without taking the code.
 */
export function WelcomeCornerBadge({ onOpen }) {
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
    <div
      className="fixed right-0 top-[60%] -translate-y-1/2 z-[120] flex flex-col items-center rounded-l-2xl shadow-lg overflow-hidden"
      style={{ background: LAVENDER, boxShadow: '-6px 8px 24px -8px rgba(147,104,236,0.55)' }}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss offer"
        className="w-full flex items-center justify-center py-1.5 text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X size={12} />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-col items-center gap-2 px-2.5 pb-4 pt-1 cursor-pointer"
      >
        <span
          className="text-white text-[11px] font-bold tracking-wide whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          GET 10% OFF
        </span>
        <Tag size={14} className="text-white" strokeWidth={2} />
      </button>
    </div>
  );
}
