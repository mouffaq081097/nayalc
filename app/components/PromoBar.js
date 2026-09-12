'use client';

import Link from 'next/link';
import { Tag, Truck, ChevronRight, MapPin } from 'lucide-react';
import { SharePanel } from './SharePanel';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';

/**
 * Real welcome coupon (see WelcomePopup.js / the WELCOME10 row in the coupons
 * table) and the real shipping tiers (lib/shipping.js SHIPPING_TIERS) — not
 * invented numbers. Its own fixed strip, independent of the header (see
 * PROMO_BAR_H, which the header/account sidebar offset around rather than
 * this bar depending on them).
 */
export const PROMO_BAR_H = 40;

export function PromoBar() {
  const { isAuthenticated } = useAuth();
  const { shippingAddresses } = useUser();

  const defaultAddress =
    shippingAddresses.find((addr) => addr.is_default) || shippingAddresses[0] || null;
  const deliveryLabel = defaultAddress
    ? [defaultAddress.city, defaultAddress.country].filter(Boolean).join(', ')
    : 'United Arab Emirates';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[160] flex items-center gap-2 pl-3 pr-2"
      style={{
        height: PROMO_BAR_H,
        background: 'linear-gradient(90deg, #3b0764 0%, #4c0f8a 100%)',
        boxShadow: '0 2px 10px -2px rgba(0,0,0,0.25)',
      }}
    >
      <Link
        href={isAuthenticated ? '/account/addresses' : '/auth'}
        className="group hidden sm:flex flex-shrink-0 items-center gap-1.5 rounded-full pl-3 pr-2.5 py-[7px] text-[11.5px] font-medium text-white/85 transition-all hover:bg-white/10"
        style={{ border: '1px solid rgba(255,255,255,0.18)' }}
        title={defaultAddress ? 'Change delivery location' : 'Set your delivery location'}
      >
        <MapPin size={12} className="flex-shrink-0 opacity-90" />
        <span className="max-w-[160px] truncate">
          Deliver to <span className="font-bold text-white">{deliveryLabel}</span>
        </span>
        <ChevronRight size={13} className="flex-shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <span className="hidden sm:block w-px h-4 bg-white/20 flex-shrink-0" aria-hidden="true" />

      <div className="flex-1 min-w-0 flex items-center justify-center gap-3 sm:gap-7 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      <span className="hidden sm:block w-px h-4 bg-white/20 flex-shrink-0" aria-hidden="true" />
      <SharePanel />
    </div>
  );
}
