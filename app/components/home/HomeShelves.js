'use client';

import { useEffect, useRef, useState } from 'react';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { SectionHeading, Pill } from './SectionHeading';
import { ProductRow } from './ProductRow';
import { HomeProductCard } from './HomeProductCard';
import { slugify } from '@/lib/slugify';
import { orderableQty } from '@/lib/backorderRules';

const byBest = (a, b) =>
  (Number(!!b.isBestseller) - Number(!!a.isBestseller)) || (Number(b.totalSold || 0) - Number(a.totalSold || 0));

// Four across on desktop, three on tablets, two on phones; a short last row stays
// centred. `desktopMax` / `tabletMax` hide the cards past them at that size, so a
// row never ends with a lone card (9 cards on desktop, 4 on tablets).
function Grid({ products, tone, variant, desktopMax, tabletMax }) {
  const hide = (i) => [
    tabletMax != null && i >= tabletMax ? 'md:hidden lg:block' : '',
    desktopMax != null && i >= desktopMax ? 'lg:hidden' : '',
  ].join(' ');
  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-4">
      {products.map((p, i) => (
        <div key={p.id} className={`w-[calc(50%-4px)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] ${hide(i)}`}>
          <HomeProductCard product={p} tone={tone} variant={variant} />
        </div>
      ))}
    </div>
  );
}

// While the catalogue loads: grey cards at the real cards' size, so nothing below
// jumps when the products arrive. Phones get the photo box and the text lines
// under the panel; from md up the 3:4 panel holds everything.
function CardPlaceholder({ tone, gallery = false }) {
  const panel = tone === 'dark' ? 'bg-white/10' : 'bg-[#f6f5f2]';
  const line = tone === 'dark' ? 'bg-white/10' : 'bg-[#eeece8]';
  return (
    <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
      {gallery ? (
        <div className={`${panel} aspect-[3/4]`} />
      ) : (
        <>
          <div className={`${panel} p-3 md:p-[18px] md:aspect-[3/4]`}>
            <div className="aspect-[3/4] mx-[6%] my-2 md:hidden" />
            <div className="h-8 md:hidden" />
          </div>
          <div className="md:hidden pt-3 grid gap-1.5">
            <span className={`h-3 w-3/4 ${line}`} />
            <span className={`h-3 w-1/2 ${line}`} />
          </div>
        </>
      )}
      <div className="pt-2.5 grid gap-1">
        <span className={`h-3 w-2/3 ${line}`} />
      </div>
    </div>
  );
}

function PlaceholderGrid({ count, tone, gallery, desktopMax, tabletMax }) {
  const items = Array.from({ length: count }, (_, i) => ({ id: `placeholder-${i}` }));
  const hide = (i) => [
    tabletMax != null && i >= tabletMax ? 'md:hidden lg:block' : '',
    desktopMax != null && i >= desktopMax ? 'lg:hidden' : '',
  ].join(' ');
  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-4">
      {items.map((p, i) => (
        <div key={p.id} className={`w-[calc(50%-4px)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] ${hide(i)}`}>
          <CardPlaceholder tone={tone} gallery={gallery} />
        </div>
      ))}
    </div>
  );
}

// Thin ( ) arrow, as on Pitaka
const Paren = ({ dir }) => (
  <svg width="11" height="38" viewBox="0 0 10 34" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
    <path d={dir === 'prev' ? 'M8 1.5C2.5 8 2.5 26 8 32.5' : 'M2 1.5C7.5 8 7.5 26 2 32.5'} />
  </svg>
);

/**
 * Phones (after Pitaka's Explore row): one large card at a time, swiped or moved
 * with the thin ( ) arrows at the card's middle; a "2 / 8" count underneath.
 */
function GalleryCarousel({ products }) {
  const scroller = useRef(null);
  const [index, setIndex] = useState(0);
  const go = (step) => {
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(products.length - 1, index + step));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = scroller.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  // The arrows sit at the middle of the 3:4 panel: its width is the screen less the 16px gutters
  const arrowTop = { top: 'calc((100vw - 32px) * 2 / 3)' };

  return (
    <div className="md:hidden relative -mx-4">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-full shrink-0 snap-center px-4">
            <HomeProductCard product={p} variant="gallery" />
          </div>
        ))}
      </div>
      {['prev', 'next'].map((dir) => {
        const off = dir === 'prev' ? index === 0 : index === products.length - 1;
        return (
          <button
            key={dir}
            type="button"
            onClick={() => go(dir === 'prev' ? -1 : 1)}
            disabled={off}
            aria-label={dir === 'prev' ? 'Previous product' : 'Next product'}
            className={`absolute -translate-y-1/2 ${dir === 'prev' ? 'left-6' : 'right-6'} w-9 h-14 flex items-center justify-center text-[#8a8a92] active:text-[#111114] transition-opacity disabled:opacity-0`}
            style={arrowTop}
          >
            <Paren dir={dir} />
          </button>
        );
      })}
      <p className="mt-3 text-center text-[12px] text-[#6b6b73] tabular-nums" aria-live="polite">{index + 1} / {products.length}</p>
    </div>
  );
}

