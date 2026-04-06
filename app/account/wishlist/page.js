'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Heart } from 'lucide-react';
import Image from 'next/image';

export default function AccountWishlistPage() {
  const { wishlistItems } = useAccountData();

  return (
    <>
      <AccountMobileTopBar title="Wishlist" />
      <div className="px-4 pb-28 pt-6 md:px-6 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-2xl md:max-w-[1400px]">
          <AccountSectionTitle
            eyebrow="Account"
            title="Wishlist"
            subtitle="Saved pieces you might return to."
          />

          {wishlistItems.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/80 p-10 text-center shadow-sm backdrop-blur-xl">
              <Heart size={40} strokeWidth={1.25} className="mx-auto text-black/20" />
              <p className="mt-4 text-sm font-semibold text-[#1d1d1f]">No saved items.</p>
              <p className="mt-2 text-sm text-neutral-600">
                Tap the heart on a product to save it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems.map((item, index) => (
                <div
                  key={item.id || `wish-${index}`}
                  className="overflow-hidden rounded-[var(--radius-card)] border border-black/[0.06] bg-white/85 shadow-sm backdrop-blur-xl"
                >
                  <div className="relative aspect-square bg-black/[0.02] p-6">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name || 'Wishlist item'}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 92vw, 320px"
                      />
                    ) : null}
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-pink">
                      {item.brandName || 'Naya Lumière'}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] font-semibold tracking-tight text-[#1d1d1f]">
                      {item.name}
                    </p>
                    <p className="mt-3 text-[13px] font-semibold text-[#1d1d1f]">
                      AED {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

