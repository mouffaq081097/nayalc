'use client';

/**
 * NayaLumiereHome — the "Naya Lumière" bespoke homepage design.
 *
 * Ported from a claude.ai/design "dc.html" design-canvas export. This file owns
 * ONLY the content sections between the global Header and the global Footer
 * (both of which already exist as app/components/Header.js, app/components/Footer.js
 * and app/components/MobileBottomNav.js and are rendered by app/LayoutContent.js for
 * every page — they are intentionally left untouched and are not duplicated here).
 *
 * Palette / typography note: this design uses its own bespoke premium palette
 * (deep plum #4A2360, purple/pink gradient #8B5CF6→#C084FC, warm gold #8A5E22,
 * French navy #3B5BA9, UAE green #1E7A5A) which is DIFFERENT from the site-wide
 * "Cloud Luxe" `--cl-*` token system — that is intentional, per the design brief.
 *
 * Data note: every section below is backed by REAL data from the Postgres catalog
 * via useAppContext() (products/categories/concerns/brands/loyaltyData), the real
 * /api/reviews and /api/social-posts endpoints, and the real useRecentlyViewed()
 * hook — nothing here is invented/fictional demo content. Where the original design
 * mockup showed a stat with no real backing (live viewer counts, "sold in the last
 * 24h", a star-distribution chart, a "% would repurchase" figure, a 4th loyalty
 * tier), that specific piece of UI was removed rather than re-faked.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Cormorant_Garamond, Poppins } from 'next/font/google';
import { useAppContext } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});
const serif = cormorant.style.fontFamily;
const sans = poppins.style.fontFamily;

/* ============================================================================
 * REAL DATA HELPERS — everything here derives from the live catalog, nothing
 * is a fixed/invented list. See the per-section comments below for how each
 * one is used.
 * ==========================================================================*/

// A brand accent color per real brand name (id-agnostic, matched by name so it
// keeps working if brand ids change) — purely a visual accent, not a claim
// about the brand's country of origin.
const BRAND_TINT = {
  'Zorah Biocosmetiques': '#1E7A5A',
  'GERnétic International': '#3B5BA9',
  'Naya Lumiere Perfumes': '#8A5E22',
};
const DEFAULT_TINT = '#8B5CF6';

const STAR_PATH =
  'm12 3.4 2.7 5.6 6.1.85-4.45 4.3 1.08 6.05L12 17.3l-5.43 2.9 1.08-6.05L3.2 9.85l6.1-.85Z';

// Local, verified assets shipped by the user
const IMG = {
  lotusMask: '/design-home/lotus-mask.png',
  routineTreat: '/design-home/routine-treat.jpg',
};

function money(n) {
  return 'AED ' + Math.round(Number(n) || 0).toLocaleString('en-US');
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** A product's real category names, as an exact-match array (categoryNames is a ", "-joined string). */
function categoryList(product) {
  return (product.categoryNames || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function hasCategory(product, name) {
  return categoryList(product).includes(name);
}

function brandTint(brandName) {
  return BRAND_TINT[brandName] || DEFAULT_TINT;
}

/** Top sellers: real in-stock products, ranked by review volume then rating (no fabricated sales/view data exists). */
function pickTopSellers(products) {
  return [...products]
    .filter((p) => num(p.stock_quantity) > 0)
    .sort((a, b) => num(b.reviewCount) - num(a.reviewCount) || num(b.averageRating) - num(a.averageRating) || b.id - a.id)
    .slice(0, 4);
}

/** The "Fragrence" category (real, 3 products) — a natural fit for a signature-scent picker. */
function pickSignature(products) {
  return products.filter((p) => hasCategory(p, 'Fragrence'));
}

const ESSENTIALS_CATEGORY_ORDER = [
  'Anti-Aging / Serums',
  'Makeup Removal / Cleansing',
  'Lifting & Firming',
  'Specific Skin Concerns / Treatments',
  'Duo Set',
];

/** 4 real in-stock products with category variety, skipping ids already used elsewhere on the page. */
function pickEssentials(products, excludeIds) {
  const inStock = products.filter((p) => num(p.stock_quantity) > 0 && !excludeIds.has(p.id));
  const byRating = (a, b) => num(b.averageRating) - num(a.averageRating) || b.id - a.id;
  const picked = [];
  const used = new Set();
  for (const cat of ESSENTIALS_CATEGORY_ORDER) {
    if (picked.length >= 4) break;
    const candidate = inStock.filter((p) => hasCategory(p, cat) && !used.has(p.id)).sort(byRating)[0];
    if (candidate) {
      picked.push(candidate);
      used.add(candidate.id);
    }
  }
  if (picked.length < 4) {
    for (const p of inStock.filter((p) => !used.has(p.id) && !hasCategory(p, 'Fragrence')).sort(byRating)) {
      if (picked.length >= 4) break;
      picked.push(p);
      used.add(p.id);
    }
  }
  return picked.slice(0, 4);
}

const ROUTINE_CATEGORIES = {
  cleanse: { label: 'Cleanse', when: 'morning & night', category: 'Makeup Removal / Cleansing' },
  treat: { label: 'Treat', when: 'shown at left', category: 'Anti-Aging / Serums' },
  protect: { label: 'Protect', when: 'daylight hours', category: 'Lifting & Firming' },
};

/** Up to 3 real products from one real category, best-rated first. */
function buildStepOptions(products, categoryName) {
  return products
    .filter((p) => hasCategory(p, categoryName))
    .sort((a, b) => num(b.averageRating) - num(a.averageRating) || b.id - a.id)
    .slice(0, 3);
}

function shortLabel(name, max = 22) {
  if (!name) return '';
  const cut = name.split(/[–:]| for /i)[0].trim();
  const base = cut.length >= 3 ? cut : name.trim();
  return base.length > max ? base.slice(0, max - 1).trim() + '…' : base;
}

function truncate(text, max) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1).trim() + '…' : clean;
}

function initialsFromName(name) {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}

/* ============================================================================
 * SHARED HELPERS / SMALL UI PIECES
 * ==========================================================================*/

function StarIcon({ fill = '#E6E1D6', size = 13 }) {
  return (
    <svg style={{ flex: 'none' }} width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d={STAR_PATH} />
    </svg>
  );
}

/** Solid star row (used for per-product / per-review ratings, rounded to nearest star). */
function StarRow({ rating, size = 13 }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '1.5px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={size} fill={i <= Math.round(rating) ? '#D8A24A' : '#E6E1D6'} />
      ))}
    </span>
  );
}

