'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartSuggestionCard from './CartSuggestionCard';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7]/40';
const arrowBtn = `hidden h-9 w-9 items-center justify-center rounded-full border border-[#e5e5ea] bg-white text-[#2a2a31] transition-colors hover:bg-[#f3f3f5] disabled:opacity-30 disabled:hover:bg-white lg:flex ${focusRing}`;

export function orderedLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return `Ordered ${date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })}`;
}

export default function BuyAgainSection({ products, cartItems }) {
  const { addToCart, closeCart } = useCart();
  const railRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });
  // Hide what was already in the bag when this appeared; products added from here
  // stay visible as "In your bag" rather than disappearing mid-tap.
  const [initialCartIds] = useState(() => new Set(cartItems.map(i => i.id)));

  const cartIds = useMemo(() => new Set(cartItems.map(i => i.id)), [cartItems]);
  const visible = useMemo(
    () => (products || []).filter(p => !initialCartIds.has(p.id)),
    [products, initialCartIds]
  );

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () =>
      setCanScroll({
        prev: el.scrollLeft > 4,
        next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [visible.length]);

  if (visible.length === 0) return null;

  const scrollByPage = (direction) => {
    const el = railRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const handleAdd = (product) => {
    addToCart({ ...product, stock_quantity: product.stockQuantity ?? product.stock_quantity }, 1);
    closeCart(); // already on the bag page — don't slide the drawer over it
  };

  return (
    <section aria-labelledby="buy-again-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id="buy-again-heading" className="text-[18px] font-semibold text-[#111114]">Buy it again</h2>
          <p className="mt-0.5 text-[13px] text-[#8a8a93]">From your past orders</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/account/orders"
            className={`inline-flex h-11 items-center rounded-full px-3 text-[13px] font-semibold text-[#7c3aed] transition-colors hover:bg-[#f5f0fd] lg:h-9 ${focusRing}`}
          >
            View orders
          </Link>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canScroll.prev}
            aria-label="Show previous products"
            className={arrowBtn}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canScroll.next}
            aria-label="Show more products"
            className={arrowBtn}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <ul
        ref={railRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 sm:scroll-px-6 lg:mx-0 lg:px-0 lg:scroll-px-0"
      >
        {visible.map(product => (
          <li key={product.id} className="w-[44%] shrink-0 snap-start sm:w-[200px] lg:w-[calc((100%_-_2.25rem)/4)]">
            <CartSuggestionCard
              product={product}
              inBag={cartIds.has(product.id)}
              onAdd={handleAdd}
              meta={orderedLabel(product.lastOrderedAt)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
