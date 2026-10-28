'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { cardName } from './home/HomeProductCard';
import { formatAED } from '../lib/utils';
import { isPreorderOnly, orderableQty } from '@/lib/backorderRules';
import { useT } from '../context/LocaleContext';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114]/30';
const arrow = `flex h-9 w-9 items-center justify-center rounded-full text-[#111114] transition-colors hover:bg-black/5 disabled:opacity-25 disabled:hover:bg-transparent ${focusRing}`;

/**
 * Shopify-style suggestions on the bag page: a grey panel with the title and
 * ‹ › arrows, one product at a time — white photo tile, name, brand, price (old
 * price struck through) and a black "+ Add". `note(product)` adds a small line
 * (e.g. "Ordered 12 Oct"); `action` sits beside the arrows (e.g. "View orders").
 */
export default function CartSuggestionCarousel({ id, title, products, note, action }) {
  const { addToCart } = useContext(CartContext);
  const t = useT();
  const [index, setIndex] = useState(0);
  const [added, setAdded] = useState(false);

  // Stay in range if the list shrinks
  useEffect(() => { if (index >= products.length) setIndex(0); }, [products.length, index]);

  if (!products.length) return null;
  const product = products[Math.min(index, products.length - 1)];
  const count = products.length;
  const go = (step) => { setAdded(false); setIndex(i => (i + step + count) % count); };

  const price = Number(product.price) || 0;
  const was = Number(product.originalPrice) || 0;
  const canBuy = orderableQty(product) > 0;
  const href = `/product/${product.slug || product.id}`;
  const extra = note?.(product);

  const onAdd = () => {
    // CartContext reads snake_case stock
    const ok = addToCart({ ...product, stock_quantity: product.stock_quantity ?? product.stockQuantity }, 1);
    if (ok === false) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <section aria-labelledby={`${id}-heading`} aria-roledescription="carousel" className="rounded-xl bg-[#f5f5f5] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={`${id}-heading`} className="text-[18px] sm:text-[20px] text-[#111114]">{t(title)}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label={t('Previous suggestion')} className={arrow}><ChevronLeft size={20} className="flip-rtl" /></button>
              <button type="button" onClick={() => go(1)} aria-label={t('Next suggestion')} className={arrow}><ChevronRight size={20} className="flip-rtl" /></button>
            </>
          )}
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
          <Link href={href} className={`h-[96px] w-[96px] shrink-0 bg-white p-2 sm:h-[112px] sm:w-[112px] ${focusRing}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl || '/placeholder-image.jpg'} alt={product.name} className="h-full w-full object-contain" />
          </Link>
          <div className="min-w-0">
            <Link href={href} className="line-clamp-2 text-[15px] sm:text-[16px] leading-snug text-[#111114] hover:underline underline-offset-2">
              <bdi>{cardName(product.name)}</bdi>
            </Link>
            {product.brandName && <p className="truncate text-[13px] text-[#707070]">{product.brandName}</p>}
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[18px] sm:text-[20px] text-[#111114]">{formatAED(price)}</span>
              {was > price && <span className="text-[13px] text-[#707070] line-through">{formatAED(was)}</span>}
            </p>
            {(extra || isPreorderOnly(product)) && (
              <p className="text-[12px] text-[#707070]">{[isPreorderOnly(product) && t('Pre-order'), extra].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canBuy}
          className={`flex h-12 w-full shrink-0 items-center justify-center gap-1.5 bg-[#111114] text-[15px] text-white transition-opacity hover:opacity-85 disabled:opacity-40 sm:w-[170px] ${focusRing}`}
        >
          {!canBuy ? t('Sold out') : added ? <><Check size={16} /> {t('Added')}</> : <><Plus size={16} /> {t('Add')}</>}
        </button>
      </div>
      {count > 1 && <p className="mt-3 text-end text-[12px] tabular-nums text-[#707070]">{index + 1} / {count}</p>}
    </section>
  );
}
