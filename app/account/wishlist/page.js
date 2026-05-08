'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';

export default function AccountWishlistPage() {
  const { wishlistItems, isLoading } = useAccountData();
  const { addToCart } = useCart();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const handleAddToCart = (item) => {
    const product = {
      id: item.product_id || item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || item.image_url,
      stock_quantity: item.stock_quantity ?? item.stockQuantity ?? 99,
    };
    addToCart(product, 1);
    toast.success(`${item.name} added to bag`);
  };

  return (
    <AccountShell wishCount={wishCount}>
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">Your wishlist is empty.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {wishlistItems.map((w) => {
            const imgSrc = w.imageUrl || w.image_url || w.imageurl || null;
            const inStock = (w.stock_quantity ?? w.stockQuantity ?? 1) > 0;
            return (
              <div key={w.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-purple-200 transition-colors">
                <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center">
                  {imgSrc ? (
                    <Image src={imgSrc} alt={w.name} fill className="object-contain p-2" sizes="200px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart size={28} className="text-gray-300" />
                    </div>
                  )}
                  {!inStock && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <Link href={`/product/${w.product_id || w.id}`}>
                    <p className="text-[12px] font-medium text-gray-900 leading-snug hover:text-purple-700 transition-colors line-clamp-2">{w.name}</p>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[13px] font-semibold text-gray-900">AED {w.price}</span>
                    {inStock && (
                      <button
                        onClick={() => handleAddToCart(w)}
                        className="flex items-center gap-1 h-7 px-3 text-[10px] font-semibold text-white rounded-full"
                        style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                      >
                        <ShoppingBag size={10} />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
