'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { HomeProductCard } from './HomeProductCard';

function Arrow({ dir, disabled, onClick }) {
  const Icon = dir === 'prev' ? ArrowLeft : ArrowRight;
  // Outside the row where the page margin allows it (xl), riding the card edge below that
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous products' : 'Next products'}
      className={`hidden md:flex absolute z-10 top-[38%] -translate-y-1/2 ${dir === 'prev' ? '-left-4 2xl:-left-14' : '-right-4 2xl:-right-14'} 2xl:bg-transparent 2xl:shadow-none w-10 h-10 items-center justify-center rounded-full text-gray-800 bg-white shadow-[0_2px_12px_rgba(31,18,53,0.12)] transition-opacity hover:bg-[#f5f1fd] disabled:opacity-0 disabled:pointer-events-none`}
    >
      <Icon size={20} strokeWidth={1.5} />
    </button>
  );
}

/**
 * One horizontal shelf of HomeProductCards. Phones swipe (two and a bit cards
 * visible, so the row reads as scrollable); desktop shows four with arrows
 * outside the row.
 */
export function ProductRow({ products, tone = 'light' }) {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
  };

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [products.length]);

  const page = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  if (!products.length) return null;

  const basis = 'basis-[47%] sm:basis-[31%] md:basis-[calc((100%-32px)/3)]';

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={update}
        className="flex gap-2 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className={`${basis} shrink-0 snap-start`}>
            <HomeProductCard product={p} tone={tone} />
          </div>
        ))}
      </div>
      <Arrow dir="prev" disabled={edges.start} onClick={() => page(-1)} />
      <Arrow dir="next" disabled={edges.end} onClick={() => page(1)} />
    </div>
  );
}
