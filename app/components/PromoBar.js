'use client';

import Link from 'next/link';
import { Tag, Truck, ChevronRight } from 'lucide-react';

/**
 * Real welcome coupon (see WelcomePopup.js / the WELCOME10 row in the coupons
 * table) and the real shipping tiers (lib/shipping.js SHIPPING_TIERS) — not
 * invented numbers. Its own fixed strip, independent of the header (see
 * PROMO_BAR_H, which the header/account sidebar offset around rather than
 * this bar depending on them).
 */
export const PROMO_BAR_H = 40;

export function PromoBar() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[160] flex items-center justify-center gap-3 sm:gap-7 px-3 overflow-x-auto whitespace-nowrap"
      style={{
        height: PROMO_BAR_H,
        background: 'linear-gradient(90deg, #3b0764 0%, #4c0f8a 100%)',
        boxShadow: '0 2px 10px -2px rgba(0,0,0,0.25)',
      }}
    >
      <Link
        href="/all-products"
        className="group flex-shrink-0 flex items-center gap-1.5 rounded-full pl-3.5 pr-2.5 py-[7px] text-[11.5px] font-bold text-white transition-all hover:brightness-110"
        style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.22)' }}
      >
        <Tag size={12} className="flex-shrink-0 opacity-90" />
        <span>
          Use code <span className="tracking-wide">WELCOME10</span> for 10% off
        </span>
        <ChevronRight size={13} className="flex-shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <span className="hidden sm:flex flex-shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-white/80">
        <span className="w-px h-3.5 bg-white/20 mr-1" aria-hidden="true" />
        <Truck size={13} className="flex-shrink-0" />
        AED 20 for 1 item &middot; AED 10 for 2 &middot; Free shipping on 3+
      </span>
    </div>
  );
}
