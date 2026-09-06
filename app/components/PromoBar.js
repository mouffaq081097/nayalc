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
export const PROMO_BAR_H = 36;

export function PromoBar() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[160] flex items-center justify-center gap-3 sm:gap-6 px-3 overflow-x-auto whitespace-nowrap"
      style={{ height: PROMO_BAR_H, background: '#3b0764' }}
    >
      <Link
        href="/all-products"
        className="flex-shrink-0 flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1 text-[11px] font-bold text-white transition-colors hover:opacity-90"
        style={{ background: 'rgba(255,255,255,0.14)' }}
      >
        <Tag size={12} className="flex-shrink-0" />
        Use code <span className="tracking-wide">WELCOME10</span> for 10% off
        <ChevronRight size={13} className="flex-shrink-0 opacity-70" />
      </Link>

      <span className="hidden sm:flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-white/85">
        <Truck size={13} className="flex-shrink-0" />
        AED 20 for 1 item &middot; AED 10 for 2 &middot; Free shipping on 3+
      </span>
    </div>
  );
}
