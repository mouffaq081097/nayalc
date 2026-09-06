'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nl_recently_viewed';
const MAX_ITEMS = 12;

function readStore() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('nl:recently-viewed-change'));
  } catch {
    /* ignore quota errors */
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStore());
    setHydrated(true);

    const sync = () => setItems(readStore());
    window.addEventListener('storage', sync);
    window.addEventListener('nl:recently-viewed-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('nl:recently-viewed-change', sync);
    };
  }, []);

  const clear = useCallback(() => {
    writeStore([]);
    setItems([]);
  }, []);

  return { items, hydrated, clear };
}

export function trackRecentlyViewed(product) {
  if (typeof window === 'undefined' || !product || !product.id) return;
  const snapshot = {
    id: product.id,
    slug: product.slug || null,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice ?? product.comparedprice ?? null,
    imageUrl: product.imageUrl || (Array.isArray(product.images) ? product.images[0] : null) || null,
    brandName: product.brandName || product.brand || null,
    stock_quantity: product.stock_quantity ?? product.stockQuantity ?? null,
    averageRating: product.averageRating ?? null,
    reviewCount: product.reviewCount ?? null,
    viewedAt: Date.now(),
  };

  const existing = readStore();
  const filtered = existing.filter((p) => p.id !== snapshot.id);
  const next = [snapshot, ...filtered].slice(0, MAX_ITEMS);
  writeStore(next);
}
