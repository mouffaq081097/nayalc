'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import CartSuggestionCard from './CartSuggestionCard';

const SHOW = 4;

// Mobile/tablet: swipeable snap rail bleeding to the screen edge. Desktop: 4-up grid.
const railClass =
  '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 sm:scroll-px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0';
const slotClass = 'w-[44%] shrink-0 snap-start sm:w-[200px] lg:w-auto';

function RailSkeleton() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-5 w-44 rounded bg-[#f1f1f4]" />
        <div className="h-3.5 w-32 rounded bg-[#f5f5f7]" />
      </div>
      <div className={`${railClass} overflow-hidden`}>
        {Array.from({ length: SHOW }).map((_, i) => (
          <div key={i} className={`${slotClass} overflow-hidden rounded-2xl border border-[#eeeef1]`}>
            <div className="aspect-square bg-[#f5f5f7]" />
            <div className="space-y-2 p-3">
              <div className="h-2.5 w-1/2 rounded bg-[#f1f1f4]" />
              <div className="h-3 w-4/5 rounded bg-[#f1f1f4]" />
              <div className="h-9 rounded-full bg-[#f5f5f7]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PairItWithSection({ currentCartItems }) {
  const { addToCart, closeCart } = useCart();
  const [products, setProducts] = useState(null); // null while loading
  // Snapshot of the bag when the section appeared: those products are hidden, but
  // anything added from here stays in place and flips to "In your bag" instead of vanishing.
  const [initialCartIds] = useState(() => new Set(currentCartItems.map(i => i.id)));

  useEffect(() => {
    let cancelled = false;
    // Over-fetch so there are still enough left after dropping what's already in the bag.
    fetch(`/api/products/suggestions?limit=${SHOW * 2}`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => { if (!cancelled) setProducts(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
  }, []);

  const cartIds = useMemo(() => new Set(currentCartItems.map(i => i.id)), [currentCartItems]);
  const visible = useMemo(
    () => (products || []).filter(p => !initialCartIds.has(p.id)).slice(0, SHOW),
    [products, initialCartIds]
  );

  if (products === null) return <RailSkeleton />;
  if (visible.length === 0) return null;

  const handleAdd = (product) => {
    addToCart({ ...product, stock_quantity: product.stockQuantity ?? product.stock_quantity }, 1);
    closeCart(); // already on the bag page — don't slide the drawer over it
  };

  return (
    <section aria-labelledby="also-like-heading">
      {/* The suggestions API returns random active products, so this is labelled as
          discovery rather than "frequently bought together". */}
      <div className="mb-4">
        <h2 id="also-like-heading" className="text-[18px] font-semibold text-[#111114]">You may also like</h2>
        <p className="mt-0.5 text-[13px] text-[#8a8a93]">More from our collection</p>
      </div>

      <ul className={railClass}>
        {visible.map(product => (
          <li key={product.id} className={slotClass}>
            <CartSuggestionCard product={product} inBag={cartIds.has(product.id)} onAdd={handleAdd} />
          </li>
        ))}
      </ul>
    </section>
  );
}
