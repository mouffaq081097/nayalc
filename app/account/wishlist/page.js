'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';
import ProductCard from '../../components/ProductCard';

export default function AccountWishlistPage() {
  const { wishlistItems, isLoading } = useAccountData();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(wishlistItems || []);
  }, [wishlistItems]);

  const wishCount = items.length;

  const handleWishlistChange = (productId, stillWishlisted) => {
    if (!stillWishlisted) {
      setItems(prev => prev.filter(i => i.productId !== productId));
    }
  };

  return (
    <AccountShell wishCount={wishCount}>
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-gray-300 mb-4">
            <Heart size={20} />
          </div>
          <p className="text-gray-400 text-sm mb-4">Your wishlist is empty.</p>
          <Link
            href="/all-products"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-purple-600 hover:underline"
          >
            Explore products <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {items.map((w) => (
            <ProductCard
              key={w.productId}
              id={w.productId}
              name={w.name}
              price={w.price}
              image={w.imageUrl}
              brandName={w.brandName}
              stock_quantity={w.stockQuantity}
              description={w.description}
              initialWishlisted
              onWishlistChange={handleWishlistChange}
            />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
