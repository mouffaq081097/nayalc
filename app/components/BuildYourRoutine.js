'use client';

import { useContext, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppContext } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import { Container } from './ui/Container';
import { SectionHeading } from './home/SectionHeading';
import { formatAED } from '../lib/utils';
import { orderableQty, isPreorderOnly } from '@/lib/backorderRules';

// The catalog's categories are too coarse to pick steps on their own (no toner or
// SPF category, and "Makeup Removal / Cleansing" also holds sponges and soap), so
// each routine names its products. A product that is inactive or can't be bought
// is skipped, and the step disappears with it.
const ROUTINES = {
  morning: [
    { step: 'Cleanse', productId: 14, why: 'Lifts makeup, sunscreen and the day’s pollution.' },
    { step: 'Tone', productId: 28, why: 'Rebalances skin and preps it for what follows.' },
    { step: 'Treat', productId: 19, why: 'Draws moisture deep into the skin.' },
    { step: 'Moisturise', productId: 20, why: 'Seals in the serum and firms the contour.' },
    { step: 'Protect', productId: 11, why: 'High protection against UAE sun and dark spots.' },
  ],
  evening: [
    { step: 'Cleanse', productId: 14, why: 'Removes makeup and sunscreen in one pass.' },
    { step: 'Resurface', productId: 27, why: 'Gentle fruit acids smooth texture overnight.' },
    { step: 'Treat', productId: 19, why: 'Plumps lines while skin repairs.' },
    { step: 'Night cream', productId: 18, why: 'Rich overnight repair and comfort.' },
  ],
};

const LAVENDER = 'rgb(147,104,236)';
const HAIRLINE = '#e8e8e8';

function buildRoutine(defs, products) {
  return defs
    .map((def) => ({ ...def, product: products.find((p) => Number(p.id) === def.productId) }))
    .filter((s) => s.product && orderableQty(s.product) > 0);
}

