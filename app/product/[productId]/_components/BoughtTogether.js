'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Plus, ShoppingBag } from 'lucide-react';
import { LAVENDER, BORDER, WELL, aed, BUTTON } from './theme';

/**
 * This product plus up to two companions. Each companion can be toggled out;
 * the total and the button follow the selection.
 */
export default function BoughtTogether({ product, image, companions, onAddAll, disabled }) {
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

  return (
    <section className="rounded-2xl p-5 md:p-6 bg-white" style={{ border: `1.5px solid ${BORDER}` }}>
      <h2 className="text-[18px] font-bold text-gray-900 mb-1">Frequently bought together</h2>
      <p className="text-[12px] text-[#6b6b73] mb-5">Tap an item to include or leave it out</p>

      <ul className="space-y-2.5">
        {items.map((item, i) => {
          const selected = item.isCurrent || !deselected[item.id];
          return (
            <li key={item.id}>
              {i > 0 && (
                <div className="flex justify-center -my-1.5 relative z-10">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center" style={{ border: `1px solid ${BORDER}` }}>
                    <Plus size={11} style={{ color: LAVENDER }} />
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-2xl p-2.5 pr-3 transition-all"
                style={{ background: selected ? 'white' : 'transparent', border: `1px solid ${selected ? 'rgba(147,104,236,0.45)' : '#f3f4f6'}`, opacity: selected ? 1 : 0.55 }}>
                <button type="button" disabled={item.isCurrent}
                  onClick={() => setDeselected(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  aria-pressed={selected} aria-label={item.isCurrent ? undefined : `${selected ? 'Remove' : 'Include'} ${item.name}`}
                  className="flex items-center gap-3 flex-shrink-0 disabled:cursor-default">
                  <span className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                    style={selected ? { background: LAVENDER, borderColor: LAVENDER } : { background: 'white', borderColor: '#d1d5db' }}>
                    {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: WELL }}>
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-contain p-1.5" />}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  {item.isCurrent
                    ? <p className="text-[13px] text-gray-700 line-clamp-2 leading-snug"><span className="font-semibold">This item:</span> {item.name}</p>
                    : <Link href={`/product/${item.slug || item.id}`} className="text-[13px] text-gray-700 line-clamp-2 leading-snug hover:underline underline-offset-2">{item.name}</Link>}
                </div>
                <span className="text-[13px] font-bold tabular-nums text-gray-900 flex-shrink-0">{aed(item.price)}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 pt-5 flex items-center justify-between gap-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div>
          <p className="text-[11px] text-[#6b6b73]">Total for {chosen.length + 1} item{chosen.length ? 's' : ''}</p>
          <p className="text-[20px] font-bold tabular-nums text-gray-900">{aed(total)}</p>
          {chosen.length >= 2 && <p className="text-[11px] font-medium text-emerald-600">Qualifies for free shipping</p>}
        </div>
        <button onClick={handleAdd} disabled={disabled}
          className={`h-11 px-5 rounded-full text-[13px] font-semibold text-white flex items-center gap-2 shadow-[0_6px_18px_rgba(147,104,236,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none ${BUTTON}`}>
          {added ? <><Check size={15} /> Added</> : <><ShoppingBag size={15} /> Add {chosen.length + 1} to cart</>}
        </button>
      </div>
    </section>
  );
}
