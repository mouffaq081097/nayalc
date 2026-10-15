'use client';

import { useEffect, useState } from 'react';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { SectionHeading } from './SectionHeading';
import { ProductRow } from './ProductRow';
import { orderableQty } from '@/lib/backorderRules';

function Shelf({ eyebrow, title, href, linkLabel, products, min = 3 }) {
  if (products.length < min) return null;
  return (
    <section className="py-8 md:py-12 bg-white">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} href={href} linkLabel={linkLabel} />
        <ProductRow products={products} />
      </Container>
    </section>
  );
}

/** Best sellers first (real sales, then the pinned picks), topped up with the rest of the catalogue by units sold. */
export function BestSellersShelf() {
  const { products } = useAppContext();
  const items = products
    .filter((p) => orderableQty(p) > 0)
    .sort((a, b) => (Number(!!b.isBestseller) - Number(!!a.isBestseller)) || (Number(b.totalSold || 0) - Number(a.totalSold || 0)))
    .slice(0, 10);
  return <Shelf eyebrow="Most loved" title="Best Sellers" href="/all-products" linkLabel="View all →" products={items} />;
}

/** Everything with a compare-at price, biggest saving first. */
export function OffersShelf() {
  const { products } = useAppContext();
  const saving = (p) => (Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice);
  const items = products
    .filter((p) => orderableQty(p) > 0 && Number(p.originalPrice) > Number(p.price))
    .sort((a, b) => saving(b) - saving(a))
    .slice(0, 10);
  return <Shelf eyebrow="Offers" title="Special Prices" href="/sales" linkLabel="All offers →" products={items} />;
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
  return <Shelf eyebrow="Your favourites" title="Buy Again" href="/account/orders" linkLabel="Your orders →" products={items} min={1} />;
}

/** What this visitor looked at recently (stored in their browser), newest first. */
export function RecentlyViewedShelf() {
  const { products } = useAppContext();
  const { items: viewed } = useRecentlyViewed();
  const items = liveCopies(viewed.map((v) => v.id), products).slice(0, 10);
  return <Shelf eyebrow="Pick up where you left off" title="Recently Viewed" products={items} min={2} />;
}