/** Partial-fill star row (used for the aggregate rating). */
function PartialStarRow({ rating, size = 14 }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, rating - i + 1)) * 100;
        return (
          <span key={i} style={{ position: 'relative', display: 'block', flex: 'none', width: size, height: size }}>
            <svg style={{ position: 'absolute', top: 0, left: 0 }} width={size} height={size} viewBox="0 0 24 24" fill="#E6E1D6">
              <path d={STAR_PATH} />
            </svg>
            <span style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${fillPct}%`, overflow: 'hidden' }}>
              <svg style={{ display: 'block' }} width={size} height={size} viewBox="0 0 24 24" fill="#D8A24A">
                <path d={STAR_PATH} />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** A colored dot + brand name — replaces the mockup's fictional "Home made/French made/UAE" origin tag. */
function OriginTag({ origin, dotSize = 6, fontSize = '9.5px' }) {
  const tint = brandTint(origin);
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: tint }}>
      <span style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: tint, flex: 'none' }} />
      {origin}
    </span>
  );
}

function ArrowRightIcon({ color = 'currentColor', size = 13 }) {
  return (
    <svg style={{ flex: 'none' }} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12h14" />
      <path d="m13 6.5 5.5 5.5L13 17.5" />
    </svg>
  );
}

function CheckIcon({ color = '#FFFFFF', size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.6 10 17.4 19 7.2" />
    </svg>
  );
}

function CheckCircleIcon({ color = '#1E7A5A', size = 13 }) {
  return (
    <svg style={{ flex: 'none' }} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.8 4.2 4.2L19 7.4" />
    </svg>
  );
}

/** Eyebrow label — small uppercase kicker used above every section heading. */
function Eyebrow({ children, color = '#8B5CF6', style }) {
  return (
    <span style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color, ...style }}>
      {children}
    </span>
  );
}

function SectionHeading({ children, style, color = '#4A2360' }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: sans,
        fontWeight: 600,
        fontSize: 'clamp(20px,2.1vw,26px)',
        lineHeight: 1.3,
        letterSpacing: '-0.005em',
        color,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

/**
 * Local-state "Add" control. Shows a brief visual "Added" confirmation and,
 * when given a real product + a live CartContext, actually adds it — real
 * product, real cart. Pass no onAdd to keep it purely visual (used where
 * there's nothing sensible to add, e.g. a "View again" recently-viewed link).
 */
function AddButton({ label = 'Add', addedLabel = 'Added', className = '', style, onAdd, duration = 1800 }) {
  const [added, setAdded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const trigger = useCallback(() => {
    if (onAdd) onAdd();
    setAdded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), duration);
  }, [onAdd, duration]);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={trigger}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger();
        }
      }}
      className={className}
      style={style}
    >
      {added ? addedLabel : label}
    </span>
  );
}

function InitialsAvatar({ initials, size = 36 }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        flex: 'none',
        background: 'linear-gradient(135deg,#C084FC,#8B5CF6)',
        color: '#FFFFFF',
        fontFamily: sans,
        fontSize: Math.round(size * 0.36),
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}
    >
      {initials}
    </span>
  );
}

/** A product photo, or a soft neutral placeholder if the catalog has no image for it — never a stock photo. */
function ProductImage({ src, alt, sizes }) {
  if (!src) {
    return <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#F3EDE6,#E7DFD3)' }} />;
  }
  return <Image src={src} alt={alt || ''} fill sizes={sizes} style={{ objectFit: 'cover' }} />;
}

function SectionPlaceholder({ minHeight = '260px' }) {
  return <div aria-hidden style={{ minHeight, background: '#FBFAF9' }} />;
}

/* ============================================================================
 * #provenance — "Our three houses"
 *
 * NOTE: the design's #top hero section is intentionally NOT ported here.
 * The site's existing hero banner (app/components/HeroSection.js, rendered
 * directly in app/page.js) is kept as-is on both mobile and desktop — this
 * component starts from Provenance onward.
 * ==========================================================================*/

function Provenance({ brands, products }) {
  const cards = useMemo(
    () =>
      brands
        .filter((b) => b.is_active !== false)
        .map((b, i) => {
          const brandProducts = products.filter((p) => num(p.brand_id) === num(b.id));
          const prices = brandProducts.map((p) => num(p.price)).filter((p) => p > 0);
          const min = prices.length ? Math.min(...prices) : null;
          const max = prices.length ? Math.max(...prices) : null;
          const img = [...brandProducts].sort((a, b2) => num(b2.averageRating) - num(a.averageRating))[0]?.imageUrl || null;
          const facts = [`${brandProducts.length} product${brandProducts.length === 1 ? '' : 's'}`];
          if (min != null) facts.push(min === max ? money(min) : `${money(min)} – ${money(max)}`);
          return {
            key: b.id,
            num: String(i + 1).padStart(2, '0'),
            tint: brandTint(b.name),
            title: b.name,
            body: b.description,
            facts,
            img,
          };
        }),
    [brands, products]
  );

  if (!cards.length) return <SectionPlaceholder />;

  return (
    <section
      id="provenance"
      style={{ padding: 'clamp(64px,7.6vw,118px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(38px,4.4vw,62px)' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px 44px' }}>
        <div style={{ display: 'grid', gap: '16px', maxWidth: '24ch' }}>
          <Eyebrow>Provenance</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>Our three houses.</SectionHeading>
        </div>
        <p style={{ margin: 0, maxWidth: '40ch', fontSize: '15px', fontWeight: 300, lineHeight: 1.78, color: '#6B6C82' }}>
          Every product on Naya Lumière carries the name of the house that made it. Here is who they are.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,332px),1fr))', gap: 'clamp(20px,2.4vw,34px)' }}>
        {cards.map((p) => (
          <article
            key={p.key}
            className="transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_36px_62px_-36px_rgba(58,26,74,0.44)] hover:border-[#E4DACE]"
            style={{ display: 'grid', alignContent: 'start', border: '1px solid #EFEBE4', borderRadius: '26px', background: '#FFFFFF', overflow: 'hidden' }}
          >
            <span style={{ position: 'relative', display: 'block', aspectRatio: '5/4', overflow: 'hidden', background: '#F3EDE6' }}>
              <ProductImage src={p.img} alt={p.title} sizes="(max-width: 768px) 100vw, 33vw" />
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(42,18,64,0.5) 0%,rgba(42,18,64,0) 54%)', pointerEvents: 'none' }} />
              <span
                style={{
                  position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)',
                  color: p.tint, fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.tint }} />
                {p.title}
              </span>
              <span style={{ position: 'absolute', left: 22, bottom: 14, fontFamily: serif, fontSize: 'clamp(48px,4.6vw,66px)', lineHeight: 0.78, color: 'rgba(255,255,255,0.95)' }}>
                {p.num}
              </span>
            </span>
            <div style={{ display: 'grid', gap: '14px', padding: 'clamp(24px,2.5vw,32px)' }}>
              <h3 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: 'clamp(27px,2.6vw,34px)', lineHeight: 1.06, letterSpacing: '-0.01em', color: '#4A2360' }}>
                {p.title}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: '#6B6C82' }}>{p.body}</p>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 18px', borderTop: '1px solid #F4F1EA', paddingTop: '15px', fontSize: '11px', fontWeight: 400, letterSpacing: '0.02em', color: '#8C8DA2' }}>
                {p.facts.map((f) => <span key={f}>{f}</span>)}
              </span>
              <Link
                href="/collections"
                className="hover:text-[#8B5CF6]"
                style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: '9px', marginTop: '2px', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4A2360', borderBottom: '1px solid #DCD3EE', paddingBottom: '4px' }}
              >
                Explore {p.title.split(' ')[0]}
                <ArrowRightIcon />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ============================================================================
 * #topsellers — real in-stock products, ranked by real reviews/rating.
 * (The mockup's live-viewer counter and "sold in the last 24h" stat had no
 * real backing data anywhere in this app and have been removed rather than
 * re-faked; per-product urgency now comes from the real stock_quantity.)
 * ==========================================================================*/

function stockUrgency(stock) {
  if (stock <= 0) return { note: 'Out of stock', ink: '#B4483C' };
  if (stock <= 5) return { note: `Only ${stock} left`, ink: '#B4483C' };
  if (stock <= 15) return { note: 'Selling fast', ink: '#8A5E22' };
  return { note: 'In stock', ink: '#1E7A5A' };
}

function TopSellers({ items, onAdd }) {
  if (!items.length) return null;

  return (
    <section id="topsellers" style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', display: 'grid', gap: 'clamp(26px,3vw,40px)', background: '#FBFAF9' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'grid', gap: '13px', maxWidth: '34ch' }}>
          <Eyebrow>Loved by the Circle</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>Top sellers</SectionHeading>
        </div>
        <Link href="/collections" className="hover:text-[#8B5CF6]" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4A2360' }}>
          See all →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,232px),1fr))', gap: 'clamp(12px,1.4vw,18px)' }}>
        {items.map((t, i) => {
          const stock = num(t.stock_quantity);
          const urgency = stockUrgency(stock);
          const reviewCount = num(t.reviewCount);
          const rating = num(t.averageRating);
          const outOfStock = stock <= 0;
          return (
            <article
              key={t.id}
              className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-34px_rgba(58,26,74,0.5)] hover:border-[#E0D8CB]"
              style={{ display: 'grid', border: '1px solid #EFEBE4', borderRadius: '18px', background: '#FFFFFF', overflow: 'hidden' }}
            >
              <span style={{ position: 'relative', display: 'block', aspectRatio: '4/5', overflow: 'hidden', background: '#F3EDE6' }}>
                <ProductImage src={t.imageUrl} alt={t.name} sizes="(max-width: 768px) 50vw, 25vw" />
                <span style={{ position: 'absolute', top: 11, left: 11, display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: '#4A2360', color: '#FFFFFF', fontSize: '11px', fontWeight: 600 }}>
                  {i + 1}
                </span>
              </span>
              <span style={{ display: 'grid', gap: '7px', padding: '15px 16px 17px' }}>
                <OriginTag origin={t.brand} />
                <Link href={t.slug ? `/product/${t.slug}` : '/collections'} className="hover:text-[#8B5CF6]" style={{ fontSize: '15.5px', fontWeight: 600, letterSpacing: '-0.01em', color: '#4A2360' }}>
                  {t.name}
                </Link>
                {reviewCount > 0 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StarRow rating={rating} size={11} />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#4A2360', fontVariantNumeric: 'tabular-nums' }}>{rating.toFixed(1)}</span>
                    <span style={{ fontSize: '11px', fontWeight: 300, color: '#8C8DA2', fontVariantNumeric: 'tabular-nums' }}>({reviewCount})</span>
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 300, color: '#9A9BB0' }}>No reviews yet</span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{money(t.price)}</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 500, color: urgency.ink }}>{urgency.note}</span>
                </span>
                {!outOfStock && (
                  <AddButton
                    className="cursor-pointer justify-self-start transition-colors duration-300 hover:bg-[#4A2360] hover:border-[#4A2360] hover:text-white"
                    style={{ marginTop: '4px', border: '1px solid #E3E0EC', borderRadius: '999px', padding: '9px 17px', fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#4A2360' }}
                    onAdd={() => onAdd(t)}
                  />
                )}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================================
 * #reviews — real aggregate (derived from every product's real reviewCount /
 * averageRating) + real per-product reviews fetched from /api/reviews for
 * whichever products actually have any (there are only a couple today; the
 * section is designed to look intentional with however many exist).
 * ==========================================================================*/

function Reviews({ products }) {
  const reviewedProducts = useMemo(() => products.filter((p) => num(p.reviewCount) > 0), [products]);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (reviewedProducts.length === 0) {
      setCards([]);
      return undefined;
    }
    Promise.all(
      reviewedProducts.slice(0, 8).map((p) =>
        fetch(`/api/reviews?product_id=${p.id}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((list) => (Array.isArray(list) ? list : []).map((rv) => ({ ...rv, productName: p.name, productSlug: p.slug })))
          .catch(() => [])
      )
    ).then((results) => {
      if (cancelled) return;
      const flat = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setCards(flat.slice(0, 6));
    });
    return () => {
      cancelled = true;
    };
  }, [reviewedProducts]);

  const totalReviews = useMemo(() => products.reduce((s, p) => s + num(p.reviewCount), 0), [products]);
  const avgRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    const weighted = products.reduce((s, p) => s + num(p.averageRating) * num(p.reviewCount), 0);
    return weighted / totalReviews;
  }, [products, totalReviews]);

  return (
    <section id="reviews" style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(26px,3vw,40px)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'grid', gap: '13px', maxWidth: '34ch' }}>
          <Eyebrow>Verified reviews</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>What customers say</SectionHeading>
        </div>
      </div>

      {totalReviews > 0 ? (
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(22px,2.8vw,40px)',
            padding: 'clamp(24px,2.8vw,34px)', border: '1px solid #EFEBE4', borderRadius: '22px', background: '#FBFAF9',
          }}
        >
          <div style={{ display: 'grid', gap: '9px', justifyItems: 'start' }}>
            <span style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(46px,5vw,62px)', lineHeight: 0.84, letterSpacing: '-0.02em', color: '#4A2360' }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: '13px', fontWeight: 300, color: '#8C8DA2', paddingBottom: '6px' }}>/ 5</span>
            </span>
            <PartialStarRow rating={avgRating} />
            <span style={{ fontSize: '12px', fontWeight: 300, color: '#6B6C82' }}>
              <strong style={{ fontWeight: 600, color: '#4A2360', fontVariantNumeric: 'tabular-nums' }}>{totalReviews}</strong> verified review{totalReviews === 1 ? '' : 's'}
            </span>
          </div>
          <span style={{ maxWidth: '34ch', fontSize: '12.5px', fontWeight: 300, lineHeight: 1.65, color: '#8C8DA2' }}>
            Reviews are collected directly from Naya Lumière customers — nothing here is gifted or incentivised.
          </span>
        </div>
      ) : (
        <div style={{ padding: 'clamp(24px,2.8vw,34px)', border: '1px solid #EFEBE4', borderRadius: '22px', background: '#FBFAF9', fontSize: '13.5px', fontWeight: 300, color: '#6B6C82' }}>
          No reviews yet — be the first to leave one after your order arrives.
        </div>
      )}

      {cards.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,290px),1fr))', gap: 'clamp(14px,1.6vw,20px)', alignItems: 'start' }}>
          {cards.map((r) => (
            <article
              key={r.id}
              className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-34px_rgba(58,26,74,0.5)] hover:border-[#E0D8CB]"
              style={{ display: 'grid', gap: '14px', alignContent: 'start', padding: 'clamp(20px,2.2vw,26px)', border: '1px solid #EFEBE4', borderRadius: '20px', background: '#FFFFFF' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <StarRow rating={r.rating} />
                <span style={{ fontSize: '11px', fontWeight: 300, color: '#9A9BB0', whiteSpace: 'nowrap' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </span>
              <span style={{ fontFamily: serif, fontSize: '20px', lineHeight: 1.3, color: '#4A2360' }}>{r.comment}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '11px', borderTop: '1px solid #F4F1EA', paddingTop: '14px' }}>
                <InitialsAvatar initials={initialsFromName(r.username)} />
                <span style={{ display: 'grid', gap: '3px', minWidth: 0 }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#4A2360' }}>{r.username}</span>
                  <span style={{ fontSize: '11px', fontWeight: 300, color: '#8C8DA2' }}>Naya Lumière customer</span>
                </span>
              </span>
              <Link
                href={r.productSlug ? `/product/${r.productSlug}` : '/collections'}
                className="hover:text-[#8B5CF6]"
                style={{ justifySelf: 'start', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#4A2360', borderBottom: '1px solid #E3E0EC', paddingBottom: '3px' }}
              >
                on {r.productName}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================================
 * #signature — the 3 real "Fragrence"-category perfumes.
 * ==========================================================================*/

function Signature({ items, onAdd }) {
  const [sigIdx, setSigIdx] = useState(0);
  if (!items.length) return null;
  const idx = Math.min(sigIdx, items.length - 1);
  const sig = items[idx];
  const tint = brandTint(sig.brand);
  const notes = sig.ingredients ? truncate(sig.ingredients, 140) : null;
  const format = [sig.size, sig.form].filter(Boolean).join(' · ') || null;

  return (
    <section
      id="signature"
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(152deg,#FCF8F3 0%,#F4E7DA 54%,#EEDACA 100%)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', alignItems: 'stretch',
      }}
    >
      <div style={{ display: 'grid', alignContent: 'center', gap: 'clamp(20px,2.4vw,30px)', padding: 'clamp(40px,5vw,84px)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A5E22' }}>
          <span style={{ width: 22, height: 1, background: '#C79A4E' }} />
          Signature selection
        </span>
        <h2 style={{ margin: 0, fontFamily: sans, fontWeight: 600, fontSize: 'clamp(24px,2.6vw,32px)', lineHeight: 1.24, letterSpacing: '-0.01em', color: '#4A2360' }}>
          {sig.name}
        </h2>
        {sig.description && (
          <p style={{ margin: 0, maxWidth: '38ch', fontSize: '14.5px', fontWeight: 300, lineHeight: 1.75, color: '#5E5348' }}>{truncate(sig.description, 220)}</p>
        )}

        {items.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {items.map((s, i) => {
              const on = i === idx;
              return (
                <span
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSigIdx(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSigIdx(i); } }}
                  style={{
                    cursor: 'pointer', padding: '11px 20px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
                    letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    border: `1px solid ${on ? '#4A2360' : '#DCD2C4'}`, background: on ? '#4A2360' : 'transparent', color: on ? '#FFFFFF' : '#4A2360',
                    transition: 'border-color .25s ease, background .25s ease, color .25s ease',
                  }}
                >
                  {shortLabel(s.name)}
                </span>
              );
            })}
          </div>
        )}

        <div style={{ display: 'grid', gap: 0, maxWidth: 430 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', padding: '13px 0', borderTop: '1px solid #E4D2C1', fontSize: '13px', fontWeight: 300, color: '#5E5348' }}>
            Brand
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase', color: tint }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: tint }} />
              {sig.brand}
            </span>
          </span>
          {notes && (
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', padding: '13px 0', borderTop: '1px solid #E4D2C1', fontSize: '13px', fontWeight: 300, color: '#5E5348' }}>
              Notes<span style={{ fontWeight: 400, color: '#4A2360', textAlign: 'right' }}>{notes}</span>
            </span>
          )}
          {format && (
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', padding: '13px 0', borderTop: '1px solid #E4D2C1', borderBottom: '1px solid #E4D2C1', fontSize: '13px', fontWeight: 300, color: '#5E5348' }}>
              Format<span style={{ fontWeight: 400, color: '#4A2360' }}>{format}</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px' }}>
          <span style={{ fontFamily: serif, fontSize: '30px', lineHeight: 1, color: '#4A2360' }}>{money(sig.price)}</span>
          {num(sig.stock_quantity) > 0 ? (
            <AddButton
              label="Add to bag"
              addedLabel="Added to bag"
              className="cursor-pointer transition-colors duration-300 hover:bg-[#2A1240]"
              style={{ whiteSpace: 'nowrap', background: '#4A2360', color: '#FFFFFF', padding: '16px 32px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
              onAdd={() => onAdd(sig)}
            />
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#B4483C' }}>Out of stock</span>
          )}
        </div>
      </div>

      <span style={{ position: 'relative', display: 'block', minHeight: 'clamp(340px,52vh,620px)', background: '#F3EDE6' }}>
        <ProductImage src={sig.imageUrl} alt={sig.name} sizes="(max-width: 768px) 100vw, 50vw" />
      </span>
    </section>
  );
}

/* ============================================================================
 * #collections — "The house essentials": 4 real, in-stock, category-varied products.
 * ==========================================================================*/

function Essentials({ items, onAdd }) {
  if (!items.length) return null;
  return (
    <section id="collections" style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(30px,3.6vw,46px)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'grid', gap: '13px' }}>
          <Eyebrow>Across the house</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>The house essentials</SectionHeading>
        </div>
        <Link href="/collections" className="hover:text-[#8B5CF6]" style={{ whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#4A2360', borderBottom: '1px solid #DCD3EE', paddingBottom: '3px' }}>
          View all products
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'clamp(16px,2vw,26px)' }}>
        {items.map((p) => (
          <article key={p.id} style={{ display: 'grid', gap: '16px' }}>
            <span style={{ position: 'relative', display: 'block', aspectRatio: '4/5', borderRadius: '16px', overflow: 'hidden', background: '#F3EDE6' }}>
              <ProductImage src={p.imageUrl} alt={p.name} sizes="(max-width: 768px) 50vw, 25vw" />
              <span
                style={{
                  position: 'absolute', top: 12, left: 12, zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 3px 12px -6px rgba(58,26,74,0.6)',
                  fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: brandTint(p.brand),
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: brandTint(p.brand) }} />
                {p.brand}
              </span>
            </span>
            <div style={{ display: 'grid', gap: '7px' }}>
              <Link href={p.slug ? `/product/${p.slug}` : '/collections'} style={{ display: 'block' }}>
                <h3 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: '23px', lineHeight: 1.2, color: '#4A2360' }}>{p.name}</h3>
              </Link>
              {(p.size || p.form) && (
                <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 300, color: '#6B6C82' }}>{[p.size, p.form].filter(Boolean).join(' · ')}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '5px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#4A2360' }}>{money(p.price)}</span>
                <AddButton
                  className="cursor-pointer transition-colors duration-300 hover:bg-[#4A2360] hover:border-[#4A2360] hover:text-white"
                  style={{ border: '1px solid #E3E0EC', borderRadius: '999px', padding: '9px 17px', fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#4A2360' }}
                  onAdd={() => onAdd(p)}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ============================================================================
 * #routine — "Build your routine": real Cleanse/Treat/Protect category
 * mapping (Makeup Removal / Cleansing → Anti-Aging / Serums → Lifting &
 * Firming) and real skin-concern chips from the live `concerns` table.
 * ==========================================================================*/

function StepOptionCard({ option, active, onPick }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } }}
      className="cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        display: 'grid', gridTemplateColumns: '19px 1fr auto', alignItems: 'start', columnGap: '15px', rowGap: '8px',
        padding: '15px 18px', borderRadius: '15px',
        border: `1px solid ${active ? '#8B5CF6' : '#EFEDF4'}`,
        background: active ? '#F7F2FE' : '#FFFFFF',
        boxShadow: active ? '0 16px 30px -22px rgba(58,26,74,0.6)' : 'none',
        transition: 'border-color .25s ease, background .25s ease, box-shadow .3s ease',
      }}
    >
      <span
        style={{
          marginTop: 3, width: 19, height: 19, borderRadius: '50%', display: 'grid', placeItems: 'center',
          border: `1px solid ${active ? '#8B5CF6' : '#DCD8E8'}`, background: active ? '#8B5CF6' : 'transparent',
        }}
      >
        {active && <CheckIcon />}
      </span>
      <span style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 11px' }}>
          <span style={{ fontFamily: serif, fontSize: '21px', lineHeight: 1.1, color: '#4A2360' }}>{option.name}</span>
          <OriginTag origin={option.brand} />
        </span>
        {option.recommended && (
          <span style={{ justifySelf: 'start', padding: '5px 11px', borderRadius: '999px', background: '#F1EBFD', color: '#6D3FD1', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Matches your concern
          </span>
        )}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#4A2360', whiteSpace: 'nowrap', marginTop: '2px' }}>{money(option.price)}</span>
    </span>
  );
}

function Routine({ routine, onAddRoutine }) {
  const {
    stepOptions, concernOptions, concern, setConcern,
    cleanseIdx, treatIdx, protectIdx, pick,
    gross, save, total, routineAdded,
    tabbyFirst, tabbyRest, routinePoints,
  } = routine;

  const indices = { cleanse: cleanseIdx, treat: treatIdx, protect: protectIdx };
  const treatOption = stepOptions.treat[treatIdx];
  const cleanseOption = stepOptions.cleanse[cleanseIdx];
  const protectOption = stepOptions.protect[protectIdx];
  const concernLabel = concern.key === 'all' ? 'balanced for the whole face' : `tuned for ${concern.label.toLowerCase()}`;

  if (!treatOption || !cleanseOption || !protectOption) return null;

  return (
    <section
      id="routine"
      style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', background: 'linear-gradient(178deg,#FBF8F4 0%,#FAF6F1 62%,#F8F4EF 100%)', display: 'grid', gap: 'clamp(30px,3.6vw,46px)' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
        <div style={{ display: 'grid', gap: '14px', maxWidth: '30ch' }}>
          <Eyebrow>Build your routine</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>A routine, three steps.</SectionHeading>
        </div>
        <div style={{ display: 'grid', gap: '14px', maxWidth: '36ch' }}>
          <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 300, lineHeight: 1.75, color: '#6B6C82' }}>
            Choose one from each step. Mix products across our three houses as you like — we price the trio as a bundle.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '9px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6B6C82', marginRight: '6px' }}>Skin concern</span>
        {concernOptions.map((c) => {
          const on = concern.key === c.key;
          return (
            <span
              key={c.key}
              role="button"
              tabIndex={0}
              onClick={() => setConcern(c)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setConcern(c); } }}
              className="cursor-pointer transition-colors duration-300"
              style={{
                whiteSpace: 'nowrap', padding: '10px 17px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                border: `1px solid ${on ? '#4A2360' : '#E3E0EC'}`, background: on ? '#4A2360' : '#FFFFFF', color: on ? '#FFFFFF' : '#3A3B4F',
              }}
            >
              {c.label}
            </span>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 'clamp(20px,2.6vw,34px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 'clamp(24px,3vw,50px)', alignItems: 'start' }}>
          {/* Sticky treat-image panel */}
          <div className="lg:sticky" style={{ display: 'grid', gap: '16px', top: 104 }}>
            <span
              style={{
                position: 'relative', display: 'block', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden',
                background: 'linear-gradient(162deg,#FFFFFF 0%,#FAF6F1 100%)',
                boxShadow: '0 44px 76px -50px rgba(58,26,74,0.42), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <Image
                src={IMG.routineTreat}
                alt="Applying the eye treatment with a spatula"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectFit: 'cover', objectPosition: '52% 13%' }}
              />
              <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to top,#FAF6F1 0%,rgba(250,246,241,0.86) 13%,rgba(250,246,241,0) 40%)' }} />
              <span style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 13px', borderRadius: '999px', background: 'rgba(255,255,255,0.94)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#4A2360' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#8B5CF6' }} />
                Step 02 · Treat
              </span>
              <span
                style={{
                  position: 'absolute', left: 16, right: 16, bottom: 16, display: 'grid', gap: '9px', padding: '16px 18px', borderRadius: '18px',
                  background: 'rgba(255,255,255,0.93)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 34px -26px rgba(58,26,74,0.4)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9A8E7E' }}>On skin now</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#4A2360' }}>{money(treatOption.price)}</span>
                </span>
                <span style={{ fontFamily: serif, fontSize: '23px', lineHeight: 1.1, color: '#4A2360' }}>{treatOption.name}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: brandTint(treatOption.brand) }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: brandTint(treatOption.brand) }} />
                  {treatOption.brand}
                  <span style={{ fontWeight: 400, letterSpacing: '0.03em', textTransform: 'none', color: '#6B6C82' }}>{concernLabel}</span>
                </span>
              </span>
            </span>
          </div>

          {/* Step lists */}
          <div style={{ display: 'grid', gap: 'clamp(22px,2.6vw,32px)' }}>
            {['cleanse', 'treat', 'protect'].map((step) => {
              const meta = ROUTINE_CATEGORIES[step];
              const options = stepOptions[step];
              if (!options.length) return null;
              return (
                <div key={step} style={{ display: 'grid', gap: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                    <span style={{ fontFamily: serif, fontSize: '16px', lineHeight: 1, color: '#C0A9E8' }}>{String(['cleanse', 'treat', 'protect'].indexOf(step) + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A2360' }}>{meta.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 300, color: '#A79CB4' }}>{meta.when}</span>
                    <span style={{ flex: 1, height: 1, background: '#EAE2F0' }} />
                  </span>
                  {options.map((o, i) => (
                    <StepOptionCard
                      key={o.id}
                      option={{ ...o, recommended: concern.key !== 'all' && (o.concern_ids || []).map(Number).includes(Number(concern.id)) }}
                      active={indices[step] === i}
                      onPick={() => pick(step, i)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Routine summary card */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 'clamp(22px,2.6vw,40px)', alignItems: 'center',
            padding: 'clamp(26px,3vw,38px)', borderRadius: '22px', border: '1px solid #EBE1F1',
            background: 'radial-gradient(130% 150% at 6% 0%,#FFFFFF 0%,#FBF7FF 44%,#F3ECFB 100%)',
            boxShadow: '0 32px 62px -46px rgba(58,26,74,0.5), inset 0 1px 0 rgba(255,255,255,0.9)', color: '#4A2360',
          }}
        >
          <div style={{ display: 'grid', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7C4DC4' }}>Your routine</span>
              <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9A8E7E' }}>3 items</span>
            </span>
            <div style={{ display: 'grid' }}>
              <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '14px', padding: '11px 0', borderTop: '1px solid rgba(74,35,96,0.14)', fontSize: '13px', fontWeight: 400 }}>
                Cleanse<span style={{ fontWeight: 300, color: '#6B5A7C' }}>{cleanseOption.name}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '14px', padding: '11px 0', borderTop: '1px solid rgba(74,35,96,0.14)', fontSize: '13px', fontWeight: 400 }}>
                Treat<span style={{ fontWeight: 300, color: '#6B5A7C' }}>{treatOption.name}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '14px', padding: '11px 0', borderTop: '1px solid rgba(74,35,96,0.14)', borderBottom: '1px solid rgba(74,35,96,0.14)', fontSize: '13px', fontWeight: 400 }}>
                Protect<span style={{ fontWeight: 300, color: '#6B5A7C' }}>{protectOption.name}</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '9px' }}>
            <span style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6B5A7C' }}>Routine price</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(34px,4vw,44px)', lineHeight: 1, color: '#4A2360' }}>{money(total)}</span>
              <span style={{ fontSize: '14px', fontWeight: 300, color: '#6E6080', textDecoration: 'line-through' }}>{money(gross)}</span>
            </span>
            <span style={{ justifySelf: 'start', padding: '6px 12px', borderRadius: '999px', background: '#E4F6EE', color: '#12664B', fontSize: '11px', fontWeight: 600 }}>
              Routine bundle — save {money(save)}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.6, color: '#6B5A7C' }}>4 payments with Tabby — {money(tabbyFirst)} today, then {money(tabbyRest)}</span>
            <span style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.6, color: '#6B5A7C' }}>Earns {routinePoints} points</span>
          </div>

          <AddButton
            label="Add routine to bag"
            addedLabel={routineAdded ? 'Added to bag' : 'Add routine to bag'}
            onAdd={() => onAddRoutine([cleanseOption, treatOption, protectOption])}
            className="cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
            style={{
              alignSelf: 'center', textAlign: 'center', whiteSpace: 'nowrap', background: 'linear-gradient(90deg,#C084FC 0%,#8B5CF6 100%)', color: '#FFFFFF',
              padding: '15px 26px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              boxShadow: '0 14px 30px -16px rgba(139,92,246,0.9)',
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * #foryou — real personalization where it exists (browser's recently-viewed
 * history, via the real useRecentlyViewed() hook), otherwise a plain,
 * honestly-labelled suggestion of other real products.
 * ==========================================================================*/

function ForYou({ fallbackProducts, onAdd }) {
  const { items, hydrated } = useRecentlyViewed();

  if (!hydrated) return null;
  const recent = items.slice(0, 3);
  const usingRecent = recent.length > 0;
  const list = usingRecent ? recent : fallbackProducts.slice(0, 3);
  if (list.length === 0) return null;

  return (
    <section id="foryou" style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(28px,3.4vw,42px)' }}>
      <div style={{ display: 'grid', gap: '13px' }}>
        <Eyebrow>{usingRecent ? 'Recently viewed' : 'You might also like'}</Eyebrow>
        <SectionHeading style={{ fontFamily: sans }}>{usingRecent ? 'Pick up where you left off.' : 'A few more from the house.'}</SectionHeading>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(16px,2vw,26px)' }}>
        {list.map((p) => {
          const brand = p.brand || p.brandName || '';
          const stock = num(p.stock_quantity);
          return (
            <article
              key={p.id}
              className="transition-all duration-300 hover:border-[#D9CDF4] hover:-translate-y-1"
              style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: '18px', alignItems: 'center', padding: '16px', border: '1px solid #EFEDF4', borderRadius: '18px' }}
            >
              <span style={{ position: 'relative', display: 'block', width: 104, aspectRatio: '4/5', borderRadius: '12px', overflow: 'hidden', background: '#F3EDE6' }}>
                <ProductImage src={p.imageUrl} alt={p.name} sizes="104px" />
              </span>
              <span style={{ display: 'grid', gap: '7px' }}>
                {brand && <OriginTag origin={brand} fontSize="9.5px" />}
                <Link href={p.slug ? `/product/${p.slug}` : '/collections'}>
                  <span style={{ fontFamily: serif, fontSize: '21px', lineHeight: 1.15, color: '#4A2360' }}>{p.name}</span>
                </Link>
                <span style={{ fontSize: '12.5px', fontWeight: 300, color: '#6B6C82' }}>{money(p.price)}</span>
                {stock > 0 ? (
                  <AddButton
                    label="Add to bag"
                    className="justify-self-start cursor-pointer whitespace-nowrap"
                    style={{ marginTop: '3px', fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid #DCD3EE', paddingBottom: '3px', color: '#4A2360' }}
                    onAdd={() => onAdd(p)}
                  />
                ) : (
                  <span style={{ fontSize: '10.5px', fontWeight: 500, color: '#B4483C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Out of stock</span>
                )}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================================
 * #circle — the real 3-tier loyalty ladder (Silver/Gold/Platinum, lifetime
 * AED spend), matching app/account/loyalty/page.js exactly. The mockup's
 * fictional 4th "Diamond" tier and point-based thresholds have been dropped.
 * ==========================================================================*/

const TIERS = [
  {
    roman: 'I', name: 'Silver', code: 'NL–01', min: 0, multiplier: 1,
    metal: 'linear-gradient(135deg,#EDEFF3,#B9BEC9 45%,#FBFCFE 60%,#A9AEBA)', ink: '#3D4250',
    long: 'Earn 1 point per AED spent, redeemable at checkout, plus a birthday gift every year.',
  },
  {
    roman: 'II', name: 'Gold', code: 'NL–02', min: 2000, multiplier: 1.5,
    metal: 'linear-gradient(135deg,#F6E9C2,#C9A85C 45%,#FAF1D8 60%,#B4913F)', ink: '#5C4718', badge: true,
    long: 'Everything in Silver, plus 1.5× points, free shipping and early access to new editions.',
  },
  {
    roman: 'III', name: 'Platinum', code: 'NL–03', min: 5000, multiplier: 2,
    metal: 'linear-gradient(135deg,#F4EEFF,#A899CC 44%,#FCFAFF 60%,#8878B0)', ink: '#3A2A5C',
    long: 'Everything in Gold, plus 2× points, exclusive samples and priority support.',
  },
];

const REAL_PERKS = ['Points never expire', 'Free shipping from Gold', 'Exclusive samples at Platinum'];

function Circle({ loyaltyData }) {
  const currentTierName = loyaltyData?.stats?.tier;
  const defaultIdx = Math.max(0, TIERS.findIndex((t) => t.name === currentTierName));
  const [plateIdx, setPlateIdx] = useState(defaultIdx);

  return (
    <section id="circle" style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', background: '#FFFFFF' }}>
      <div
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: '26px',
          background: 'linear-gradient(112deg,#F5EFFF 0%,#F3EDE6 58%,#EFE7FB 100%)', border: '1px solid #EAE3F5',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 26px 48px -30px rgba(58,26,74,0.34), 0 64px 90px -60px rgba(58,26,74,0.26)',
          padding: 'clamp(30px,3.8vw,52px)', display: 'grid', gap: 'clamp(24px,2.8vw,36px)',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute', left: '-6%', bottom: '-30%', width: '34%', aspectRatio: '405/352', opacity: 0.09,
            WebkitMaskImage: `url(${IMG.lotusMask})`, WebkitMaskPosition: 'center', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat',
            maskImage: `url(${IMG.lotusMask})`, maskPosition: 'center', maskSize: 'contain', maskRepeat: 'no-repeat',
            background: '#5B21B6', pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '26px 44px' }}>
          <div style={{ display: 'grid', gap: '13px', maxWidth: '36ch' }}>
            <Eyebrow>Membership</Eyebrow>
            <SectionHeading style={{ fontFamily: sans }}>The Circle rewards you.</SectionHeading>
            <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 300, lineHeight: 1.75, color: '#5C5A70' }}>
              Three tiers, based on your lifetime spend. Points never expire, and every tier keeps what came before.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/auth" className="transition-colors duration-300 hover:bg-[#2A1240]" style={{ whiteSpace: 'nowrap', background: '#4A2360', color: '#FFFFFF', padding: '16px 30px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Sign in
            </Link>
            <Link href="/account/loyalty" className="transition-colors duration-300 hover:bg-[#4A2360] hover:text-white" style={{ whiteSpace: 'nowrap', border: '1px solid #4A2360', color: '#4A2360', padding: '16px 30px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              See the tiers
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ position: 'relative', gap: 'clamp(12px,1.4vw,16px)' }}>
          {TIERS.map((p, i) => {
            const on = plateIdx === i;
            return (
              <span
                key={p.name}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => setPlateIdx(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPlateIdx(i); } }}
                className="cursor-pointer transition-all duration-300 hover:border-[#B7A6D6] hover:-translate-y-1"
                style={{
                  display: 'grid', alignContent: 'start', gap: '15px', padding: '16px 16px 19px', borderRadius: '20px',
                  border: `1px solid ${on ? '#B08FD8' : 'rgba(74,35,96,0.12)'}`,
                  background: on ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.44)',
                  boxShadow: on ? '0 16px 30px -22px rgba(58,26,74,0.45)' : 'none',
                }}
              >
                <span
                  style={{
                    position: 'relative', display: 'grid', gridTemplateRows: 'auto 1fr auto', width: '100%', aspectRatio: '1.586',
                    borderRadius: '11px', overflow: 'hidden', padding: '11px 12px', background: p.metal, opacity: on ? 1 : 0.72,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 -14px 28px -18px rgba(30,22,10,0.45)',
                  }}
                >
                  <span style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none', background: 'repeating-linear-gradient(112deg,rgba(255,255,255,0.3) 0 1px,rgba(255,255,255,0) 1px 6px)' }} />
                  <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(102deg,rgba(255,255,255,0) 28%,rgba(255,255,255,0.38) 46%,rgba(255,255,255,0) 62%)' }} />
                  <span style={{ position: 'relative', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: p.ink, opacity: 0.86 }}>Naya Lumière</span>
                  <span
                    style={{
                      position: 'relative', alignSelf: 'center', width: 24, aspectRatio: '1.32', borderRadius: '3.5px',
                      background: 'linear-gradient(135deg,#F7E9BE,#D8BC76 48%,#FBF3DA 62%,#C2A356)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5), 0 1px 2px rgba(30,22,10,0.26)',
                      display: 'grid', gridTemplate: 'repeat(2,1fr)/repeat(3,1fr)',
                    }}
                  >
                    <span style={{ borderRight: '1px solid rgba(96,72,22,0.28)', borderBottom: '1px solid rgba(96,72,22,0.28)' }} />
                    <span style={{ borderBottom: '1px solid rgba(96,72,22,0.28)' }} />
                    <span style={{ borderLeft: '1px solid rgba(96,72,22,0.28)', borderBottom: '1px solid rgba(96,72,22,0.28)' }} />
                    <span style={{ borderRight: '1px solid rgba(96,72,22,0.28)' }} />
                    <span />
                    <span style={{ borderLeft: '1px solid rgba(96,72,22,0.28)' }} />
                  </span>
                  <span style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontFamily: serif, fontSize: '19px', fontWeight: 300, lineHeight: 0.9, color: p.ink, textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>{p.roman}</span>
                    <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: p.ink, opacity: 0.82, fontVariantNumeric: 'tabular-nums' }}>{p.code}</span>
                  </span>
                </span>

                <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, letterSpacing: '-0.005em', color: on ? '#4A2360' : '#5C5A70' }}>{p.name}</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.03em', color: on ? '#7C4DBE' : '#8C8DA2', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {p.min === 0 ? 'From AED 0' : `From AED ${p.min.toLocaleString()}`}
                  </span>
                </span>

                <span style={{ display: 'grid', gap: '9px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.6, color: on ? '#4C4860' : '#7B788C' }}>{p.long}</span>
                  {p.badge && (
                    <span style={{ justifySelf: 'start', padding: '5px 11px', borderRadius: '999px', background: 'rgba(139,92,246,0.13)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5B21B6' }}>
                      Most held tier
                    </span>
                  )}
                </span>
              </span>
            );
          })}
        </div>

        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '11px 28px', borderTop: '1px solid rgba(74,35,96,0.12)', paddingTop: '18px' }}>
          {REAL_PERKS.map((perk) => (
            <span key={perk} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12px', fontWeight: 400, color: '#4C4860' }}>
              <span style={{ flex: 'none', width: 5, height: 5, borderRadius: '50%', background: '#8B5CF6' }} />
              {perk}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * #pay — "Pay your way. Keep your points." Generic payment/trust messaging,
 * not product data — fed the real routine total computed above.
 * ==========================================================================*/

const PAY_FACTS = [
  '0% interest, zero fees — never a late charge',
  '3-D Secure 2.0 and PCI DSS Level 1 processing',
  'Card details tokenised — we never see or store them',
  'Free returns within 14 days, collected from your door',
];

const PAY_METHODS = ['VISA', 'Mastercard', 'Amex', 'Apple Pay', 'Cash on delivery'];

function Pay({ routine }) {
  const { total, tabbyFirst, tabbyRest, tabbyPlan, cardPoints, spendPct, spendMsg } = routine;

  return (
    <section id="pay" style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', display: 'grid', gap: 'clamp(28px,3.4vw,44px)', background: '#FBFAF9' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '22px 44px' }}>
        <div style={{ display: 'grid', gap: '13px', maxWidth: '30ch' }}>
          <Eyebrow>Payments &amp; security</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>Pay your way. Keep your points.</SectionHeading>
        </div>
        <p style={{ margin: 0, flex: '1 1 340px', maxWidth: '46ch', fontSize: '14.5px', fontWeight: 300, lineHeight: 1.75, color: '#6B6C82' }}>
          Two routes, one price. Split any order over six weeks at no cost, or settle in full by card — the full order value earns points either way, and no card number ever touches our servers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 'clamp(14px,1.6vw,20px)', alignItems: 'stretch' }}>
        {/* Tabby split card */}
        <article style={{ display: 'grid', gap: '22px', alignContent: 'start', padding: 'clamp(24px,2.6vw,34px)', borderRadius: '24px', background: 'linear-gradient(158deg,#D6FBEC 0%,#B4F2DA 44%,#8FE9C6 100%)', color: '#0B3B2C', position: 'relative', overflow: 'hidden' }}>
          <span
            aria-hidden
            style={{
              position: 'absolute', right: '-14%', bottom: '-30%', width: '46%', aspectRatio: '405/352', opacity: 0.16,
              WebkitMaskImage: `url(${IMG.lotusMask})`, WebkitMaskPosition: 'center', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat',
              maskImage: `url(${IMG.lotusMask})`, maskPosition: 'center', maskSize: 'contain', maskRepeat: 'no-repeat',
              background: '#0B3B2C', pointerEvents: 'none',
            }}
          />
          <span style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0E5A42' }}>Split it</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 8px 6px 13px', borderRadius: '999px', background: 'rgba(255,255,255,0.6)' }}>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.03em', color: '#1B5D48' }}>with</span>
              <span style={{ display: 'grid', placeItems: 'center', padding: '5px 11px', borderRadius: '999px', background: '#3FDCA0', color: '#0B3B2C', fontSize: '12px', fontWeight: 700, letterSpacing: '0.01em', lineHeight: 1 }}>tabby</span>
            </span>
            <span style={{ padding: '6px 13px', borderRadius: '999px', background: '#0B3B2C', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8FE9C6' }}>0% interest</span>
          </span>

          <span style={{ position: 'relative', display: 'grid', gap: '7px' }}>
            <span style={{ fontFamily: serif, fontSize: 'clamp(38px,4.4vw,54px)', fontWeight: 400, lineHeight: 1 }}>{money(tabbyRest)}</span>
            <span style={{ fontSize: '13.5px', fontWeight: 400, color: '#1B5D48' }}>per payment · four payments over six weeks</span>
          </span>

          <span style={{ position: 'relative', display: 'grid', gap: '12px' }}>
            <span style={{ position: 'relative', display: 'block', height: 3, borderRadius: 3, background: 'rgba(11,59,44,0.16)' }}>
              <span style={{ position: 'absolute', inset: '0 auto 0 0', width: '12.5%', borderRadius: 3, background: '#0B3B2C' }} />
            </span>
            <span style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
              {tabbyPlan.map((t) => (
                <span key={t.when} style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.isFirst ? '#0B3B2C' : 'rgba(11,59,44,0.26)' }} />
                  <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.isFirst ? '#0E5A42' : '#1B5D48' }}>{t.when}</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 500, color: t.isFirst ? '#0B3B2C' : '#1B5D48', whiteSpace: 'nowrap' }}>{t.amount}</span>
                </span>
              ))}
            </span>
          </span>

          <span style={{ position: 'relative', display: 'grid', gap: '10px', padding: '16px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.55)' }}>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', fontSize: '12.5px', fontWeight: 400, color: '#1B5D48' }}>
              Order total<span style={{ fontWeight: 600, color: '#0B3B2C' }}>{money(total)}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', fontSize: '12.5px', fontWeight: 400, color: '#1B5D48' }}>
              Fees and interest<span style={{ fontWeight: 600, color: '#0B3B2C' }}>AED 0</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', paddingTop: '11px', borderTop: '1px solid rgba(11,59,44,0.14)', fontSize: '12.5px', fontWeight: 400, color: '#1B5D48' }}>
              Due today<span style={{ fontSize: '17px', fontWeight: 600, color: '#0B3B2C' }}>{money(tabbyFirst)}</span>
            </span>
          </span>

          <span style={{ position: 'relative', fontSize: '12.5px', fontWeight: 400, lineHeight: 1.7, color: '#1B5D48' }}>
            Approved in seconds with your Emirates ID. Nothing is added to the price.
          </span>
        </article>

        {/* Pay in full card */}
        <article style={{ display: 'grid', gap: '22px', alignContent: 'start', padding: 'clamp(24px,2.6vw,34px)', border: '1px solid #EFEBE4', borderRadius: '24px', background: '#FFFFFF' }}>
          <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7B68' }}>Pay in full</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 13px', borderRadius: '999px', border: '1px solid #E7E2DB', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5E5348' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5E5348" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.6" y="10.4" width="14.8" height="9.8" rx="3" />
                <path d="M8.2 10.4V7.9a3.8 3.8 0 0 1 7.6 0v2.5" />
              </svg>
              3-D Secure
            </span>
          </span>

          <span style={{ display: 'grid', gap: '7px' }}>
            <span style={{ fontFamily: serif, fontSize: 'clamp(38px,4.4vw,54px)', fontWeight: 400, lineHeight: 1, color: '#4A2360' }}>{money(total)}</span>
            <span style={{ fontSize: '13.5px', fontWeight: 300, color: '#6B6C82' }}>charged once · earns {cardPoints} points</span>
          </span>

          <span
            style={{
              position: 'relative', display: 'block', aspectRatio: '1.586', width: '100%', maxWidth: 330, borderRadius: '16px', overflow: 'hidden',
              background: 'linear-gradient(150deg,#EDE6FB 0%,#DCD2F5 46%,#F3ECDE 100%)', boxShadow: '0 22px 44px -30px rgba(90,64,160,0.42), inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute', right: '-12%', bottom: '-24%', width: '52%', aspectRatio: '405/352', opacity: 0.13,
                WebkitMaskImage: `url(${IMG.lotusMask})`, WebkitMaskPosition: 'center', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat',
                maskImage: `url(${IMG.lotusMask})`, maskPosition: 'center', maskSize: 'contain', maskRepeat: 'no-repeat',
                background: '#4B3B7A',
              }}
            />
            <span style={{ position: 'absolute', inset: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4B3B7A' }}>Naya Lumière</span>
                <span style={{ fontSize: '10px', fontWeight: 300, color: '#5A4E85' }}>09 / 29</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: 36, aspectRatio: '1.32', borderRadius: '5px', background: 'linear-gradient(135deg,#E8DFC6,#B9A97F 46%,#F3ECD9 62%,#A2926A)' }} />
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8B7CC0" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M8.6 6.4a8 8 0 0 1 0 11.2" />
                  <path d="M12.4 3.8a12 12 0 0 1 0 16.4" />
                </svg>
              </span>
              <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: '12.5px', letterSpacing: '0.05em', color: '#3B2F63' }}>•••• •••• •••• 4482</span>
            </span>
          </span>

          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PAY_METHODS.map((m) => (
              <span key={m} style={{ padding: '8px 14px', border: '1px solid #E7E2DB', borderRadius: '10px', fontSize: '11.5px', fontWeight: 500, color: '#5E5348' }}>{m}</span>
            ))}
          </span>

          <span style={{ fontSize: '12.5px', fontWeight: 300, lineHeight: 1.7, color: '#6B6C82' }}>
            Tokenised at the processor the moment you type it. We hold a reference, never a number.
          </span>
        </article>
      </div>

      <div style={{ display: 'grid', gap: '16px', padding: 'clamp(20px,2.2vw,28px) clamp(20px,2.4vw,32px)', border: '1px solid #EFEBE4', borderRadius: '20px', background: '#FFFFFF' }}>
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#4A2360' }}>{spendMsg}</span>
          <span style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9A8E7E' }}>Basket {money(total)}</span>
        </span>
        <span style={{ display: 'block', height: 5, borderRadius: '999px', background: '#F1EDE6', overflow: 'hidden' }}>
          <span className="transition-[width] duration-500" style={{ display: 'block', height: '100%', borderRadius: '999px', background: '#4A2360', width: `${spendPct}%` }} />
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))', gap: '14px', paddingTop: '4px' }}>
          {PAY_FACTS.map((fact) => (
            <span key={fact} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', fontSize: '12.5px', fontWeight: 300, lineHeight: 1.6, color: '#5E5348' }}>
              <CheckCircleIcon color="#8C7B68" size={15} />
              {fact}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * #social — real posts from /api/social-posts (the same endpoint the old
 * SocialFeed.js component used) + static social-handle links.
 * ==========================================================================*/

const SOCIAL_LINKS = [
  {
    label: 'Instagram', href: 'https://www.instagram.com/nayalc',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.6" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'TikTok', href: '#tiktok',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.6 4.2v9.9a3.9 3.9 0 1 1-3.3-3.85" />
        <path d="M14.6 4.2c.5 2.2 1.9 3.5 4.2 3.7" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp', href: '#whatsapp',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.6Z" />
        <path d="M9.2 9.6c.4 2.3 2.3 4.1 4.6 4.6l1-1.4 1.8.8" />
      </svg>
    ),
  },
];

function Social() {
  const [posts, setPosts] = useState([]);
  const [mailMsg, setMailMsg] = useState('');
  const mailRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/social-posts')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : Array.isArray(data?.posts) ? data.posts : [];
        setPosts(list.filter((p) => p.is_active !== false));
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = (e) => {
    e.preventDefault();
    const v = (mailRef.current && mailRef.current.value) || '';
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v.trim());
    setMailMsg(ok ? 'Welcome — first letter arrives Thursday.' : 'Enter a complete email address.');
    if (ok && mailRef.current) mailRef.current.value = '';
  };

  return (
    <section id="social" style={{ padding: 'clamp(56px,7vw,104px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(26px,3vw,38px)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'grid', gap: '13px' }}>
          <Eyebrow>@nayalc</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>From the house, daily.</SectionHeading>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="transition-colors duration-300 hover:bg-[#4A2360] hover:border-[#4A2360] hover:text-white"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap', padding: '13px 22px', border: '1px solid #E3E0EC', borderRadius: '999px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#4A2360' }}
            >
              {s.icon}
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {posts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'clamp(10px,1.4vw,16px)' }}>
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.instagram_url || 'https://www.instagram.com/nayalc'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ position: 'relative', display: 'block', aspectRatio: '1', borderRadius: '14px', overflow: 'hidden', background: '#F3EDE6' }}
            >
              <Image src={p.image_url} alt={p.caption || 'From Naya Lumière'} fill sizes="(max-width: 768px) 33vw, 16vw" style={{ objectFit: 'cover' }} />
            </a>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: '14px', maxWidth: '420px' }}>
        <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4A2360' }}>Letters from the house</span>
        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 300, lineHeight: 1.7, color: '#6B6C82' }}>New editions, restocks and rituals. Once a month, never more.</p>
        <form onSubmit={subscribe} style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', minWidth: 0 }} noValidate>
          <input
            ref={mailRef}
            type="email"
            name="newsletter"
            placeholder="Email address"
            aria-label="Email address"
            className="focus:outline-none focus:border-[#C4B5FD]"
            style={{ flex: '1 1 150px', minWidth: 0, fontFamily: sans, fontSize: '13px', fontWeight: 300, color: '#4A2360', background: '#F7F5FB', border: '1px solid #EFEDF4', borderRadius: '11px', padding: '12px 14px' }}
          />
          <button
            type="submit"
            className="cursor-pointer transition-colors duration-300 hover:bg-[#2A1240]"
            style={{ fontFamily: sans, border: 0, background: '#4A2360', color: '#FFFFFF', padding: '12px 20px', borderRadius: '11px', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          >
            Join
          </button>
        </form>
        <span aria-live="polite" style={{ fontSize: '12px', fontWeight: 300, color: '#8B5CF6', minHeight: 16 }}>{mailMsg}</span>
      </div>
    </section>
  );
}

