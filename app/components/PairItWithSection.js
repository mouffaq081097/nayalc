'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import CartSuggestionCarousel from './CartSuggestionCarousel';
import { orderableQty } from '@/lib/backorderRules';

const SHOW = 8;

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

function PanelSkeleton() {
  return <div aria-hidden="true" className="h-[176px] rounded-xl bg-[#f5f5f5] motion-safe:animate-pulse" />;
}

/** "You may also like" under the bag: one suggestion at a time, for products not already in it. */
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

  if (products === null) return <PanelSkeleton />;
  if (visible.length === 0) return null;

  // The suggestions API returns random active products, so this is labelled as
  // discovery rather than "frequently bought together".
  return <CartSuggestionCarousel id="also-like" title="You may also like" products={visible} />;
}
