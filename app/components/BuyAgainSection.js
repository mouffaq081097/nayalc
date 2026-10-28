'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';
import CartSuggestionCarousel from './CartSuggestionCarousel';
import { toCardProduct } from './PairItWithSection';
import { useLocale } from '../context/LocaleContext';

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

/** "Buy it again" under the bag: past purchases one at a time, with when each was last ordered. */
export default function BuyAgainSection({ products, cartItems }) {
  const { products: catalogue } = useAppContext();
  const { t, date } = useLocale();
  // Hide what was already in the bag when this appeared; products added from here
  // stay in place instead of vanishing.
  const [initialCartIds] = useState(() => new Set(cartItems.map(i => i.id)));
  const visible = useMemo(
    () => (products || []).filter(p => !initialCartIds.has(p.id)).map(p => ({ ...toCardProduct(p, catalogue), lastOrderedAt: p.lastOrderedAt })),
    [products, initialCartIds, catalogue]
  );

  return (
    <CartSuggestionCarousel
      id="buy-again"
      title="Buy it again"
      products={visible}
      note={p => {
        const label = orderedLabel(p.lastOrderedAt);
        // "Ordered 12 Oct" → the date in the visitor's language
        return label && t('Ordered {date}', { date: date(label.replace(/^Ordered /, '')) });
      }}
      action={<Link href="/account/orders" className="me-1 text-[13px] text-[#111114] underline underline-offset-4 hover:opacity-70">{t('View orders')}</Link>}
    />
  );
}
