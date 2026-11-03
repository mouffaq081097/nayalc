'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAppContext } from '../context/AppContext';

/**
 * Opens /cart?restore=12x1.34x2&code=SPRING5 from a bag reminder email
 * (lib/cartReminders.js): puts back any of those items that aren't in the bag
 * already (this device may have an empty bag, e.g. signed out), applies the
 * code, then tidies the address bar.
 */
export default function CartRestore() {
  const params = useSearchParams();
  const router = useRouter();
  const { cartItems, addToCart, applyCoupon, isCartReady } = useCart();
  const { products = [] } = useAppContext();
  const stage = useRef('waiting'); // waiting → added → done (per mount: the bag page swaps its empty view for the full one)
  const [added, setAdded] = useState(0);

  const restore = params.get('restore');
  const code = (params.get('code') || '').trim().slice(0, 40);

  const wanted = (restore || '').split('.').map((part) => {
    const [id, qty] = part.split('x').map((n) => parseInt(n, 10));
    return Number.isInteger(id) && id > 0 ? { id, qty: Math.min(Math.max(qty || 1, 1), 20) } : null;
  }).filter(Boolean).slice(0, 30);

  // 1. Once the bag and the catalogue are loaded, add what's missing
  useEffect(() => {
    if (stage.current !== 'waiting' || !restore || !isCartReady || products.length === 0) return;
    stage.current = 'added';
    for (const { id, qty } of wanted) {
      if (cartItems.some((item) => Number(item.id) === id)) continue;
      const product = products.find((p) => Number(p.id) === id);
      if (product) addToCart(product, qty);
    }
    setAdded((n) => n + 1);
  }, [restore, isCartReady, products]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. On the next render (the bag now holds the items, so the code validates against them), apply the code and clean the URL
  useEffect(() => {
    if (stage.current !== 'added') return;
    stage.current = 'done';
    if (code) applyCoupon(code).catch(() => {}); // the bag shows the reason if it doesn't apply
    router.replace('/cart', { scroll: false });
  }, [added]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
