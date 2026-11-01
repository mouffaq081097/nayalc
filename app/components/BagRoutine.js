'use client';

import { useContext, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useAppContext } from '../context/AppContext';
import { useT } from '../context/LocaleContext';
import { cardName } from './home/HomeProductCard';
import { formatAED } from '../lib/utils';
import { RITUAL_STEPS } from '@/lib/ritualRules';
import { bagRoutine } from '@/lib/recommendations';

/**
 * Under the bag's items: which steps of the Cleanse → Treat → Protect ritual
 * the bag covers, and the best seller for the first step it's missing
 * (lib/recommendations.js). Worked out from the catalogue, so it costs nothing
 * and shows only when the bag holds part of the ritual.
 */
export default function BagRoutine({ items = [] }) {
  const { products, categories } = useAppContext();
  const { addToCart } = useContext(CartContext);
  const t = useT();
  const [adding, setAdding] = useState(false);
  const routine = useMemo(() => bagRoutine(items, products, categories), [items, products, categories]);
  if (!routine) return null;

  const next = routine.missing.find((m) => m.product);
  const add = () => {
    setAdding(true);
    addToCart({ ...next.product, stock_quantity: next.product.stock_quantity ?? next.product.stockQuantity }, 1);
    setTimeout(() => setAdding(false), 1200);
  };

  return (
    <section aria-label={t('Your routine')} className="rounded-xl bg-[#f6f5f2] p-4">
      <p className="text-[12px] font-semibold text-[#111114]">{t('Your routine')}</p>
      <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
        {RITUAL_STEPS.map((s, i) => {
          const done = routine.covered.some((c) => c.key === s.key);
          return (
            <li key={s.key} className={`inline-flex items-center gap-1.5 ${done ? 'text-[#111114]' : 'text-[#6b6b73]'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${done ? 'bg-[#111114] text-white' : 'border border-[#c9c9cf]'}`} aria-hidden="true">
                {done && <Check size={10} strokeWidth={3} />}
              </span>
              {t('Step {n}', { n: i + 1 })} · {t(s.label)}
              <span className="sr-only">{done ? t('In your bag') : t('Not in your bag')}</span>
            </li>
          );
        })}
      </ol>
      {routine.missing.length === 0 ? (
        <p className="mt-2 text-[13px] text-[#2a2a31]">{t('Your bag covers all three steps: cleanse, treat and protect.')}</p>
      ) : next && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-2.5">
          <Link href={`/product/${next.product.slug || next.product.id}`} className="relative w-12 h-12 shrink-0 bg-[#f6f5f2]">
            {next.product.imageUrl && <Image src={next.product.imageUrl} alt="" fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#6b6b73]">{t('Missing step: {step}', { step: t(next.step.label) })}</p>
            <Link href={`/product/${next.product.slug || next.product.id}`} className="block truncate text-[13px] font-semibold text-[#111114] hover:underline underline-offset-2">
              <bdi>{cardName(next.product.name)}</bdi>
            </Link>
            <p className="text-[12.5px] tabular-nums text-[#111114]">{formatAED(next.product.price)}</p>
          </div>
          <button
            type="button"
            onClick={add}
            className="shrink-0 inline-flex items-center gap-1 h-9 px-3.5 rounded-full bg-[#111114] text-white text-[12.5px] font-semibold hover:bg-[#2a2a31] transition-colors"
          >
            {adding ? <><Check size={13} /> {t('Added')}</> : t('+ Add')}
          </button>
        </div>
      )}
    </section>
  );
}