function Shelf({ eyebrow, title, href, linkLabel, products, min = 3 }) {
  if (products.length < min) return null;
  return (
    <section className="py-8 md:py-12 bg-white">
      <Container wide>
        <SectionHeading eyebrow={eyebrow} title={title} href={href} linkLabel={linkLabel} />
        <ProductRow products={products} />
      </Container>
    </section>
  );
}

const band = (tone) => (tone === 'dark' ? 'bg-black' : 'bg-white');

/**
 * One brand's products under its banner: up to eight in the grid, buyable ones
 * first and sold-out ones last (their cards say so), then a "View all" pill.
 * `brand` is the start of the brand's slug ("gernetic" → gernetic-international).
 * `tone="dark"` puts it on a black band (the perfumes, under their dark banner).
 * Hidden under three products.
 */
export function BrandProducts({ brand: slugStart, title, tone = 'light', cardVariant }) {
  const { brands, products, loading } = useAppContext();
  const dark = tone === 'dark';

  // Hold the section's space while the catalogue loads
  if (loading && !products.length) {
    return (
      <section className={`py-8 md:py-12 ${band(tone)}`}>
        <Container wide>
          {title && <SectionHeading title={title} tone={tone} />}
          {cardVariant === 'gallery' && (
            <div className="md:hidden"><CardPlaceholder tone={tone} gallery /><p className="mt-3 h-[18px]" /></div>
          )}
          <div className={cardVariant === 'gallery' ? 'hidden md:block' : ''}>
            <PlaceholderGrid count={9} tone={tone} gallery={cardVariant === 'gallery'} desktopMax={8} />
          </div>
          <div className="mt-6 md:mt-8 h-10" aria-hidden="true" />
        </Container>
      </section>
    );
  }

  const brand = brands.find((b) => (b.slug || slugify(b.name)).startsWith(slugStart));
  if (!brand) return null;

  const range = products
    .filter((p) => Number(p.brand_id) === Number(brand.id))
    .sort((a, b) => (Number(orderableQty(b) > 0) - Number(orderableQty(a) > 0)) || byBest(a, b));
  if (range.length < 3) return null;
  const href = `/brand/${brand.slug || slugify(brand.name)}`;

  return (
    <section className={`py-8 md:py-12 ${band(tone)}`}>
      <Container wide>
        {title && <SectionHeading title={title} tone={tone} />}
        {cardVariant === 'gallery' ? (
          <>
            <GalleryCarousel products={range.slice(0, 9)} />
            <div className="hidden md:block"><Grid products={range.slice(0, 9)} tone={tone} variant="gallery" desktopMax={8} /></div>
          </>
        ) : (
          <Grid products={range.slice(0, 9)} tone={tone} desktopMax={8} />
        )}
        <div className="mt-6 md:mt-8 flex justify-center">
          <Pill href={href} variant={dark ? 'light' : 'dark'}>View all {range.length} products</Pill>
        </div>
      </Container>
    </section>
  );
}

/** The four best sellers across every brand (real sales first, then the pinned picks). */
export function BestSellers() {
  const { products, loading } = useAppContext();

  if (loading && !products.length) {
    return (
      <section className="py-8 md:py-12 bg-white">
        <Container wide>
          <SectionHeading eyebrow="Most loved" title="Best sellers" />
          <PlaceholderGrid count={4} tabletMax={3} />
          <div className="mt-6 md:mt-8 h-10" aria-hidden="true" />
        </Container>
      </section>
    );
  }

  // Four fill a row on desktop and two rows on phones; tablets (3 across) show three
  const items = products.filter((p) => orderableQty(p) > 0).sort(byBest).slice(0, 4);
  if (items.length < 4) return null;

  return (
    <section className="py-8 md:py-12 bg-white">
      <Container wide>
        <SectionHeading eyebrow="Most loved" title="Best sellers" />
        <Grid products={items} tabletMax={3} />
        <div className="mt-6 md:mt-8 flex justify-center">
          <Pill href="/all-products?bestseller=true">Shop all best sellers</Pill>
        </div>
      </Container>
    </section>
  );
}

// Past purchases and recent views are stored as snapshots; show the live
// catalogue copy instead, so price, stock and delivery are current, and skip
// anything no longer on sale.
const liveCopies = (ids, products) =>
  ids.map((id) => products.find((p) => Number(p.id) === Number(id))).filter(Boolean);

/** Signed-in customers: what they've ordered before, most recent first — skincare is a refill business. */
export function BuyAgainShelf() {
  const { products } = useAppContext();
  const { user, isAuthenticated } = useAuth();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) { setIds([]); return; }
    let cancelled = false;
    fetch(`/api/users/${user.id}/buy-again`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => { if (!cancelled && Array.isArray(rows)) setIds(rows.map((r) => r.id)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const items = liveCopies(ids, products).filter((p) => orderableQty(p) > 0).slice(0, 10);
  return <Shelf eyebrow="Your favourites" title="Buy again" href="/account/orders" linkLabel="Your orders" products={items} min={1} />;
}

/** What this visitor looked at recently (stored in their browser), newest first. */
export function RecentlyViewedShelf() {
  const { products } = useAppContext();
  const { items: viewed } = useRecentlyViewed();
  const items = liveCopies(viewed.map((v) => v.id), products).slice(0, 10);
  return <Shelf eyebrow="Pick up where you left off" title="Recently viewed" products={items} min={2} />;
}