/* ============================================================================
 * DEFAULT EXPORT — pulls real data from useAppContext(), derives every
 * section's product selection from it, and assembles the sections in order.
 * ==========================================================================*/

export default function NayaLumiereHome() {
  const { products, concerns, brands, loyaltyData } = useAppContext();
  const { addToCart } = useCart();

  const loading = !products || products.length === 0;

  const topSellers = useMemo(() => (loading ? [] : pickTopSellers(products)), [products, loading]);
  const signatureItems = useMemo(() => (loading ? [] : pickSignature(products)), [products, loading]);
  const essentials = useMemo(() => {
    if (loading) return [];
    const exclude = new Set([...topSellers.map((p) => p.id), ...signatureItems.map((p) => p.id)]);
    return pickEssentials(products, exclude);
  }, [products, loading, topSellers, signatureItems]);
  const forYouFallback = useMemo(() => {
    if (loading) return [];
    const exclude = new Set([...topSellers.map((p) => p.id), ...signatureItems.map((p) => p.id), ...essentials.map((p) => p.id)]);
    return [...products]
      .filter((p) => num(p.stock_quantity) > 0 && !exclude.has(p.id))
      .sort((a, b) => num(b.averageRating) - num(a.averageRating) || b.id - a.id);
  }, [products, loading, topSellers, signatureItems, essentials]);

  const stepOptions = useMemo(
    () => ({
      cleanse: loading ? [] : buildStepOptions(products, ROUTINE_CATEGORIES.cleanse.category),
      treat: loading ? [] : buildStepOptions(products, ROUTINE_CATEGORIES.treat.category),
      protect: loading ? [] : buildStepOptions(products, ROUTINE_CATEGORIES.protect.category),
    }),
    [products, loading]
  );

  const concernOptions = useMemo(
    () => [{ key: 'all', id: null, label: 'Everything' }, ...concerns.map((c) => ({ key: c.slug || String(c.id), id: c.id, label: c.name }))],
    [concerns]
  );

  const [concern, setConcern] = useState({ key: 'all', id: null, label: 'Everything' });
  const [cleanseIdx, setCleanseIdx] = useState(0);
  const [treatIdx, setTreatIdx] = useState(0);
  const [protectIdx, setProtectIdx] = useState(0);
  const [routineAdded, setRoutineAdded] = useState(false);
  const routineTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(routineTimerRef.current), []);

  const handleSetConcern = useCallback(
    (next) => {
      setConcern(next);
      setRoutineAdded(false);
      if (next.id == null) return;
      const matchIdx = (list) => list.findIndex((o) => (o.concern_ids || []).map(Number).includes(Number(next.id)));
      const ci = matchIdx(stepOptions.cleanse);
      if (ci > -1) setCleanseIdx(ci);
      const ti = matchIdx(stepOptions.treat);
      if (ti > -1) setTreatIdx(ti);
      const pi = matchIdx(stepOptions.protect);
      if (pi > -1) setProtectIdx(pi);
    },
    [stepOptions]
  );

  const pick = useCallback((step, i) => {
    setRoutineAdded(false);
    if (step === 'cleanse') setCleanseIdx(i);
    if (step === 'treat') setTreatIdx(i);
    if (step === 'protect') setProtectIdx(i);
  }, []);

  const handleAddRoutine = useCallback(
    (routineProducts) => {
      routineProducts.forEach((p) => {
        if (num(p.stock_quantity) > 0) addToCart(p, 1);
      });
      clearTimeout(routineTimerRef.current);
      setRoutineAdded(true);
      routineTimerRef.current = setTimeout(() => setRoutineAdded(false), 2200);
    },
    [addToCart]
  );

  const handleAddProduct = useCallback(
    (p) => {
      if (num(p.stock_quantity) > 0) addToCart(p, 1);
    },
    [addToCart]
  );

  const cleanseOption = stepOptions.cleanse[Math.min(cleanseIdx, Math.max(0, stepOptions.cleanse.length - 1))];
  const treatOption = stepOptions.treat[Math.min(treatIdx, Math.max(0, stepOptions.treat.length - 1))];
  const protectOption = stepOptions.protect[Math.min(protectIdx, Math.max(0, stepOptions.protect.length - 1))];

  const gross = num(cleanseOption?.price) + num(treatOption?.price) + num(protectOption?.price);
  const save = Math.round(gross * 0.1);
  const total = gross - save;
  const tabbyRest = Math.floor(total / 4);
  const tabbyFirst = total - 3 * tabbyRest;
  const tabbyPlan = ['Today', '2 wks', '4 wks', '6 wks'].map((w, i) => ({
    when: w,
    amount: money(i === 0 ? tabbyFirst : tabbyRest),
    isFirst: i === 0,
  }));
  const spendPct = Math.min(100, Math.round(total / 10));
  const spendMsg = total >= 1000 ? 'Free delivery and double points unlocked.' : `You’re ${money(1000 - total)} from free delivery and double points.`;
  const routinePoints = (total * 2).toLocaleString('en-US');
  const cardPoints = (total * 2).toLocaleString('en-US');

  const routine = {
    stepOptions, concernOptions, concern, setConcern: handleSetConcern,
    cleanseIdx: Math.min(cleanseIdx, Math.max(0, stepOptions.cleanse.length - 1)),
    treatIdx: Math.min(treatIdx, Math.max(0, stepOptions.treat.length - 1)),
    protectIdx: Math.min(protectIdx, Math.max(0, stepOptions.protect.length - 1)),
    pick,
    gross, save, total, routineAdded,
    tabbyFirst, tabbyRest, tabbyPlan,
    spendPct, spendMsg, routinePoints, cardPoints,
  };

  if (loading) {
    return (
      <div style={{ fontFamily: sans, color: '#4A2360', background: '#FBFAF9' }}>
        <SectionPlaceholder minHeight="1200px" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: sans, color: '#4A2360', background: '#FBFAF9' }}>
      <Provenance brands={brands} products={products} />
      <TopSellers items={topSellers} onAdd={handleAddProduct} />
      <Reviews products={products} />
      <Signature items={signatureItems} onAdd={handleAddProduct} />
      <Essentials items={essentials} onAdd={handleAddProduct} />
      <Routine routine={routine} onAddRoutine={handleAddRoutine} />
      <ForYou fallbackProducts={forYouFallback} onAdd={handleAddProduct} />
      <Circle loyaltyData={loyaltyData} />
      <Pay routine={routine} />
      <Social />
    </div>
  );
}
