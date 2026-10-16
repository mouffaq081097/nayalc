'use client';

import { useEffect, useState } from 'react';
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

// Four across on desktop, two on phones; a short range (e.g. three perfumes) stays centred
function Grid({ products, tone }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-2.5">
      {products.map((p) => (
        <div key={p.id} className="w-[calc(50%-4px)] md:w-[calc((100%-30px)/4)]">
          <HomeProductCard product={p} tone={tone} />
        </div>
      ))}
    </div>
  );
}

function Shelf({ eyebrow, title, href, linkLabel, products, min = 3 }) {
  if (products.length < min) return null;
  return (
    <section className="py-14 md:py-20 bg-white">
      <Container>
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
export function BrandProducts({ brand: slugStart, title, tone = 'light' }) {
  const { brands, products } = useAppContext();
  const brand = brands.find((b) => (b.slug || slugify(b.name)).startsWith(slugStart));
  if (!brand) return null;

  const range = products
    .filter((p) => Number(p.brand_id) === Number(brand.id))
    .sort((a, b) => (Number(orderableQty(b) > 0) - Number(orderableQty(a) > 0)) || byBest(a, b));
  if (range.length < 3) return null;
  const href = `/brand/${brand.slug || slugify(brand.name)}`;
  const dark = tone === 'dark';

  return (
    <section className={`py-14 md:py-20 ${band(tone)}`}>
      <Container>
        {title && <SectionHeading title={title} tone={tone} />}
        <Grid products={range.slice(0, 8)} tone={tone} />
        <div className="mt-9 md:mt-11 flex justify-center">
          <Pill href={href} variant={dark ? 'light' : 'dark'}>View all {range.length} products</Pill>
        </div>
      </Container>
    </section>
  );
}

/** The four best sellers across every brand (real sales first, then the pinned picks). */
export function BestSellers() {
  const { products } = useAppContext();
  const items = products.filter((p) => orderableQty(p) > 0).sort(byBest).slice(0, 4);
  if (items.length < 4) return null;

  return (
    <section className="py-14 md:py-24 bg-white">
      <Container>
        <SectionHeading eyebrow="Most loved" title="Best sellers" />
        <Grid products={items} />
        <div className="mt-9 md:mt-11 flex justify-center">
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
