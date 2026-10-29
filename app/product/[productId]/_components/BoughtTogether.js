'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingBag } from 'lucide-react';
import { WELL, aed, BUTTON } from './theme';
import { headingFont } from '../../../components/home/headingFont';
import { FREE_SHIPPING_FROM } from '@/lib/shipping';
import { RITUAL_STEPS } from '@/lib/ritualRules';
import { useLocale } from '@/app/context/LocaleContext';

/**
 * This product plus up to two companions, each of which can be left out; the
 * total and the button follow the selection. `fromOrders` says where the
 * companions come from: real orders ("Frequently bought together",
 * lib/boughtTogether.js) or the other steps of the ritual ("Complete your
 * routine", lib/recommendations.js), whose step names label them.
 */
export default function BoughtTogether({ product, image, companions, onAddAll, disabled, fromOrders }) {
  const { t, rich } = useLocale();
  const [deselected, setDeselected] = useState({});
  const [added, setAdded] = useState(false);

  const chosen = companions.filter(c => !deselected[c.id]);
  const total = Number(product.price) + chosen.reduce((s, c) => s + Number(c.price), 0);

  if (companions.length === 0) return null;

  const handleAdd = () => {
    onAddAll(chosen);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const items = [{ ...product, imageUrl: image, isCurrent: true }, ...companions];
  const stepLabel = (key) => RITUAL_STEPS.find(s => s.key === key)?.label;

  return (
    <section className="border-t border-[#111114] pt-5">
      <h2 className={`${headingFont} text-[17px] md:text-[18px] font-medium uppercase leading-tight text-[#111114]`}>
        {t(fromOrders ? 'Frequently bought together' : 'Complete your routine')}
      </h2>
      <p className="mt-1 text-[12.5px] text-[#6b6b73]">
        {t(fromOrders ? 'Often in the same order as this one. Tap one to leave it out.' : 'The next steps of the ritual. Tap one to leave it out.')}
      </p>

      <ul className="mt-4 border-t border-[#ececec]">
        {items.map((item) => {
          const selected = item.isCurrent || !deselected[item.id];
          return (
            <li key={item.id} className={`flex items-center gap-3 py-3 border-b border-[#ececec] transition-opacity ${selected ? '' : 'opacity-50'}`}>
              <button type="button" disabled={item.isCurrent}
                onClick={() => setDeselected(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                aria-pressed={selected} aria-label={item.isCurrent ? undefined : t(selected ? 'Remove {name}' : 'Include {name}', { name: item.name })}
                className="flex items-center gap-3 shrink-0 disabled:cursor-default">
                <span className={`w-[18px] h-[18px] border flex items-center justify-center transition-colors ${selected ? 'bg-[#111114] border-[#111114]' : 'bg-white border-[#c9c9cf]'}`}>
                  {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                </span>
                <span className="relative w-14 h-14 overflow-hidden shrink-0" style={{ background: WELL }}>
                  {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-contain p-1.5 mix-blend-multiply" />}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                {!item.isCurrent && item.step && (
                  <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[rgb(147,104,236)]">{t(stepLabel(item.step))}</span>
                )}
                {item.isCurrent
                  ? <p className="text-[13px] text-[#111114] line-clamp-2 leading-snug">{rich('{label} {name}', { label: <span className="font-semibold">{t('This item:')}</span>, name: <bdi>{item.name}</bdi> })}</p>
                  : <Link href={`/product/${item.slug || item.id}`} className="text-[13px] text-[#111114] line-clamp-2 leading-snug hover:underline underline-offset-2"><bdi>{item.name}</bdi></Link>}
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-[#111114] shrink-0">{aed(item.price)}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11.5px] text-[#6b6b73]">{t(chosen.length ? 'Total for {n} items' : 'Total for {n} item', { n: chosen.length + 1 })}</p>
          <p className="text-[20px] font-semibold tabular-nums text-[#111114]">{aed(total)}</p>
          {chosen.length + 1 >= FREE_SHIPPING_FROM && <p className="text-[11.5px] font-medium text-[#15803d]">{t('Qualifies for free shipping')}</p>}
        </div>
        <button onClick={handleAdd} disabled={disabled}
          className={`h-12 px-6 text-[13px] font-semibold uppercase tracking-[0.04em] flex items-center gap-2 transition-colors disabled:opacity-50 ${BUTTON}`}>
          {added ? <><Check size={15} /> {t('Added')}</> : <><ShoppingBag size={15} /> {t('Add {n} to cart', { n: chosen.length + 1 })}</>}
        </button>
      </div>
    </section>
  );
}
