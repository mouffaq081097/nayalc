'use client';

import { useContext, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, RefreshCw, ShoppingBag } from 'lucide-react';
import { Container } from '../ui/Container';
import { CartContext } from '../../context/CartContext';
import { useAppContext } from '../../context/AppContext';
import { headingFont } from './headingFont';
import { cardName } from './HomeProductCard';
import { formatAED } from '../../lib/utils';
import { buildRitual } from '@/lib/ritualRules';
import { FREE_SHIPPING_FROM } from '@/lib/shipping';
import { useT } from '../../context/LocaleContext';

const LAVENDER = 'rgb(147,104,236)';
const isGernetic = (p) => /gern[eé]t/i.test(p.brand || p.brandName || '');

/**
 * Under the GERnétic banner ("Care for every step of your ritual"): the
 * banner's three steps, Cleanse → Treat → Protect, each with the range's best
 * seller (lib/ritualRules.js; Admin → Collections → Ritual step corrects a
 * collection that lands in the wrong one). "Swap" shows the step's next
 * product; one button adds all three. Hidden unless every step has a product.
 */
export function RitualSection() {
  const { products, categories, loading } = useAppContext();
  const { addToCart } = useContext(CartContext);
  const t = useT();
  const [pick, setPick] = useState({});
  const [added, setAdded] = useState(false);

  const steps = useMemo(() => buildRitual(products, categories, isGernetic), [products, categories]);

  // Hold the space while the catalogue loads, so the page below doesn't jump
  if (loading && !products.length) {
    return (
      <section aria-hidden="true" className="bg-[#f6f5f2] py-8 md:py-10">
        <Container wide>
          <div className="h-12 w-56 bg-[#eeece8] mb-6 animate-pulse motion-reduce:animate-none" />
          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-[112px] md:h-[400px] bg-white animate-pulse motion-reduce:animate-none" />)}
          </div>
        </Container>
      </section>
    );
  }
  if (!steps) return null;

  const chosen = steps.map((s) => s.products[(pick[s.key] || 0) % s.products.length]);
  const total = chosen.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const swap = (key) => setPick((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));

  const addAll = () => {
    chosen.forEach((p) => addToCart({ ...p, stock_quantity: p.stock_quantity ?? p.stockQuantity }, 1));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section aria-label={t('Your GERnétic ritual')} className="bg-[#f6f5f2] py-8 md:py-10">
      <Container wide>
        <div className="mb-5 md:mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-[11.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: LAVENDER }}>{t('Your GERnétic ritual')}</p>
            <h3 className={`${headingFont} mt-1.5 text-[20px] md:text-[26px] font-medium uppercase leading-tight text-[#111114]`}>{t('Cleanse, treat, protect')}</h3>
          </div>
          <p className="text-[13px] text-[#6b6b73]">{t('The best seller for each step. Swap any of them.')}</p>
        </div>

        <ol className="grid gap-3 md:grid-cols-3 md:gap-4">
          {steps.map((s, i) => {
            const p = chosen[i];
            const href = `/product/${p.slug || p.id}`;
            return (
              <li key={s.key} className="bg-white p-3 md:p-5 flex md:flex-col gap-4">
                <Link href={href} className="relative w-[88px] h-[88px] md:w-full md:h-auto md:aspect-[4/3] shrink-0 bg-[#f6f5f2]">
                  {p.imageUrl && (
                    <Image src={p.imageUrl} alt="" fill sizes="(min-width: 768px) 30vw, 88px" className="object-contain p-2 md:p-[12%] mix-blend-multiply" />
                  )}
                </Link>
                <div className="min-w-0 flex-1 flex flex-col">
                  <p className="text-[10.5px] md:text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: LAVENDER }}>
                    {t('Step {n}', { n: i + 1 })} · {t(s.label)}
                  </p>
                  <Link href={href} className="mt-1 text-[14px] md:text-[15px] font-semibold leading-snug text-[#111114] line-clamp-2 hover:underline underline-offset-2">
                    <bdi>{cardName(p.name)}</bdi>
                  </Link>
                  <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                    <span className="text-[14px] font-semibold tabular-nums text-[#111114]">{formatAED(p.price)}</span>
                    {s.products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => swap(s.key)}
                        aria-label={t('Show another product for {step}', { step: t(s.label) })}
                        className="relative after:absolute after:-inset-2 inline-flex items-center gap-1.5 text-[12.5px] text-[#111114] underline underline-offset-4 decoration-[#c9c9cf] hover:decoration-[#111114]"
                      >
                        <RefreshCw size={12} strokeWidth={1.75} aria-hidden="true" /> {t('Swap')}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#e6e4df] pt-5">
          <p className="text-[13px] text-[#6b6b73]" aria-live="polite">
            {t('Ritual total')}{' '}
            <b className="ms-1 text-[18px] font-semibold tabular-nums text-[#111114]">{formatAED(total)}</b>
            {steps.length >= FREE_SHIPPING_FROM && <span className="ms-2 text-[#15803d] font-medium">{t('Free delivery')}</span>}
          </p>
          <button
            type="button"
            onClick={addAll}
            className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#111114] text-white text-[13.5px] font-semibold transition-colors hover:bg-[#2a2a31]"
          >
            {added ? <><Check size={16} /> {t('Added to your bag')}</> : <><ShoppingBag size={16} strokeWidth={1.75} /> {t('Add the ritual to bag')}</>}
          </button>
        </div>
      </Container>
    </section>
  );
}
