'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';
import { HomeProductCard } from './home/HomeProductCard';
import { headingFont } from './home/SectionHeading';
import { toCardProduct, cardGrid } from './PairItWithSection';

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

/** "Buy it again" under the bag: homepage product cards for past purchases, with when each was last ordered. */
export default function BuyAgainSection({ products, cartItems }) {
  const { products: catalogue } = useAppContext();
  // Hide what was already in the bag when this appeared; products added from here
  // stay in place instead of vanishing.
  const [initialCartIds] = useState(() => new Set(cartItems.map(i => i.id)));
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(
    () => (products || []).filter(p => !initialCartIds.has(p.id)),
    [products, initialCartIds]
  );

  if (visible.length === 0) return null;
  const shown = showAll ? visible : visible.slice(0, 3);

  return (
    <section aria-labelledby="buy-again-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="buy-again-heading" className={`${headingFont} text-[20px] md:text-[24px] font-medium uppercase text-[#111114]`}>
          Buy it again
        </h2>
        <Link href="/account/orders" className="shrink-0 text-[13px] text-[#111114] underline underline-offset-4 hover:opacity-70">
          View orders
        </Link>
      </div>
      <div className={cardGrid}>
        {shown.map(product => {
          const ordered = orderedLabel(product.lastOrderedAt);
          return (
            <div key={product.id}>
              <HomeProductCard product={toCardProduct(product, catalogue)} />
              {ordered && <p className="px-0.5 pt-1 text-[12px] text-[#8a8a93]">{ordered}</p>}
            </div>
          );
        })}
      </div>
      {visible.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(v => !v)}
          className="mt-5 text-[13px] text-[#111114] underline underline-offset-4 hover:opacity-70"
        >
          {showAll ? 'Show less' : `Show all ${visible.length}`}
        </button>
      )}
    </section>
  );
}
