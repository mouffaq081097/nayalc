'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { HomeProductCard } from './home/HomeProductCard';
import { headingFont } from './home/SectionHeading';
import { orderableQty } from '@/lib/backorderRules';

const SHOW = 4;

/**
 * The live product (price, stock, views, photos) for an id from a smaller API
 * payload, so the bag page's cards match the homepage's exactly. Falls back to
 * the payload itself, normalised to the field names HomeProductCard reads.
 */
export function toCardProduct(p, products) {
  const live = (products || []).find((x) => Number(x.id) === Number(p.id));
  if (live) return live;
  return {
    ...p,
    imageUrl: p.imageUrl || p.image,
    brandName: p.brandName || p.brand,
    stock_quantity: p.stockQuantity ?? p.stock_quantity,
    originalPrice: p.originalPrice ?? (p.comparedprice ? Number(p.comparedprice) : null),
  };
}

// Two across on phones (2 × 2), three across from md up — the bag column is narrower than the homepage
export const cardGrid = 'grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4';

function GridSkeleton() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="mb-5 h-6 w-48 bg-[#f6f5f2]" />
      <div className={cardGrid}>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-[#f6f5f2]" />)}
      </div>
    </div>
  );
}

/** "You may also like" under the bag: homepage product cards for a few products not already in it. */
export default function PairItWithSection({ currentCartItems }) {
  const { products: catalogue } = useAppContext();
  const [products, setProducts] = useState(null); // null while loading
  // Snapshot of the bag when the section appeared: those products are hidden, but
  // anything added from here stays in place instead of vanishing.
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

  const visible = useMemo(
    // Like the homepage rows: only things that can be bought now (in stock or open for pre-order)
    () => (products || []).filter(p => !initialCartIds.has(p.id)).map(p => toCardProduct(p, catalogue)).filter(p => orderableQty(p) > 0).slice(0, SHOW),
    [products, initialCartIds, catalogue]
  );

  if (products === null) return <GridSkeleton />;
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="also-like-heading">
      {/* The suggestions API returns random active products, so this is labelled as
          discovery rather than "frequently bought together". */}
      <h2 id="also-like-heading" className={`${headingFont} mb-5 text-[20px] md:text-[24px] font-medium uppercase text-[#111114]`}>
        You may also like
      </h2>
      <div className={cardGrid}>
        {visible.map((product, i) => (
          // Four on phones (2 × 2), three from md up
          <div key={product.id} className={i === 3 ? 'md:hidden' : undefined}>
            <HomeProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
