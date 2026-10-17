'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AccountPage, { SOLID_PILL, Spinner } from '../_components/AccountPage';
import { useAccountData } from '../_components/useAccountData';
import ProductCard from '../../components/ProductCard';

/** Wishlist (after Pitaka): the account page frame over a grid of ProductCards */
export default function AccountWishlistPage() {
  const { wishlistItems, isLoading } = useAccountData();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(wishlistItems || []);
  }, [wishlistItems]);

  const handleWishlistChange = (productId, stillWishlisted) => {
    if (!stillWishlisted) {
      setItems(prev => prev.filter(i => i.productId !== productId));
    }
  };

  return (
    <AccountPage
      title="Your wishlist"
      subtitle={items.length > 0 ? `${items.length} saved product${items.length === 1 ? '' : 's'}` : undefined}
    >
      {isLoading ? <Spinner /> : items.length === 0 ? (
        <div className="mt-8 rounded-md bg-[#f6f5f2] py-14 px-6 text-center">
          <p className="text-[16px]">Your wishlist is empty.</p>
          <p className="mt-1 text-[14px] text-[#6b6b72]">Tap the heart on any product to save it here.</p>
          <Link href="/all-products" className={`${SOLID_PILL} mt-6`}>Explore products</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
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
    </AccountPage>
  );
}
