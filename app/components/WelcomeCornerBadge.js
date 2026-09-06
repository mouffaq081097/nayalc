'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const LAVENDER = 'rgb(147,104,236)';
const STORAGE_KEY = 'naya_corner_badge_dismissed';

/**
 * Persistent bottom-left reminder of the same real WELCOME10 offer as
 * PromoBar/WelcomePopup. Opens the same WelcomePopup on click (via onOpen,
 * lifted to LayoutContent.js) rather than duplicating the email-capture form —
 * useful for someone who dismissed the popup earlier without taking the code.
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

  const handleDismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
  };

  return (
    <div
      className="fixed bottom-5 left-5 z-[170] flex items-center rounded-full shadow-lg"
      style={{ background: LAVENDER, boxShadow: '0 10px 28px -8px rgba(147,104,236,0.65)' }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="pl-4 pr-1.5 py-3 text-white text-[13px] font-bold whitespace-nowrap cursor-pointer"
      >
        Get 10% off your first order
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss offer"
        className="flex-shrink-0 w-7 h-7 mr-1.5 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
