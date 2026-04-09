'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 16px rgba(147,51,234,0.06)',
};

export default function AccountWishlistPage() {
  const { wishlistItems } = useAccountData();
  const { addToCart } = useCart();

  return (
    <>
      <AccountMobileTopBar title="Wishlist" />
      <div className="px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <AccountSectionTitle
            eyebrow="Account"
            title="Wishlist"
            subtitle="Saved pieces you love."
          />

          {wishlistItems.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ ...glass, border: '1.5px dashed rgba(216,180,254,0.5)' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)' }}>
                <Heart size={24} strokeWidth={1.5} style={{ color: 'rgba(147,51,234,0.4)' }} />
              </div>
              <p className="text-base font-bold mb-1" style={{ color: '#3b0764' }}>Wishlist is empty</p>
              <p className="text-sm" style={{ color: 'rgba(59,7,100,0.45)' }}>
                Tap the heart on any product to save it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {wishlistItems.map((item, index) => (
                <div
                  key={item.id || `wish-${index}`}
                  className="overflow-hidden rounded-2xl"
                  style={glass}
                >
                  {/* Image */}
                  <div className="relative aspect-square p-4" style={{ background: 'var(--cl-bg-lavender)' }}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name || 'Wishlist item'}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 640px) 45vw, 200px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart size={32} strokeWidth={1} style={{ color: 'rgba(196,167,254,0.5)' }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgb(147,51,234)' }}>
                      {item.brandName || 'Naya Lumière'}
                    </p>
                    <p className="text-[12px] font-bold leading-snug line-clamp-2" style={{ color: '#3b0764' }}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(216,180,254,0.3)' }}>
                      <p className="text-[13px] font-black" style={{ color: '#3b0764' }}>
                        AED {item.price}
                      </p>
                      <button
                        onClick={() => addToCart(item, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' }}
                      >
                        <ShoppingBag size={13} />
                      </button>
                    </div>
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