function TimeToggle({ value, onChange }) {
  return (
    <div className="inline-flex shrink-0 rounded-full bg-white p-[3px] gap-0.5" style={{ border: `1px solid ${HAIRLINE}` }} role="group" aria-label="Time of day">
      {[['morning', 'Morning'], ['evening', 'Evening']].map(([key, label]) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className={`rounded-full px-4 md:px-[18px] py-2 text-[12.5px] font-medium transition-colors ${on ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
            style={on ? { background: LAVENDER } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ProductPhoto({ product, sizes, className }) {
  return product.imageUrl ? (
    <Image src={product.imageUrl} alt={product.name} fill sizes={sizes} className={`object-contain mix-blend-multiply ${className || ''}`} />
  ) : null;
}

export function BuildYourRoutine() {
  const { products } = useAppContext();
  const { addToCart } = useContext(CartContext);
  const [time, setTime] = useState('morning');
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(null); // 'routine' or a product id, for the brief "Added" state

  const routines = {
    morning: buildRoutine(ROUTINES.morning, products),
    evening: buildRoutine(ROUTINES.evening, products),
  };
  // Fall back to whichever routine has enough steps to be worth showing
  const shown = routines[time].length >= 2 ? time : time === 'morning' ? 'evening' : 'morning';
  const steps = routines[shown];
  if (steps.length < 2) return null;

  const current = steps[Math.min(active, steps.length - 1)];
  const total = steps.reduce((sum, s) => sum + Number(s.product.price || 0), 0);
  const bothAvailable = routines.morning.length >= 2 && routines.evening.length >= 2;

  const flashAdded = (key) => {
    setAdded(key);
    setTimeout(() => setAdded((k) => (k === key ? null : k)), 2000);
  };
  // addToCart's return value comes from inside a state updater, so it isn't reliable;
  // every step shown here is orderable, so treat the click as added
  const addOne = (product) => {
    addToCart(product, 1);
    flashAdded(product.id);
  };
  const addAll = () => {
    steps.forEach((s) => addToCart(s.product, 1));
    flashAdded('routine');
  };
  const switchTime = (next) => {
    setTime(next);
    setActive(0);
  };

  return (
    <section className="py-8 md:py-12 bg-white">
      <Container>
        <SectionHeading
          eyebrow="Your daily ritual"
          title="Build Your Routine"
          action={bothAvailable && <TimeToggle value={shown} onChange={switchTime} />}
        />

        <div className="grid gap-6 md:grid-cols-[5fr_7fr] md:gap-8 md:items-stretch">
          {/* Large view of the selected step (desktop) */}
          <div className="hidden md:block relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50" style={{ border: `1px solid ${HAIRLINE}` }} aria-live="polite">
            <span
              className="absolute top-3.5 left-3.5 z-10 rounded-full px-3 py-1.5 text-[10.5px] font-semibold"
              style={{ background: 'rgba(147,104,236,0.12)', color: '#6d4fd6' }}
            >
              Step {steps.indexOf(current) + 1} · {current.step}
            </span>
            <div className="absolute inset-x-[14%] top-[10%] bottom-[30%]">
              <ProductPhoto key={current.product.id} product={current.product} sizes="(max-width: 1024px) 30vw, 380px" />
            </div>
            <Link
              href={`/product/${current.product.id}`}
              className="absolute inset-x-3.5 bottom-3.5 grid gap-1 rounded-xl bg-white px-4 py-3.5 transition-shadow hover:shadow-sm"
              style={{ border: `1px solid ${HAIRLINE}` }}
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: LAVENDER }}>{current.product.brand}</span>
              <span className="text-[15px] font-semibold leading-snug text-gray-900">{current.product.name}</span>
              <span className="text-[12.5px] leading-relaxed text-gray-500">{current.why}</span>
            </Link>
          </div>

          {/* Steps in order */}
          <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: `1px solid ${HAIRLINE}` }}>
            <ol className="flex flex-1 flex-col">
              {steps.map((s, i) => {
                const selected = s === current;
                const { product } = s;
                return (
                  <li
                    key={`${s.step}-${product.id}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className={`md:flex-1 grid grid-cols-[20px_52px_minmax(0,1fr)_32px] md:grid-cols-[28px_60px_minmax(0,1fr)_auto_34px] items-center gap-2.5 md:gap-3.5 px-3 md:px-4 py-2.5 md:py-3 border-l-2 transition-colors ${selected ? '' : 'border-l-transparent hover:bg-gray-50'}`}
                    style={{
                      ...(i > 0 && { borderTop: `1px solid ${HAIRLINE}` }),
                      ...(selected && { background: 'rgba(147,104,236,0.08)', borderLeftColor: LAVENDER }),
                    }}
                  >
                    <span className="text-center text-xs font-semibold tabular-nums" style={{ color: selected ? LAVENDER : '#c7c9d1' }}>{i + 1}</span>
                    <Link href={`/product/${product.id}`} className="relative w-[52px] h-[52px] md:w-[60px] md:h-[60px] rounded-[10px] bg-gray-50 overflow-hidden" tabIndex={-1} aria-hidden="true">
                      <ProductPhoto product={product} sizes="60px" className="p-1" />
                    </Link>
                    <div className="grid gap-0.5 min-w-0">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: LAVENDER }}>{s.step}</span>
                      <Link href={`/product/${product.id}`} className="truncate text-[13.5px] font-semibold text-gray-900 hover:underline">
                        {product.name}
                      </Link>
                      <span className="text-xs leading-normal text-gray-500 line-clamp-1 md:line-clamp-none">{s.why}</span>
                      <span className="md:hidden text-[12.5px] font-medium text-gray-500 tabular-nums">
                        {formatAED(product.price)}
                        {isPreorderOnly(product) && <span className="ml-1.5 font-semibold" style={{ color: LAVENDER }}>Pre-order</span>}
                      </span>
                    </div>
                    <span className="hidden md:grid justify-items-end text-[13px] font-medium text-gray-500 tabular-nums">
                      {formatAED(product.price)}
                      {isPreorderOnly(product) && <span className="text-[10.5px] font-semibold" style={{ color: LAVENDER }}>Pre-order</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => addOne(product)}
                      aria-label={`Add ${product.name} to bag`}
                      className="grid place-items-center w-8 h-8 rounded-full bg-white text-[#555] transition-colors hover:bg-[#9333ea] hover:border-[#9333ea] hover:text-white"
                      style={{ border: `1px solid ${HAIRLINE}` }}
                    >
                      {added === product.id ? '✓' : <span className="text-[17px] leading-none">+</span>}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-wrap items-center justify-between gap-3.5 px-4 py-4 bg-gray-50" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
              <div className="grid gap-0.5">
                <span className="text-[11.5px] text-gray-500">Full {shown} routine · {steps.length} products</span>
                <span className="text-xl font-semibold text-gray-900 tabular-nums">{formatAED(total)}</span>
              </div>
              <button
                type="button"
                onClick={addAll}
                className="rounded-full px-6 py-3 text-xs font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90"
                style={{ background: added === 'routine' ? '#7c3aed' : '#9333ea' }}
              >
                {added === 'routine' ? 'Added to bag ✓' : 'Add routine to bag'}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
