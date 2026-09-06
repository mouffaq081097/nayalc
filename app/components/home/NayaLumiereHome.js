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
 * Palette / typography note: this page uses the site-wide "Cloud Luxe" palette —
 * lavender/rose section backgrounds, the `--cl-*` deep-purple text scale, and the
 * purple→pink gradient (#9333ea→#db2777) for primary buttons and active states.
 * The three brand-identity tints (Zorah green, GERnétic navy, Perfumes gold) and
 * star-rating gold are kept as-is since they carry real meaning, not theme color.
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
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { getSlot } from '@/lib/homepageImageSlots';

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
const DEFAULT_TINT = '#9333ea';

const STAR_PATH =
  'm12 3.4 2.7 5.6 6.1.85-4.45 4.3 1.08 6.05L12 17.3l-5.43 2.9 1.08-6.05L3.2 9.85l6.1-.85Z';

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

/** Top sellers: real in-stock products, ranked by review volume then rating. */
function pickTopSellers(products) {
  return [...products]
    .filter((p) => num(p.stock_quantity) > 0)
    .sort((a, b) => num(b.reviewCount) - num(a.reviewCount) || num(b.averageRating) - num(a.averageRating) || b.id - a.id)
    .slice(0, 5);
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

function EyeIcon({ color = 'currentColor', size = 11 }) {
  return (
    <svg style={{ flex: 'none' }} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Compact "1.2k" style formatting for view counts. */
function shortCount(n) {
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
}

/** Eyebrow label — small uppercase kicker used above every section heading. */
function Eyebrow({ children, color = '#9333ea', style }) {
  return (
    <span style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color, ...style }}>
      {children}
    </span>
  );
}

function SectionHeading({ children, style, color = '#3b0764' }) {
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
        background: 'linear-gradient(135deg,#9333ea,#db2777)',
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
function ProductImage({ src, alt, sizes, fit = 'contain' }) {
  if (!src) {
    return <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#f3e8ff,#e9d5ff)' }} />;
  }
  return <Image src={src} alt={alt || ''} fill sizes={sizes} style={fit === 'cover' ? { objectFit: 'cover' } : { objectFit: 'contain', padding: '6%' }} />;
}

function SectionPlaceholder({ minHeight = '260px' }) {
  return <div aria-hidden style={{ minHeight, background: '#FFFFFF' }} />;
}

/* ============================================================================
 * #welcome — sits directly under the hero banner (app/components/HeroSection.js,
 * rendered in app/page.js). Two real, live-data pieces:
 *  - a personalized status bar (name/avatar/tier/points from useAuth() +
 *    loyaltyData, only shown when signed in) with a shortcut back into the
 *    #routine builder and the #circle tier card further down this page;
 *  - a "shop by category" strip built from the live categories table
 *    (useAppContext().categories, from GET /api/categories) — never a fixed
 *    list, so it always reflects whatever categories actually exist and have
 *    products, ranked by product count.
 * ==========================================================================*/

function Welcome() {
  const { categories, loyaltyData } = useAppContext();
  const { user, isAuthenticated } = useAuth();

  const tier = loyaltyData?.stats?.tier;
  const points = Number(loyaltyData?.stats?.points || 0);
  const lifetimeSpend = Number(loyaltyData?.stats?.lifetimeSpend || 0);
  const isMember = isAuthenticated && TIERS.some((t) => t.name === tier);
  const currentTierIdx = isMember ? TIERS.findIndex((t) => t.name === tier) : -1;
  const nextTier = currentTierIdx > -1 ? TIERS[currentTierIdx + 1] || null : null;
  const spendToNext = nextTier ? Math.max(0, nextTier.min - lifetimeSpend) : 0;

  const topCategories = useMemo(
    () =>
      [...(categories || [])]
        .filter((c) => Number(c.productsCount) > 0)
        .sort((a, b) => Number(b.productsCount) - Number(a.productsCount))
        .slice(0, 6),
    [categories]
  );

  if (!isAuthenticated && topCategories.length === 0) return null;

  return (
    <section id="welcome" style={{ padding: 'clamp(18px,2.2vw,26px) clamp(20px,4vw,52px) clamp(24px,3vw,36px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(24px,2.8vw,32px)' }}>
      {isAuthenticated && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {user?.profile_image ? (
                <span style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={user.profile_image} alt={user.first_name || ''} fill style={{ objectFit: 'cover' }} />
                </span>
              ) : (
                <InitialsAvatar initials={initialsFromName(`${user?.first_name || ''} ${user?.last_name || ''}`)} size={44} />
              )}
              <div>
                <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: 'clamp(20px,2.2vw,26px)', color: '#3b0764' }}>
                  Welcome back, {user?.first_name || 'there'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 300, color: '#6b21a8' }}>
                  {isMember
                    ? `${tier} · ${points.toLocaleString()} points${nextTier ? ` · AED ${spendToNext.toLocaleString()} from ${nextTier.name}` : ' · Our top tier'}`
                    : 'Good to see you again.'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <a href="#routine" className="transition-colors duration-300 hover:opacity-90" style={{ whiteSpace: 'nowrap', background: '#9333ea', color: '#FFFFFF', padding: '13px 26px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Resume your routine
              </a>
              {isMember && (
                <a href="#circle" className="transition-colors duration-300 hover:border-b-[#3b0764]" style={{ whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3b0764', borderBottom: '1px solid rgba(216,180,254,0.4)', paddingBottom: '3px' }}>
                  View your standing
                </a>
              )}
            </div>
          </div>
          {topCategories.length > 0 && <div style={{ height: '1px', background: 'rgba(216,180,254,0.4)' }} />}
        </>
      )}

      {topCategories.length > 0 && (
        <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 'clamp(14px,1.6vw,20px)', '--hc-card': '180px' }}>
          {topCategories.map((cat) => (
            <Link key={cat.id} href={cat.slug ? `/collections/${cat.slug}` : `/collections/${cat.id}`} className="group" style={{ display: 'block' }}>
              <div style={{ position: 'relative', aspectRatio: '1.15', borderRadius: '14px', overflow: 'hidden', background: '#e9d5ff' }}>
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 45vw, 220px"
                    className="transition-transform duration-300 group-hover:scale-105"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#f3e8ff,#e9d5ff)' }} />
                )}
              </div>
              <div style={{ padding: '12px 2px 0' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#3b0764' }}>{cat.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 300, color: 'rgba(59,7,100,0.5)' }}>{Number(cat.productsCount).toLocaleString()} products</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
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
          // Prefer the brand's own picture (set on /admin/brands) — this card is
          // about the house, not any one product — and only fall back to a
          // product photo for brands that haven't uploaded one yet.
          const img = b.imageurl || [...brandProducts].sort((a, b2) => num(b2.averageRating) - num(a.averageRating))[0]?.imageUrl || null;
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
      style={{ padding: 'clamp(32px,4vw,60px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(38px,4.4vw,62px)' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px 44px' }}>
        <div style={{ display: 'grid', gap: '16px', maxWidth: '24ch' }}>
          <Eyebrow>Provenance</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>Our three houses.</SectionHeading>
        </div>
        <p style={{ margin: 0, maxWidth: '40ch', fontSize: '15px', fontWeight: 300, lineHeight: 1.78, color: '#6b21a8' }}>
          Every product on Naya Lumière carries the name of the house that made it. Here is who they are.
        </p>
      </div>

      <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,332px),1fr))', gap: 'clamp(20px,2.4vw,34px)', '--hc-card': '85vw' }}>
        {cards.map((p) => (
          <article
            key={p.key}
            className="transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_36px_62px_-36px_rgba(147,51,234,0.44)] hover:border-[rgba(216,180,254,0.4)]"
            style={{ display: 'grid', alignContent: 'start', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '26px', background: '#FFFFFF', overflow: 'hidden' }}
          >
            <span style={{ position: 'relative', display: 'block', aspectRatio: '5/4', overflow: 'hidden', background: '#f3e8ff' }}>
              {p.img ? (
                <Image src={p.img} alt={p.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              ) : (
                <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#f3e8ff,#e9d5ff)' }} />
              )}
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(59,7,100,0.5) 0%,rgba(59,7,100,0) 54%)', pointerEvents: 'none' }} />
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
              <h3 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: 'clamp(27px,2.6vw,34px)', lineHeight: 1.06, letterSpacing: '-0.01em', color: '#3b0764' }}>
                {p.title}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: '#6b21a8' }}>{p.body}</p>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 18px', borderTop: '1px solid rgba(216,180,254,0.4)', paddingTop: '15px', fontSize: '11px', fontWeight: 400, letterSpacing: '0.02em', color: 'rgba(59,7,100,0.5)' }}>
                {p.facts.map((f) => <span key={f}>{f}</span>)}
              </span>
              <Link
                href="/collections"
                className="hover:text-[#9333ea]"
                style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: '9px', marginTop: '2px', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3b0764', borderBottom: '1px solid rgba(216,180,254,0.4)', paddingBottom: '4px' }}
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
 * "Sold in the last 24h" comes from real order line items (see
 * /api/products/sales-velocity); per-product urgency comes from the real
 * stock_quantity. (The mockup's live-viewer counter had no real backing data
 * anywhere in this app and has been removed rather than re-faked.)
 * ==========================================================================*/

function stockUrgency(stock) {
  if (stock <= 0) return { note: 'Out of stock', ink: '#B4483C' };
  if (stock <= 5) return { note: `Only ${stock} left`, ink: '#B4483C' };
  if (stock <= 15) return { note: 'Selling fast', ink: '#8A5E22' };
  return { note: 'In stock', ink: '#1E7A5A' };
}

function TopSellers({ items, onAdd }) {
  const [velocity, setVelocity] = useState({});
  const [liveByProduct, setLiveByProduct] = useState({});
  const [liveSitewide, setLiveSitewide] = useState(0);
  const [totalViews, setTotalViews] = useState({});

  useEffect(() => {
    let cancelled = false;
    const load = () => Promise.all([
      fetch('/api/products/sales-velocity').then((r) => (r.ok ? r.json() : { velocity: {} })),
      fetch('/api/products/live-viewers').then((r) => (r.ok ? r.json() : { live: {} })),
      fetch('/api/live-visitors').then((r) => (r.ok ? r.json() : { live: 0 })),
      fetch('/api/products/view-count').then((r) => (r.ok ? r.json() : { views: {} })),
    ])
      .then(([sold, perProduct, sitewide, viewed]) => {
        if (cancelled) return;
        setVelocity(sold.velocity || {});
        setLiveByProduct(perProduct.live || {});
        setLiveSitewide(sitewide.live || 0);
        setTotalViews(viewed.views || {});
      })
      .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!items.length) return null;

  const maxSold = Math.max(1, ...items.map((t) => num(velocity[t.id])));

  return (
    <section id="topsellers" style={{ padding: 'clamp(28px,3.6vw,52px) clamp(20px,4vw,52px)', display: 'grid', gap: 'clamp(26px,3vw,40px)', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'grid', gap: '13px', maxWidth: '34ch' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span className="home-live-dot" />
            <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9333ea' }}>Live now</span>
          </span>
          <SectionHeading style={{ fontFamily: sans }}>Top sellers this week</SectionHeading>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {liveSitewide > 0 && (
            <span style={{ fontSize: '13px', color: 'rgba(59,7,100,0.5)' }}>
              <span style={{ fontWeight: 700, color: '#3b0764' }}>{liveSitewide.toLocaleString()}</span> people browsing right now
            </span>
          )}
          <Link href="/collections" className="hover:text-[#9333ea]" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3b0764' }}>
            See all →
          </Link>
        </div>
      </div>

      <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,232px),1fr))', gap: 'clamp(12px,1.4vw,18px)', '--hc-card': '232px' }}>
        {items.map((t, i) => {
          const stock = num(t.stock_quantity);
          const urgency = stockUrgency(stock);
          const reviewCount = num(t.reviewCount);
          const rating = num(t.averageRating);
          const outOfStock = stock <= 0;
          const sold = num(velocity[t.id]);
          const liveViewers = num(liveByProduct[t.id]);
          const views = num(totalViews[t.id]);
          return (
            <article
              key={t.id}
              className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-34px_rgba(147,51,234,0.5)] hover:border-[rgba(216,180,254,0.4)]"
              style={{ display: 'grid', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '18px', background: '#FFFFFF', overflow: 'hidden' }}
            >
              <span style={{ position: 'relative', display: 'block', aspectRatio: '4/5', overflow: 'hidden', background: '#FFFFFF' }}>
                <ProductImage src={t.imageUrl} alt={t.name} sizes="(max-width: 768px) 50vw, 25vw" />
                <span style={{ position: 'absolute', top: 11, left: 11, display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: '#9333ea', color: '#FFFFFF', fontSize: '11px', fontWeight: 600 }}>
                  {i + 1}
                </span>
                {liveViewers > 0 && (
                  <span style={{ position: 'absolute', left: 11, bottom: 11, display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '999px', background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(216,180,254,0.4)', boxShadow: '0 4px 14px -6px rgba(147,51,234,0.25)' }}>
                    <EyeIcon size={12} color="#9333ea" />
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#3b0764', fontVariantNumeric: 'tabular-nums' }}>{shortCount(liveViewers)}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 400, color: 'rgba(59,7,100,0.5)' }}>viewing</span>
                  </span>
                )}
              </span>
              <span style={{ display: 'grid', gap: '7px', padding: '15px 16px 17px' }}>
                <OriginTag origin={t.brand} />
                <Link
                  href={t.slug ? `/product/${t.slug}` : '/collections'}
                  className="hover:text-[#9333ea]"
                  style={{
                    fontSize: '15.5px', fontWeight: 600, letterSpacing: '-0.01em', color: '#3b0764',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.28,
                  }}
                >
                  {t.name}
                </Link>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {reviewCount > 0 ? (
                    <>
                      <StarRow rating={rating} size={11} />
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#3b0764', fontVariantNumeric: 'tabular-nums' }}>{rating.toFixed(1)}</span>
                      <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(59,7,100,0.5)', fontVariantNumeric: 'tabular-nums' }}>({reviewCount})</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(59,7,100,0.5)' }}>No reviews yet</span>
                  )}
                  {views > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 300, color: 'rgba(59,7,100,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                      <EyeIcon size={11} color="rgba(59,7,100,0.5)" /> {shortCount(views)} views
                    </span>
                  )}
                </span>
                {sold > 0 && (
                  <span style={{ display: 'grid', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(59,7,100,0.5)' }}>{sold} sold in the last 24 hours</span>
                    <span style={{ display: 'block', height: '4px', borderRadius: '999px', background: 'rgba(216,180,254,0.4)', overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${Math.round((sold / maxSold) * 100)}%`, borderRadius: '999px', background: urgency.ink }} />
                    </span>
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{money(t.price)}</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 500, color: urgency.ink }}>{urgency.note}</span>
                </span>
                {!outOfStock && (
                  <AddButton
                    className="cursor-pointer justify-self-start transition-colors duration-300 hover:bg-[#3b0764] hover:border-[#3b0764] hover:text-white"
                    style={{ marginTop: '4px', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '999px', padding: '9px 17px', fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#3b0764' }}
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
    <section id="reviews" style={{ padding: 'clamp(28px,3.6vw,52px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(26px,3vw,40px)' }}>
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
            padding: 'clamp(24px,2.8vw,34px)', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '22px', background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'grid', gap: '9px', justifyItems: 'start' }}>
            <span style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(46px,5vw,62px)', lineHeight: 0.84, letterSpacing: '-0.02em', color: '#3b0764' }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(59,7,100,0.5)', paddingBottom: '6px' }}>/ 5</span>
            </span>
            <PartialStarRow rating={avgRating} />
            <span style={{ fontSize: '12px', fontWeight: 300, color: '#6b21a8' }}>
              <strong style={{ fontWeight: 600, color: '#3b0764', fontVariantNumeric: 'tabular-nums' }}>{totalReviews}</strong> verified review{totalReviews === 1 ? '' : 's'}
            </span>
          </div>
          <span style={{ maxWidth: '34ch', fontSize: '12.5px', fontWeight: 300, lineHeight: 1.65, color: 'rgba(59,7,100,0.5)' }}>
            Reviews are collected directly from Naya Lumière customers — nothing here is gifted or incentivised.
          </span>
        </div>
      ) : (
        <div style={{ padding: 'clamp(24px,2.8vw,34px)', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '22px', background: '#FFFFFF', fontSize: '13.5px', fontWeight: 300, color: '#6b21a8' }}>
          No reviews yet — be the first to leave one after your order arrives.
        </div>
      )}

      {cards.length > 0 && (
        <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,290px),1fr))', gap: 'clamp(14px,1.6vw,20px)', alignItems: 'start', '--hc-card': '280px' }}>
          {cards.map((r) => (
            <article
              key={r.id}
              className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-34px_rgba(147,51,234,0.5)] hover:border-[rgba(216,180,254,0.4)]"
              style={{ display: 'grid', gap: '14px', alignContent: 'start', padding: 'clamp(20px,2.2vw,26px)', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '20px', background: '#FFFFFF' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <StarRow rating={r.rating} />
                <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(59,7,100,0.5)', whiteSpace: 'nowrap' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </span>
              <span style={{ fontFamily: serif, fontSize: '20px', lineHeight: 1.3, color: '#3b0764' }}>{r.comment}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '11px', borderTop: '1px solid rgba(216,180,254,0.4)', paddingTop: '14px' }}>
                <InitialsAvatar initials={initialsFromName(r.username)} />
                <span style={{ display: 'grid', gap: '3px', minWidth: 0 }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#3b0764' }}>{r.username}</span>
                  <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(59,7,100,0.5)' }}>Naya Lumière customer</span>
                </span>
              </span>
              <Link
                href={r.productSlug ? `/product/${r.productSlug}` : '/collections'}
                className="hover:text-[#9333ea]"
                style={{ justifySelf: 'start', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#3b0764', borderBottom: '1px solid rgba(216,180,254,0.4)', paddingBottom: '3px' }}
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
        background: '#FFFFFF',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', alignItems: 'stretch',
      }}
    >
      <div style={{ display: 'grid', alignContent: 'center', gap: 'clamp(20px,2.4vw,30px)', padding: 'clamp(28px,3.6vw,52px)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A5E22' }}>
          <span style={{ width: 22, height: 1, background: '#C79A4E' }} />
          Signature selection
        </span>
        <h2 style={{ margin: 0, fontFamily: sans, fontWeight: 600, fontSize: 'clamp(24px,2.6vw,32px)', lineHeight: 1.24, letterSpacing: '-0.01em', color: '#3b0764' }}>
          {sig.name}
        </h2>
        {sig.description && (
          <p style={{ margin: 0, maxWidth: '38ch', fontSize: '14.5px', fontWeight: 300, lineHeight: 1.75, color: '#6b21a8' }}>{truncate(sig.description, 220)}</p>
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
                    border: `1px solid ${on ? '#9333ea' : 'rgba(216,180,254,0.4)'}`, background: on ? '#9333ea' : 'transparent', color: on ? '#FFFFFF' : '#3b0764',
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
          <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', padding: '13px 0', borderTop: '1px solid rgba(216,180,254,0.4)', fontSize: '13px', fontWeight: 300, color: '#6b21a8' }}>
            Brand
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase', color: tint }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: tint }} />
              {sig.brand}
            </span>
          </span>
          {notes && (
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', padding: '13px 0', borderTop: '1px solid rgba(216,180,254,0.4)', fontSize: '13px', fontWeight: 300, color: '#6b21a8' }}>
              Notes<span style={{ fontWeight: 400, color: '#3b0764', textAlign: 'right' }}>{notes}</span>
            </span>
          )}
          {format && (
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', padding: '13px 0', borderTop: '1px solid rgba(216,180,254,0.4)', borderBottom: '1px solid rgba(216,180,254,0.4)', fontSize: '13px', fontWeight: 300, color: '#6b21a8' }}>
              Format<span style={{ fontWeight: 400, color: '#3b0764' }}>{format}</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px' }}>
          <span style={{ fontFamily: serif, fontSize: '30px', lineHeight: 1, color: '#3b0764' }}>{money(sig.price)}</span>
          {num(sig.stock_quantity) > 0 ? (
            <AddButton
              label="Add to bag"
              addedLabel="Added to bag"
              className="cursor-pointer transition-colors duration-300 hover:opacity-90"
              style={{ whiteSpace: 'nowrap', background: '#9333ea', color: '#FFFFFF', padding: '16px 32px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
              onAdd={() => onAdd(sig)}
            />
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#B4483C' }}>Out of stock</span>
          )}
        </div>
      </div>

      <span style={{ position: 'relative', display: 'block', minHeight: 'clamp(340px,52vh,620px)', background: '#FFFFFF' }}>
        <ProductImage src={sig.signatureImageUrl || sig.imageUrl} alt={sig.name} sizes="(max-width: 768px) 100vw, 50vw" fit="cover" />
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
    <section id="collections" style={{ padding: 'clamp(28px,3.6vw,52px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(30px,3.6vw,46px)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'grid', gap: '13px' }}>
          <Eyebrow>Across the house</Eyebrow>
          <SectionHeading style={{ fontFamily: sans }}>The house essentials</SectionHeading>
        </div>
        <Link href="/collections" className="hover:text-[#9333ea]" style={{ whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#3b0764', borderBottom: '1px solid rgba(216,180,254,0.4)', paddingBottom: '3px' }}>
          View all products
        </Link>
      </div>

      <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'clamp(16px,2vw,26px)', '--hc-card': '230px' }}>
        {items.map((p) => (
          <article key={p.id} style={{ display: 'grid', gap: '16px' }}>
            <span style={{ position: 'relative', display: 'block', aspectRatio: '4/5', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
              <ProductImage src={p.imageUrl} alt={p.name} sizes="(max-width: 768px) 50vw, 25vw" />
              <span
                style={{
                  position: 'absolute', top: 12, left: 12, zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 3px 12px -6px rgba(147,51,234,0.6)',
                  fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: brandTint(p.brand),
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: brandTint(p.brand) }} />
                {p.brand}
              </span>
            </span>
            <div style={{ display: 'grid', gap: '7px' }}>
              <Link href={p.slug ? `/product/${p.slug}` : '/collections'} style={{ display: 'block' }}>
                <h3 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: '23px', lineHeight: 1.2, color: '#3b0764' }}>{p.name}</h3>
              </Link>
              {(p.size || p.form) && (
                <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 300, color: '#6b21a8' }}>{[p.size, p.form].filter(Boolean).join(' · ')}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '5px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#3b0764' }}>{money(p.price)}</span>
                <AddButton
                  className="cursor-pointer transition-colors duration-300 hover:bg-[#3b0764] hover:border-[#3b0764] hover:text-white"
                  style={{ border: '1px solid rgba(216,180,254,0.4)', borderRadius: '999px', padding: '9px 17px', fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#3b0764' }}
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
        border: `1px solid ${active ? '#9333ea' : 'rgba(216,180,254,0.4)'}`,
        background: active ? '#F7F2FE' : '#FFFFFF',
        boxShadow: active ? '0 16px 30px -22px rgba(147,51,234,0.6)' : 'none',
        transition: 'border-color .25s ease, background .25s ease, box-shadow .3s ease',
      }}
    >
      <span
        style={{
          marginTop: 3, width: 19, height: 19, borderRadius: '50%', display: 'grid', placeItems: 'center',
          border: `1px solid ${active ? '#9333ea' : 'rgba(216,180,254,0.4)'}`, background: active ? '#9333ea' : 'transparent',
        }}
      >
        {active && <CheckIcon />}
      </span>
      <span style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 11px' }}>
          <span style={{ fontFamily: serif, fontSize: '21px', lineHeight: 1.1, color: '#3b0764' }}>{option.name}</span>
          <OriginTag origin={option.brand} />
        </span>
        {option.recommended && (
          <span style={{ justifySelf: 'start', padding: '5px 11px', borderRadius: '999px', background: '#F1EBFD', color: '#6D3FD1', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Matches your concern
          </span>
        )}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#3b0764', whiteSpace: 'nowrap', marginTop: '2px' }}>{money(option.price)}</span>
    </span>
  );
}

function Routine({ routine, onAddRoutine }) {
  const {
    stepOptions, concernOptions, concern, setConcern,
    cleanseIdx, treatIdx, protectIdx, pick,
    gross, save, total, routineAdded,
    tabbyRest, routinePoints,
  } = routine;

  // The "Treat" step photo is the one homepage image with no product/category/brand
  // behind it — admins can swap it from /admin/homepage, which writes to
  // /api/homepage-images. Falls back to the shipped default asset otherwise.
  const treatSlot = getSlot('routine_treat');
  const [treatImageOverride, setTreatImageOverride] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/homepage-images')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled && data?.routine_treat) setTreatImageOverride(data.routine_treat);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const treatImageSrc = treatImageOverride?.imageUrl || treatSlot.fallbackUrl;
  const treatImageAlt = treatImageOverride?.altText || treatSlot.alt;

  const indices = { cleanse: cleanseIdx, treat: treatIdx, protect: protectIdx };
  const treatOption = stepOptions.treat[treatIdx];
  const cleanseOption = stepOptions.cleanse[cleanseIdx];
  const protectOption = stepOptions.protect[protectIdx];
  const concernLabel = concern.key === 'all' ? 'balanced for the whole face' : `tuned for ${concern.label.toLowerCase()}`;

  if (!treatOption || !cleanseOption || !protectOption) return null;

  return (
    <section
      id="routine"
      style={{ padding: 'clamp(28px,3.6vw,52px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(30px,3.6vw,46px)' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px 44px' }}>
        <div style={{ display: 'grid', gap: '12px', maxWidth: '32ch' }}>
          <Eyebrow style={{ letterSpacing: '0.16em' }}>Build your routine</Eyebrow>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: 'clamp(28px,3.1vw,38px)', lineHeight: 1.12, letterSpacing: '-0.005em', color: '#3b0764' }}>Three steps, priced as one</h2>
        </div>
        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 300, lineHeight: 1.75, maxWidth: '34ch', color: '#6b21a8' }}>
          Pick one formula per step. Mix the atelier, the French laboratory and the Emirates edition as you like — the trio is priced as a bundle.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '9px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6b21a8', marginRight: '6px' }}>Skin concern</span>
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
                border: `1px solid ${on ? '#9333ea' : 'rgba(216,180,254,0.4)'}`, background: on ? '#9333ea' : '#FFFFFF', color: on ? '#FFFFFF' : '#6b21a8',
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
                background: '#FFFFFF',
                boxShadow: '0 44px 76px -50px rgba(147,51,234,0.42), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <Image
                src={treatImageSrc}
                alt={treatImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectFit: 'cover', objectPosition: '52% 13%' }}
              />
              <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to top,#FFFFFF 0%,rgba(255,255,255,0.86) 13%,rgba(255,255,255,0) 40%)' }} />
              <span style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 13px', borderRadius: '999px', background: 'rgba(255,255,255,0.94)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#3b0764' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9333ea' }} />
                Step 02 · Treat
              </span>
              <span
                style={{
                  position: 'absolute', left: 16, right: 16, bottom: 16, display: 'grid', gap: '9px', padding: '16px 18px', borderRadius: '18px',
                  background: 'rgba(255,255,255,0.93)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 34px -26px rgba(147,51,234,0.4)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(59,7,100,0.5)' }}>On skin now</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#3b0764' }}>{money(treatOption.price)}</span>
                </span>
                <span style={{ fontFamily: serif, fontSize: '23px', lineHeight: 1.1, color: '#3b0764' }}>{treatOption.name}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: brandTint(treatOption.brand) }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: brandTint(treatOption.brand) }} />
                  {treatOption.brand}
                  <span style={{ fontWeight: 400, letterSpacing: '0.03em', textTransform: 'none', color: '#6b21a8' }}>{concernLabel}</span>
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
                    <span style={{ fontFamily: serif, fontSize: '16px', lineHeight: 1, color: '#c4b5fd' }}>{String(['cleanse', 'treat', 'protect'].indexOf(step) + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3b0764' }}>{meta.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(59,7,100,0.5)' }}>{meta.when}</span>
                    <span style={{ flex: 1, height: 1, background: 'rgba(216,180,254,0.4)' }} />
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

        {/* Routine summary bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px 32px', paddingTop: '22px', borderTop: '1px solid rgba(216,180,254,0.4)' }}>
          <div style={{ display: 'grid', gap: '7px' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(59,7,100,0.5)' }}>Your routine · 3 items</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(30px,3.4vw,40px)', lineHeight: 1, color: '#3b0764', fontVariantNumeric: 'tabular-nums' }}>{money(total)}</span>
              <span style={{ fontSize: '13.5px', fontWeight: 300, color: 'rgba(59,7,100,0.5)', textDecoration: 'line-through' }}>{money(gross)}</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#7C4DBE' }}>Bundle saves {money(save)}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.6, color: 'rgba(59,7,100,0.5)' }}>{cleanseOption.name}, {treatOption.name}, {protectOption.name}</span>
            <span style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.6, color: 'rgba(59,7,100,0.5)' }}>Four payments of {money(tabbyRest)} · earns {routinePoints} points</span>
          </div>
          <AddButton
            label="Add routine to bag"
            addedLabel={routineAdded ? 'Added to bag' : 'Add routine to bag'}
            onAdd={() => onAddRoutine([cleanseOption, treatOption, protectOption])}
            className="cursor-pointer transition-colors duration-300 hover:opacity-90"
            style={{
              whiteSpace: 'nowrap', background: '#9333ea', color: '#FFFFFF',
              padding: '15px 30px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
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
    <section id="foryou" style={{ padding: 'clamp(28px,3.6vw,52px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(28px,3.4vw,42px)' }}>
      <div style={{ display: 'grid', gap: '13px' }}>
        <Eyebrow>{usingRecent ? 'Recently viewed' : 'You might also like'}</Eyebrow>
        <SectionHeading style={{ fontFamily: sans }}>{usingRecent ? 'Pick up where you left off.' : 'A few more from the house.'}</SectionHeading>
      </div>

      <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(16px,2vw,26px)', '--hc-card': '280px' }}>
        {list.map((p) => {
          const brand = p.brand || p.brandName || '';
          const stock = num(p.stock_quantity);
          return (
            <article
              key={p.id}
              className="transition-all duration-300 hover:border-[rgba(216,180,254,0.4)] hover:-translate-y-1"
              style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: '18px', alignItems: 'center', padding: '16px', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '18px' }}
            >
              <span style={{ position: 'relative', display: 'block', width: 104, aspectRatio: '4/5', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
                <ProductImage src={p.imageUrl} alt={p.name} sizes="104px" />
              </span>
              <span style={{ display: 'grid', gap: '7px' }}>
                {brand && <OriginTag origin={brand} fontSize="9.5px" />}
                <Link href={p.slug ? `/product/${p.slug}` : '/collections'}>
                  <span style={{ fontFamily: serif, fontSize: '21px', lineHeight: 1.15, color: '#3b0764' }}>{p.name}</span>
                </Link>
                <span style={{ fontSize: '12.5px', fontWeight: 300, color: '#6b21a8' }}>{money(p.price)}</span>
                {stock > 0 ? (
                  <AddButton
                    label="Add to bag"
                    className="justify-self-start cursor-pointer whitespace-nowrap"
                    style={{ marginTop: '3px', fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid rgba(216,180,254,0.4)', paddingBottom: '3px', color: '#3b0764' }}
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
 * #circle — the real 4-tier loyalty ladder (Silver/Gold/Platinum/Diamond,
 * lifetime AED spend), matching app/account/loyalty/page.js exactly.
 * ==========================================================================*/

const TIERS = [
  { name: 'Silver', min: 0, multiplier: '1×', shipping: false, earlyAccess: false, gift: true, samples: false, priority: false, concierge: false },
  { name: 'Gold', min: 2000, multiplier: '1.5×', shipping: true, earlyAccess: true, gift: true, samples: false, priority: false, concierge: false, badge: true },
  { name: 'Platinum', min: 5000, multiplier: '2×', shipping: true, earlyAccess: true, gift: true, samples: true, priority: true, concierge: false },
  { name: 'Diamond', min: 10000, multiplier: '2.5×', shipping: true, earlyAccess: true, gift: true, samples: true, priority: true, concierge: true },
];

const TIER_ROWS = [
  { label: 'Points per dirham', get: (t) => t.multiplier },
  { label: 'Free shipping', get: (t) => (t.shipping ? 'Included' : '—') },
  { label: 'Early access to new editions', get: (t) => (t.earlyAccess ? 'Included' : '—') },
  { label: 'Birthday gift', get: (t) => (t.gift ? 'Every year' : '—') },
  { label: 'Exclusive samples', get: (t) => (t.samples ? 'Included' : '—') },
  { label: 'Priority support', get: (t) => (t.priority ? 'Included' : '—') },
  { label: 'Dedicated concierge', get: (t) => (t.concierge ? 'Included' : '—') },
];

const TIER_DOT = { Silver: '#B7B9C2', Gold: '#D9A441', Platinum: '#7C5CD6', Diamond: '#6FA8DC' };

function Circle() {
  const { loyaltyData } = useAppContext();
  const { user, isAuthenticated } = useAuth();

  const tier = loyaltyData?.stats?.tier;
  const points = Number(loyaltyData?.stats?.points || 0);
  const lifetimeSpend = Number(loyaltyData?.stats?.lifetimeSpend || 0);
  const isMember = isAuthenticated && TIERS.some((t) => t.name === tier);
  const currentTierIdx = isMember ? TIERS.findIndex((t) => t.name === tier) : -1;
  const currentTier = currentTierIdx > -1 ? TIERS[currentTierIdx] : null;
  const nextTier = currentTierIdx > -1 ? TIERS[currentTierIdx + 1] || null : null;
  const spendToNext = nextTier ? Math.max(0, nextTier.min - lifetimeSpend) : 0;
  const progress = nextTier ? Math.min(100, Math.round((lifetimeSpend / nextTier.min) * 100)) : 100;
  const memberName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Member';

  return (
    <section id="circle" style={{ padding: 'clamp(28px,3.4vw,44px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(24px,3vw,34px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px 44px' }}>
          <div style={{ display: 'grid', gap: '11px', maxWidth: '40ch' }}>
            <Eyebrow style={{ letterSpacing: '0.16em' }}>The Circle</Eyebrow>
            <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: 'clamp(28px,3.1vw,38px)', lineHeight: 1.12, color: '#3b0764' }}>What each tier gives you</h2>
          </div>
          <p style={{ margin: 0, maxWidth: '34ch', fontSize: '12.5px', fontWeight: 300, lineHeight: 1.7, color: '#6b21a8' }}>
            Every order counts toward the same lifetime total — reach a tier once, and you keep it.
          </p>
        </div>

        {isMember && currentTier && (
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '18px', padding: 'clamp(22px,2.8vw,32px)', display: 'flex', flexWrap: 'wrap', gap: 'clamp(20px,3vw,40px)' }}>
            <div style={{ display: 'grid', gap: '10px', alignContent: 'center', minWidth: '200px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9333ea' }}>Your standing</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: serif, fontSize: 'clamp(32px,3.4vw,40px)', lineHeight: 1, color: '#3b0764' }}>{points.toLocaleString()}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(59,7,100,0.5)' }}>points</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 300, color: '#6b21a8' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: TIER_DOT[currentTier.name], flexShrink: 0 }} />
                {currentTier.name} member · {memberName}
              </div>
            </div>

            <div style={{ flex: '1 1 320px', display: 'grid', gap: '10px', alignContent: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px 20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 400, color: '#3b0764' }}>
                  {nextTier ? `AED ${spendToNext.toLocaleString()} more to ${nextTier.name}` : "You're at our highest tier"}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(59,7,100,0.5)' }}>
                  AED {lifetimeSpend.toLocaleString()}{nextTier ? ` of ${nextTier.min.toLocaleString()}` : ''}
                </span>
              </div>
              <div
                style={{ height: '6px', background: 'rgba(216,180,254,0.4)', borderRadius: '999px', overflow: 'hidden' }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={nextTier ? `Progress toward ${nextTier.name} tier` : 'Top tier reached'}
              >
                <div style={{ height: '100%', width: `${progress}%`, borderRadius: '999px', background: '#3b0764' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px 20px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b0764' }}>{currentTier.name}</span>
                {nextTier && (
                  <span style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(59,7,100,0.5)' }}>
                    {nextTier.name} · {nextTier.multiplier} points
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'rgba(59,7,100,0.5)' }}>
                Points never expire — your tier is based on lifetime spend, so once you reach one, you keep it.
              </p>
            </div>
          </div>
        )}

        <div style={{ background: '#FFFFFF', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 700, display: 'grid', gridTemplateColumns: `minmax(0,1.5fr) repeat(${TIERS.length},minmax(0,1fr))` }}>

              <div style={{ padding: '24px 22px 20px', borderBottom: '1px solid rgba(216,180,254,0.4)' }} />
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  style={{
                    display: 'grid', gap: '6px', padding: '24px 14px 20px', borderBottom: '1px solid rgba(216,180,254,0.4)', borderLeft: '1px solid rgba(216,180,254,0.4)', textAlign: 'center',
                    background: t.badge ? '#FBF7F1' : 'transparent', boxShadow: t.badge ? 'inset 0 3px 0 #9C7A2E' : 'none',
                  }}
                >
                  <span style={{ fontFamily: serif, fontSize: '23px', lineHeight: 1, color: '#3b0764' }}>{t.name}</span>
                  <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.badge ? '#9C7A2E' : '#6b21a8' }}>
                    {t.min === 0 ? 'First order' : `AED ${t.min.toLocaleString()}`}
                  </span>
                </div>
              ))}

              {TIER_ROWS.map((row, ri) => (
                <React.Fragment key={row.label}>
                  <div style={{ padding: '17px 22px', borderBottom: ri === TIER_ROWS.length - 1 ? 'none' : '1px solid rgba(216,180,254,0.4)', fontSize: '12.5px', fontWeight: 400, color: '#6b21a8' }}>
                    {row.label}
                  </div>
                  {TIERS.map((t) => {
                    const val = row.get(t);
                    return (
                      <div
                        key={t.name}
                        style={{
                          padding: '17px 14px', borderBottom: ri === TIER_ROWS.length - 1 ? 'none' : '1px solid rgba(216,180,254,0.4)', borderLeft: '1px solid rgba(216,180,254,0.4)', textAlign: 'center',
                          fontSize: '12.5px', fontWeight: t.badge ? 500 : 300, color: val === '—' ? 'rgba(59,7,100,0.5)' : t.badge ? '#3b0764' : '#6b21a8',
                          background: t.badge ? '#FBF7F1' : 'transparent',
                        }}
                      >
                        {val}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px 24px' }}>
          <Link href={isMember ? '/account/loyalty' : '/auth'} className="transition-colors duration-300 hover:opacity-90" style={{ whiteSpace: 'nowrap', background: '#9333ea', color: '#FFFFFF', padding: '15px 30px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isMember ? 'View my rewards' : 'Join the Circle'}
          </Link>
          <Link href="/account/loyalty" className="transition-colors duration-300 hover:border-b-[#3b0764]" style={{ whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3b0764', borderBottom: '1px solid rgba(216,180,254,0.4)', paddingBottom: '4px' }}>
            Read the full terms
          </Link>
          <span style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(59,7,100,0.5)' }}>No joining fee · Points never expire · Once you reach a tier, you keep it</span>
        </div>
    </section>
  );
}

/* ============================================================================
 * #pay — "Pay your way. Keep your points." Generic payment/trust messaging,
 * not product data — fed the real routine total computed above.
 * ==========================================================================*/

const PAY_STATS = [
  { stat: '0%', label: 'interest, fees or late charges', body: 'Split with Tabby, approved in seconds with your Emirates ID.' },
  { stat: '3-D', label: 'Secure on every card payment', body: 'Your bank confirms each charge. We hold a token, never a card number.' },
  { stat: '14 days', label: 'for free returns', body: 'Collected from your door, refunded to the method you paid with.' },
  { stat: 'AED 400', label: 'and delivery is on us', body: 'Same-day across Dubai, next day to the rest of the Emirates.' },
];

const PAY_METHODS = ['VISA', 'Mastercard', 'Amex', 'Apple Pay', 'Cash on delivery'];

function Pay({ routine }) {
  const { total, tabbyRest, cardPoints } = routine;

  return (
    <section id="pay" style={{ padding: 'clamp(26px,3.2vw,42px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(28px,3.4vw,40px)' }}>
        <div style={{ display: 'grid', gap: '12px', maxWidth: '50ch' }}>
          <Eyebrow style={{ letterSpacing: '0.16em' }}>Payments &amp; security</Eyebrow>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: 'clamp(27px,3.2vw,40px)', lineHeight: 1.1, letterSpacing: '-0.005em', color: '#3b0764' }}>
            Earn {cardPoints} points on this basket, however you pay.
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 300, lineHeight: 1.75, color: '#6b21a8' }}>
            Four payments of {money(tabbyRest)}, or one of {money(total)} — same price, and it earns points either way.
          </p>
        </div>

        <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,206px),1fr))', gap: '1px', background: '#E9DFF3', '--hc-card': '206px' }}>
          {PAY_STATS.map((s) => (
            <div key={s.label} style={{ display: 'grid', gap: '9px', alignContent: 'start', padding: '24px 22px 26px', background: '#FFFFFF' }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(28px,2.9vw,34px)', fontWeight: 400, lineHeight: 1, color: '#3b0764' }}>{s.stat}</span>
              <span style={{ fontSize: '12.5px', fontWeight: 500, lineHeight: 1.45, color: '#3b0764' }}>{s.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.65, color: '#6b21a8' }}>{s.body}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px 28px' }}>
          <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px', fontSize: '12px', fontWeight: 500, letterSpacing: '0.03em', color: '#6b21a8' }}>
            {PAY_METHODS.map((m) => <span key={m}>{m}</span>)}
          </span>
          <Link href="/checkout" style={{ whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3b0764', borderBottom: '1px solid rgba(216,180,254,0.4)', paddingBottom: '4px' }}>
            How instalments work
          </Link>
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

  return (
    <section id="social" style={{ padding: 'clamp(28px,3.6vw,52px) clamp(20px,4vw,52px)', background: '#FFFFFF', display: 'grid', gap: 'clamp(26px,3vw,38px)' }}>
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
              className="transition-colors duration-300 hover:bg-[#3b0764] hover:border-[#3b0764] hover:text-white"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap', padding: '13px 22px', border: '1px solid rgba(216,180,254,0.4)', borderRadius: '999px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#3b0764' }}
            >
              {s.icon}
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {posts.length > 0 && (
        <div className="home-carousel" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,150px),1fr))', gap: 'clamp(10px,1.4vw,16px)', '--hc-card': '150px' }}>
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.instagram_url || 'https://www.instagram.com/nayalc'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ position: 'relative', display: 'block', maxWidth: 200, aspectRatio: '1', borderRadius: '14px', overflow: 'hidden', background: '#f3e8ff' }}
            >
              <Image src={p.image_url} alt={p.caption || 'From Naya Lumière'} fill sizes="(max-width: 768px) 33vw, 200px" style={{ objectFit: 'cover' }} />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================================
 * DEFAULT EXPORT — pulls real data from useAppContext(), derives every
 * section's product selection from it, and assembles the sections in order.
 * ==========================================================================*/

export default function NayaLumiereHome() {
  const { products, concerns, brands } = useAppContext();
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
      <div style={{ fontFamily: sans, color: '#3b0764', background: '#FFFFFF' }}>
        <SectionPlaceholder minHeight="1200px" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: sans, color: '#3b0764', background: '#FFFFFF' }}>
      <Welcome />
      <Provenance brands={brands} products={products} />
      <TopSellers items={topSellers} onAdd={handleAddProduct} />
      <Reviews products={products} />
      <Signature items={signatureItems} onAdd={handleAddProduct} />
      <Essentials items={essentials} onAdd={handleAddProduct} />
      <Routine routine={routine} onAddRoutine={handleAddRoutine} />
      <ForYou fallbackProducts={forYouFallback} onAdd={handleAddProduct} />
      <Circle />
      <Pay routine={routine} />
      <Social />
    </div>
  );
}
