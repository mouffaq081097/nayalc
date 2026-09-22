'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AED_PER_POINT, WELCOME_BONUS_POINTS } from '@/lib/loyalty';
import { motion, AnimatePresence } from 'framer-motion';
import { Cormorant_Garamond } from 'next/font/google';
import {
  Star, Award, Crown, Gem,
  Zap, Wallet, Lock, ArrowUpRight, ArrowDownRight, ShoppingBag, Sparkle,
  Check, Minus, Clock, Infinity as InfinityIcon,
} from 'lucide-react';
import Link from 'next/link';
import AccountShell from '../_components/AccountShell';
import { Carousel, CarouselContent, CarouselItem } from '../../components/ui/carousel.tsx';
import { useAccountData } from '../_components/useAccountData';
import { useAuth } from '../../context/AuthContext';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500'], style: ['normal', 'italic'], display: 'swap' });
const serif = cormorant.style.fontFamily;

const TIERS = [
  { name: 'Silver',   min: 0,     multiplier: 1,    Icon: Star },
  { name: 'Gold',     min: 2000,  multiplier: 1.25, Icon: Award },
  { name: 'Platinum', min: 5000,  multiplier: 1.5,  Icon: Crown },
  { name: 'Diamond',  min: 10000, multiplier: 2,    Icon: Gem },
];

const PERKS = [
  { label: 'Redeem at checkout', tierIdx: 0 },
  { label: 'Birthday gift',      tierIdx: 0 },
  { label: 'Free shipping',      tierIdx: 1 },
  { label: 'Early access',       tierIdx: 1 },
  { label: 'Exclusive samples',  tierIdx: 2 },
  { label: 'Priority support',   tierIdx: 2 },
  { label: 'Dedicated concierge', tierIdx: 3 },
  { label: 'Free returns, no minimum', tierIdx: 3 },
];

// Card "skins" — gradient recipes per tier. Each drives the front face background,
// fine surface texture, moving sheen, edge highlight, holo dot, ink color, and the
// card back. Silver/Gold/Platinum/Diamond values below are carried over near-verbatim
// from the design mockup's SKINS table.
const SKINS = {
  Silver: {
    bg: 'linear-gradient(132deg,#FEFEFF 0%,#EFF1F5 26%,#DADDE4 50%,#F9FAFC 64%,#CBCFD9 84%,#EAECF1 100%)',
    texture: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.62) 0 1px,rgba(120,124,138,0.07) 1px 2px,rgba(255,255,255,0.24) 2px 3px,rgba(120,124,138,0.04) 3px 5px), radial-gradient(140% 100% at 12% -12%,rgba(255,255,255,0.62),rgba(255,255,255,0) 58%)',
    sheen: 'linear-gradient(112deg,rgba(255,255,255,0) 38%,rgba(255,255,255,0.6) 50%,rgba(255,255,255,0) 62%)',
    edge: 'linear-gradient(180deg,#F3F5F8,#B9BEC9 45%,#FBFCFE 62%,#A9AEBA)',
    chip: 'linear-gradient(135deg,#EDEFF3,#B9BEC9 45%,#FBFCFE 60%,#A9AEBA)',
    holo: 'conic-gradient(from 210deg,#FFFFFF,#DDE3EC,#F4EFFB,#E7ECF4,#FFFFFF)',
    ink: '#33313C', inkMid: 'rgba(51,49,60,0.7)', inkSoft: 'rgba(51,49,60,0.5)', inkFaint: 'rgba(51,49,60,0.18)',
    shadow: 'radial-gradient(ellipse at center,rgba(60,60,80,0.26),rgba(60,60,80,0) 70%)',
    backBg: 'linear-gradient(160deg,#FAFBFC,#EDEFF3)', backInk: '#4A4855', backInkSoft: 'rgba(51,49,60,0.5)',
    stripe: 'linear-gradient(180deg,#4A4B55,#2E2F37)',
  },
  Gold: {
    bg: 'linear-gradient(148deg,#FDF7E9 0%,#F1E0BB 30%,#DFC287 56%,#FAF1DA 70%,#D3B473 100%)',
    texture: 'repeating-linear-gradient(118deg,rgba(255,255,255,0.3) 0 1px,rgba(140,110,50,0.05) 1px 6px)',
    sheen: 'linear-gradient(112deg,rgba(255,255,255,0) 38%,rgba(255,255,255,0.62) 50%,rgba(255,255,255,0) 62%)',
    edge: 'linear-gradient(180deg,#F6E9C2,#C9A85C 45%,#FAF1D8 62%,#B4913F)',
    chip: 'linear-gradient(135deg,#F6E9C2,#C9A85C 42%,#FAF1D8 58%,#B4913F)',
    holo: 'conic-gradient(from 210deg,#F7E9FF,#D8C4F2,#FBEBC8,#E7D2F6,#F7E9FF)',
    ink: '#443413', inkMid: 'rgba(68,52,19,0.72)', inkSoft: 'rgba(68,52,19,0.5)', inkFaint: 'rgba(68,52,19,0.2)',
    shadow: 'radial-gradient(ellipse at center,rgba(96,70,26,0.34),rgba(96,70,26,0) 70%)',
    backBg: 'linear-gradient(160deg,#FCF7EC,#F4EADA)', backInk: '#5C4A2A', backInkSoft: 'rgba(68,52,19,0.5)',
    stripe: 'linear-gradient(180deg,#3A3128,#231D17)',
  },
  Platinum: {
    bg: 'linear-gradient(158deg,#0B0912 0%,#1A1528 24%,#2E2547 48%,#141020 64%,#2A2140 84%,#0E0B18 100%)',
    texture: 'repeating-linear-gradient(97deg,rgba(255,255,255,0.06) 0 1px,rgba(0,0,0,0.055) 1px 3px), radial-gradient(120% 90% at 76% 6%,rgba(226,211,255,0.2),rgba(226,211,255,0) 56%)',
    sheen: 'linear-gradient(112deg,rgba(255,255,255,0) 38%,rgba(232,219,255,0.32) 50%,rgba(255,255,255,0) 62%)',
    edge: 'linear-gradient(180deg,#F6EFFF,#B6A2DD 32%,#FFFFFF 50%,#8574B4 72%,#E6DAFB)',
    chip: 'linear-gradient(135deg,#F4EEFF,#A899CC 44%,#FCFAFF 60%,#8878B0)',
    holo: 'conic-gradient(from 200deg,#F0E4FF,#C4A9F5,#EFD9C6,#D6C2F5,#F0E4FF)',
    ink: '#F2EDF9', inkMid: 'rgba(242,237,249,0.72)', inkSoft: 'rgba(242,237,249,0.5)', inkFaint: 'rgba(242,237,249,0.22)',
    shadow: 'radial-gradient(ellipse at center,rgba(48,32,78,0.34),rgba(48,32,78,0) 70%)',
    backBg: 'linear-gradient(160deg,#1C1729,#0C0916)', backInk: '#D6CFE4', backInkSoft: '#A99BC4',
    stripe: 'linear-gradient(180deg,#0F0C16,#060409)',
    invertLogo: true,
  },
  Diamond: {
    bg: 'linear-gradient(146deg,#05070E 0%,#0B1120 36%,#121A2C 56%,#070A13 76%,#0C1322 100%)',
    texture: 'repeating-linear-gradient(60deg,rgba(214,232,248,0.05) 0 1px,rgba(255,255,255,0) 1px 27px), repeating-linear-gradient(-60deg,rgba(214,232,248,0.05) 0 1px,rgba(255,255,255,0) 1px 27px)',
    sheen: 'linear-gradient(108deg,rgba(255,255,255,0) 40%,rgba(238,244,251,0.4) 50%,rgba(255,255,255,0) 60%)',
    edge: 'linear-gradient(180deg,#FFFFFF,#A8BED6 34%,#FFFFFF 52%,#65798F 74%,#EEF5FD)',
    chip: 'linear-gradient(135deg,#EEF4FB,#A8BED6 45%,#FFFFFF 60%,#65798F)',
    holo: 'conic-gradient(from 160deg,#FFFFFF,#C9DCEF,#E4D3F7,#FBE7D6,#FFFFFF)',
    ink: '#EEF4FB', inkMid: 'rgba(238,244,251,0.72)', inkSoft: 'rgba(238,244,251,0.5)', inkFaint: 'rgba(238,244,251,0.18)',
    shadow: 'radial-gradient(ellipse at center,rgba(20,26,40,0.4),rgba(20,26,40,0) 70%)',
    backBg: 'linear-gradient(160deg,#1E2632,#0D121B 60%,#05080D)', backInk: '#C9D6E4', backInkSoft: '#93A9C2',
    stripe: 'linear-gradient(180deg,#0A0D13,#04060A)',
    invertLogo: true,
  },
};

function perksForTier(idx) {
  return PERKS.filter(p => p.tierIdx <= idx).map(p => p.label);
}

// Our real brand mark (public/Adobe Express - file (5).png) is itself a lotus silhouette,
// so it doubles as the card's icon glyph — no separate asset needed. Rendered as the real
// image (same as the navbar) rather than a CSS mask: `mask` defaults to luminance masking
// in spec-compliant browsers (unlike the legacy alpha-based `-webkit-mask-*` it'd pair with),
// which turns a solid-black-on-transparent PNG into a broken silhouette instead of a clean one.
const LOGO_URL = '/Adobe Express - file (5).png';

// `multiply` lets the logo's black ink darken *through* a light card (like ink on paper) instead
// of sitting on top as a flat black sticker; `screen` does the equivalent lightening for the
// dark (Platinum, Diamond) skins, where the mark is inverted to white first.
function LotusMark({ size = 28, invert = false }) {
  return (
    <div
      style={{
        width: size, aspectRatio: '405/352', flexShrink: 0, opacity: 0.85,
        backgroundImage: `url("${LOGO_URL}")`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        filter: invert ? 'invert(1)' : 'none',
        mixBlendMode: invert ? 'screen' : 'multiply',
      }}
    />
  );
}

function CardChip({ background }) {
  const line = { borderRight: '1px solid rgba(40,32,20,0.28)', borderBottom: '1px solid rgba(40,32,20,0.28)' };
  return (
    <div style={{ width: '40px', aspectRatio: '1.32', borderRadius: '6px', background, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5), 0 1px 2px rgba(30,22,10,0.22)', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3,1fr)' }}>
      <div style={line} /><div style={{ borderBottom: line.borderBottom }} />
      <div style={line} /><div style={{ borderBottom: line.borderBottom }} />
      <div style={{ borderRight: line.borderRight }} /><div />
    </div>
  );
}

function ContactlessMark() {
  const arc = { position: 'absolute', left: 0, border: '1.4px solid currentColor', borderRadius: '50%' };
  return (
    <div style={{ position: 'relative', width: 20, height: 20, opacity: 0.55, flexShrink: 0 }}>
      <span style={{ ...arc, top: 5, width: 8, height: 8, clipPath: 'inset(0 0 0 55%)' }} />
      <span style={{ ...arc, top: 1, width: 15, height: 15, clipPath: 'inset(0 0 0 62%)' }} />
      <span style={{ ...arc, top: -3, width: 22, height: 22, clipPath: 'inset(0 0 0 68%)' }} />
    </div>
  );
}

// ── Flip card primitive — 3D flip on click/Enter/Space, mouse-tracking tilt + sheen.
// Front/back content are passed in; this owns the interaction + skin chrome only.
function TierCard({ skin, ariaLabel, front, back, compact = false, locked = false, lockLabel }) {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState(null);
  const rafRef = useRef(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const handleMove = (e) => {
    if (reduceMotionRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const t = { rx: -(py - 0.5) * 9, ry: (px - 0.5) * 13, sh: (px - 0.5) * 70, px, py };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setTilt(t));
  };
  const handleLeave = () => setTilt(null);
  const toggle = () => setFlipped(f => !f);
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    toggle();
  };

  const rx = tilt ? tilt.rx : 0;
  const ry = (tilt ? tilt.ry : 0) + (flipped ? 180 : 0);
  const transform = `translateZ(0.01px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  const shPct = `${(tilt ? tilt.sh : 0).toFixed(1)}%`;
  const spotPos = tilt ? `${(tilt.px * 100).toFixed(1)}% ${(tilt.py * 100).toFixed(1)}%` : '50% -12%';

  const faceShadow = `0 0 0 1px rgba(120,105,150,0.28), 0 1px 2px rgba(40,30,60,0.3), 0 ${compact ? 16 : 24}px ${compact ? 32 : 46}px -26px rgba(40,30,60,0.55), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.16)`;

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onClick={toggle}
      onKeyDown={onKeyDown}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative outline-none cursor-pointer rounded-2xl transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-4"
      style={{ perspective: 1400 }}
    >
      <div className="absolute pointer-events-none rounded-full" style={{ left: '9%', right: '9%', bottom: '-3%', height: '16%', background: skin.shadow, filter: 'blur(12px)' }} />

      <div
        className="relative w-full transition-transform duration-500"
        style={{ aspectRatio: '1.586', transformStyle: 'preserve-3d', transform, transitionTimingFunction: 'cubic-bezier(0.2,0.8,0.2,1)' }}
      >
        {/* front */}
        <div
          className="absolute inset-0 rounded-[18px] overflow-hidden"
          style={{ backfaceVisibility: 'hidden', background: skin.bg, color: skin.ink, boxShadow: faceShadow }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: skin.texture }} />
          <div className="absolute pointer-events-none transition-transform duration-300" style={{ inset: '-20% -40%', background: skin.sheen, transform: `translateX(${shPct})` }} />
          <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: '6px', background: skin.edge }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(200deg, rgba(255,255,255,0.24) 0 16%, rgba(255,255,255,0) 17% 62%, rgba(255,255,255,0.12) 100%)` }} />
          <div className="absolute inset-0 pointer-events-none transition-[background] duration-200" style={{ background: `radial-gradient(46% 66% at ${spotPos}, rgba(255,255,255,0.32), rgba(255,255,255,0) 74%)` }} />
          <div className="absolute pointer-events-none rounded-[13px]" style={{ inset: '9px', border: `1px solid ${skin.inkFaint}` }} />
          <div
            className="absolute pointer-events-none"
            style={{
              right: '-12%', bottom: '-22%', width: '54%', aspectRatio: '405/352', opacity: 0.09,
              backgroundImage: `url("${LOGO_URL}")`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
              filter: skin.invertLogo ? 'invert(1)' : 'none',
              mixBlendMode: skin.invertLogo ? 'screen' : 'multiply',
            }}
          />
          <div className="relative h-full flex flex-col justify-between" style={{ padding: compact ? '18px' : 'clamp(20px,2.8vw,28px)' }}>
            {front}
          </div>
          {locked && (
            <div
              className="absolute inset-0 z-10 flex items-end justify-center pb-[12%]"
              style={{ backdropFilter: 'blur(3px)', background: 'linear-gradient(150deg, rgba(250,249,251,0.55), rgba(236,231,246,0.4))' }}
            >
              <span className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gray-700 bg-white/85 px-3.5 py-2 rounded-full shadow-sm">
                <Lock size={10} />
                {lockLabel}
              </span>
            </div>
          )}
        </div>

        {/* back */}
        <div
          className="absolute inset-0 rounded-[18px] overflow-hidden flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: skin.backBg, color: skin.backInk, boxShadow: '0 14px 30px -20px rgba(60,60,80,0.4)' }}
        >
          <div className="relative overflow-hidden" style={{ height: '13%', marginTop: '4%', background: skin.stripe }} />
          <div className="relative flex-1" style={{ padding: compact ? '16px 18px' : 'clamp(18px,2.4vw,26px)' }}>
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Page chrome speaks the homepage's language, not the dashboard's:
   white blocks, 1.5px gray-200 rounded-2xl cards, bold sans headings over an
   11px gray eyebrow, the lavender accent (rgb(147,104,236)) used for links,
   badges and micro-labels, and a mobile carousel wherever the homepage uses
   one. Only the membership card itself keeps its own serif — it's an object,
   not page furniture.
   ────────────────────────────────────────────────────────────────────────── */

const LAVENDER = 'rgb(147,104,236)';
const LAVENDER_TINT = 'rgba(147,104,236,0.06)';
const CARD_BORDER = { borderWidth: '1.5px', borderColor: 'rgb(229,231,235)' };

function SectionHead({ eyebrow, title, action, href }) {
  return (
    <div className="mb-4 flex flex-row justify-between items-end gap-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">{eyebrow}</p>
        <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">{title}</h2>
      </div>
      {action && href && (
        <Link
          href={href}
          className="shrink-0 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: LAVENDER }}
        >
          {action} →
        </Link>
      )}
    </div>
  );
}

function Block({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border bg-white ${className}`} style={CARD_BORDER}>
      {children}
    </div>
  );
}

function StatTile({ label, value, sub, Icon }) {
  return (
    <div className="rounded-2xl border bg-white p-4 flex items-start gap-3" style={CARD_BORDER}>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: LAVENDER_TINT, color: LAVENDER }}
      >
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400">{label}</p>
        <p className="text-[22px] font-bold text-gray-900 leading-tight mt-1 tabular-nums">{value}</p>
        {sub && <p className="text-[12px] text-gray-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function StatusChip({ label, variant }) {
  const style =
    variant === 'current'
      ? { background: LAVENDER, color: '#fff' }
      : variant === 'unlocked'
        ? { background: LAVENDER_TINT, color: LAVENDER }
        : { background: 'rgb(249,250,251)', color: 'rgb(156,163,175)' };
  return (
    <span className="shrink-0 text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full" style={style}>
      {label}
    </span>
  );
}

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function AccountLoyaltyPage() {
  const { loyaltyData, wishlistItems, isLoading } = useAccountData();
  const { user } = useAuth();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [justUpgraded, setJustUpgraded] = useState(null);

  const tier = loyaltyData?.stats?.tier || 'Silver';

  useEffect(() => {
    if (isLoading || !user?.id) return;
    const key = `nl_last_tier_${user.id}`;
    const lastTier = window.localStorage.getItem(key);
    const lastIdx = TIERS.findIndex(t => t.name === lastTier);
    const curIdx = TIERS.findIndex(t => t.name === tier);
    if (lastTier && curIdx > lastIdx) {
      setJustUpgraded(tier);
      const t = setTimeout(() => setJustUpgraded(null), 4200);
      window.localStorage.setItem(key, tier);
      return () => clearTimeout(t);
    }
    window.localStorage.setItem(key, tier);
  }, [isLoading, tier, user?.id]);

  if (isLoading) {
    return (
      <AccountShell wishCount={wishCount}>
        <div className="py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: LAVENDER }} />
        </div>
      </AccountShell>
    );
  }

  const points        = Number(loyaltyData?.stats?.points || 0);
  const lifetimeSpend = Number(loyaltyData?.stats?.lifetimeSpend || 0);
  const history       = loyaltyData?.transactions || [];

  const currentTierIdx = Math.max(0, TIERS.findIndex(t => t.name === tier));
  const currentTier    = TIERS[currentTierIdx];
  const nextTier       = TIERS[currentTierIdx + 1] || null;
  const spendToNext    = nextTier ? Math.max(0, nextTier.min - lifetimeSpend) : 0;
  const progress       = nextTier
    ? Math.min(100, Math.max(0, Math.round(((lifetimeSpend - currentTier.min) / (nextTier.min - currentTier.min)) * 100)))
    : 100;

  // 100 points = AED 5 off at checkout
  const redeemValue = Math.floor(points / 100) * 5;

  const memberName  = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Member';
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const heroSkin    = SKINS[currentTier.name];

  const heroCard = (
    <div className="relative w-full max-w-[420px] mx-auto">
      <AnimatePresence>
        {justUpgraded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 flex items-center gap-1.5 text-white px-4 py-2 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase whitespace-nowrap shadow-lg"
            style={{ background: LAVENDER }}
          >
            <Sparkle size={11} />
            Welcome to {justUpgraded}
          </motion.div>
        )}
      </AnimatePresence>

      <TierCard
        skin={heroSkin}
        ariaLabel={`${tier} membership card for ${memberName}, ${points.toLocaleString()} points. Press Enter to flip.`}
        front={
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <LotusMark size={36} invert={heroSkin.invertLogo} />
                <div>
                  <p style={{ fontFamily: serif, fontSize: '18px', letterSpacing: '0.1em', lineHeight: 1 }}>NAYA LUMIÈRE</p>
                  <p style={{ fontSize: '8px', letterSpacing: '0.22em', color: heroSkin.inkSoft, marginTop: '1px' }}>COSMETICS</p>
                </div>
              </div>
              <span style={{ fontSize: '9.5px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '5px 12px', border: `1px solid ${heroSkin.inkFaint}`, borderRadius: '999px', flexShrink: 0 }}>{tier}</span>
            </div>

            <div className="flex items-center gap-3">
              <CardChip background={heroSkin.chip} />
              <ContactlessMark />
              <div className="ml-auto" style={{ width: '26px', aspectRatio: '1', borderRadius: '50%', background: heroSkin.holo, opacity: 0.72 }} />
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p style={{ fontSize: '7.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: heroSkin.inkSoft }}>
                  {memberSince ? `Member since ${memberSince}` : 'Naya Rewards member'}
                </p>
                <p style={{ fontFamily: serif, fontSize: '21px', marginTop: '4px' }}>{memberName}</p>
                <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12px', letterSpacing: '0.2em', color: heroSkin.inkMid, marginTop: '4px' }}>
                  •••• •••• {String(user?.id ?? '0000').padStart(4, '0').slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: heroSkin.inkSoft }}>Points</p>
                <p style={{ fontFamily: serif, fontSize: '25px', lineHeight: 1 }}>{points.toLocaleString()}</p>
                {nextTier && (
                  <p style={{ fontSize: '8px', letterSpacing: '0.12em', color: heroSkin.inkSoft, marginTop: '4px' }}>
                    {spendToNext.toLocaleString()} to {nextTier.name}
                  </p>
                )}
              </div>
            </div>
          </>
        }
        back={
          <div className="h-full flex flex-col justify-between">
            <div>
              <p style={{ fontSize: '8.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: heroSkin.backInkSoft }}>{tier} benefits</p>
              <div className="mt-2 grid gap-1">
                {perksForTier(currentTierIdx).map(p => (
                  <span key={p} style={{ fontSize: '12px', fontWeight: 300 }}>{p}</span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '9px', color: heroSkin.backInkSoft, fontWeight: 300 }}>
              {currentTier.multiplier}× points on every order · nayalc.com/account
            </p>
          </div>
        }
      />

      <p className="mt-3 text-center text-[11px] font-medium text-gray-400">Tap the card to see your benefits</p>
    </div>
  );

  return (
    <AccountShell wishCount={wishCount}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Block className="p-5 md:p-8 mb-8">
        <div className="grid lg:grid-cols-[1fr_minmax(0,420px)] gap-7 lg:gap-10 items-center">

          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Naya Rewards</p>
            <h1 className="mt-1 text-[30px] md:text-[38px] font-bold text-gray-900 leading-tight">
              {greetingForHour()}, {user?.first_name || 'there'}
            </h1>
            <p className="mt-2 text-[14px] text-gray-500 leading-relaxed max-w-md">
              You&apos;re a {currentTier.name} member earning {currentTier.multiplier}× points on every order.
            </p>

            <div className="flex items-end gap-2.5 mt-6">
              <span className="text-[52px] md:text-[64px] font-extrabold text-gray-900 leading-none tracking-tight tabular-nums">
                {points.toLocaleString()}
              </span>
              <span className="text-[12px] font-bold tracking-[0.14em] uppercase pb-2" style={{ color: LAVENDER }}>points</span>
            </div>
            <p className="text-[13px] text-gray-500 mt-2">
              {redeemValue > 0
                ? `Worth AED ${redeemValue.toLocaleString()} off your next order.`
                : 'Earn 100 points to unlock AED 5 off your order.'}
            </p>

            <div className="mt-6 max-w-md">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[12px] font-semibold text-gray-900">{currentTier.name}</span>
                <span className="text-[12px] font-medium text-gray-400">{nextTier ? nextTier.name : 'Top tier'}</span>
              </div>
              <div
                className="h-2 rounded-full bg-gray-100 overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={nextTier ? `Progress toward ${nextTier.name} tier` : 'Top tier reached'}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: LAVENDER }}
                />
              </div>
              <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
                {nextTier
                  ? `Spend AED ${spendToNext.toLocaleString()} more to reach ${nextTier.name}.`
                  : `You're at our highest tier — ${currentTier.multiplier}× points on every order, for good.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Link
                href="/all-products"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-90"
                style={{ background: LAVENDER }}
              >
                Shop to earn
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border text-[11px] font-bold tracking-[0.18em] uppercase text-gray-700 hover:bg-gray-50 transition-colors"
                style={CARD_BORDER}
              >
                How it works
              </a>
            </div>
          </div>

          <div className="lg:justify-self-end w-full">{heroCard}</div>
        </div>
      </Block>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8">
        <StatTile
          label="Balance"
          value={points.toLocaleString()}
          sub={redeemValue > 0 ? `Worth AED ${redeemValue.toLocaleString()}` : 'AED 5 per 100 points'}
          Icon={Wallet}
        />
        <StatTile
          label="Lifetime spend"
          value={`AED ${lifetimeSpend.toLocaleString()}`}
          sub={memberSince ? `Member since ${memberSince}` : 'Counts toward your tier'}
          Icon={ShoppingBag}
        />
        <StatTile
          label="Earn rate"
          value={`${currentTier.multiplier}× points`}
          sub={nextTier ? `${nextTier.multiplier}× at ${nextTier.name}` : 'Our highest rate'}
          Icon={Zap}
        />
      </div>

      {/* ── Tier progress ────────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionHead eyebrow="Your standing" title="Tier Progress" />
        <Block className="px-5 md:px-8 py-7">
          <div className="relative">
            {/* Track runs between the first and last node centres (12.5% → 87.5%). */}
            <div className="absolute left-[12.5%] right-[12.5%] top-[23px] h-[3px] rounded-full bg-gray-100" />
            <motion.div
              className="absolute left-[12.5%] top-[23px] h-[3px] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(75, (75 * (currentTierIdx + progress / 100)) / (TIERS.length - 1))}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{ background: LAVENDER }}
            />

            <div className="relative flex">
              {TIERS.map((t, i) => {
                const achieved = i <= currentTierIdx;
                const isCurrent = i === currentTierIdx;
                const Icon = t.Icon;
                return (
                  <div key={t.name} className="flex-1 flex flex-col items-center gap-2 text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={
                        achieved
                          ? { background: LAVENDER, color: '#fff', boxShadow: isCurrent ? '0 0 0 4px rgba(147,104,236,0.15)' : 'none' }
                          : { background: 'rgb(249,250,251)', color: 'rgb(209,213,219)', border: '1.5px solid rgb(229,231,235)' }
                      }
                    >
                      <Icon size={18} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className={`text-[13px] font-bold ${achieved ? 'text-gray-900' : 'text-gray-400'}`}>{t.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">AED {t.min.toLocaleString()}+</p>
                    </div>
                    {isCurrent && <StatusChip label="You are here" variant="current" />}
                  </div>
                );
              })}
            </div>
          </div>
        </Block>
      </section>

      {/* ── Membership cards ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionHead eyebrow="The collection" title="Membership Cards" action="Shop to level up" href="/all-products" />

        {/* Mobile: carousel — consistent with every homepage section */}
        <div className="md:hidden">
          <Carousel opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-3">
              {TIERS.map((t, idx) => (
                <CarouselItem key={t.name} className="pl-3 basis-[86%]">
                  <TierPlate
                    tier={t}
                    idx={idx}
                    currentTierIdx={currentTierIdx}
                    lifetimeSpend={lifetimeSpend}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: 2-col grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-3">
          {TIERS.map((t, idx) => (
            <TierPlate
              key={t.name}
              tier={t}
              idx={idx}
              currentTierIdx={currentTierIdx}
              lifetimeSpend={lifetimeSpend}
            />
          ))}
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionHead eyebrow="Compare" title="What You Unlock" />
        <Block className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 px-5 md:px-6 py-4 border-b border-gray-100">
                    Benefit
                  </th>
                  {TIERS.map((t, i) => (
                    <th
                      key={t.name}
                      className="text-center px-3 py-4 border-b border-gray-100"
                      style={i === currentTierIdx ? { background: LAVENDER_TINT } : undefined}
                    >
                      <span
                        className="block text-[12px] font-bold"
                        style={{ color: i === currentTierIdx ? LAVENDER : 'rgb(17,24,39)' }}
                      >
                        {t.name}
                      </span>
                      <span className="block text-[11px] font-medium text-gray-400 mt-0.5">{t.multiplier}×</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERKS.map((perk, r) => (
                  <tr key={perk.label}>
                    <td className={`text-[13px] font-medium text-gray-700 px-5 md:px-6 py-3.5 ${r < PERKS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {perk.label}
                    </td>
                    {TIERS.map((t, i) => (
                      <td
                        key={t.name}
                        className={`text-center px-3 py-3.5 ${r < PERKS.length - 1 ? 'border-b border-gray-50' : ''}`}
                        style={i === currentTierIdx ? { background: LAVENDER_TINT } : undefined}
                      >
                        {perk.tierIdx <= i
                          ? <Check size={16} strokeWidth={2.5} className="mx-auto" style={{ color: LAVENDER }} />
                          : <Minus size={14} strokeWidth={2} className="mx-auto text-gray-200" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="mb-8" id="how-it-works">
        <SectionHead eyebrow="Simple" title="How It Works" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { key: 'earn', Icon: Zap, label: 'Step one', title: 'Earn', body: `1 point per AED ${AED_PER_POINT} of product spend, multiplied by your tier — you're on ${currentTier.multiplier}× today. Credited once your order is delivered.` },
            { key: 'redeem', Icon: Wallet, label: 'Step two', title: 'Redeem', body: 'Every 100 points is worth AED 5 off, applied at checkout whenever you like.' },
            { key: 'keep', Icon: InfinityIcon, label: 'Always', title: 'Keep', body: 'Points never expire and your tier only ever moves up — never down.' },
          ].map(({ key, Icon, label, title, body }, i) => (
            <div key={key} className="rounded-2xl border bg-white p-5" style={CARD_BORDER}>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: LAVENDER }}
                >
                  <span className="text-[11px] font-bold text-white">{i + 1}</span>
                </div>
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: LAVENDER }}>{label}</p>
              </div>
              <div className="flex items-center gap-2">
                <Icon size={16} strokeWidth={1.75} className="text-gray-400" />
                <p className="text-[15px] font-bold text-gray-900">{title}</p>
              </div>
              <p className="text-[13px] text-gray-500 leading-relaxed mt-1.5">{body}</p>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-gray-400 mt-3">
          Tier status is based on lifetime spend and never resets. Points are added once your order is delivered.
        </p>
      </section>

      {/* ── Points activity ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionHead
          eyebrow="History"
          title="Points Activity"
          action={history.length > 0 ? 'View orders' : undefined}
          href={history.length > 0 ? '/account/orders' : undefined}
        />
        <Block className={history.length === 0 ? 'px-5 md:px-6 py-14' : 'px-5 md:px-6 py-2'}>
          {history.length === 0 ? (
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ background: LAVENDER_TINT, color: LAVENDER }}
              >
                <ShoppingBag size={20} strokeWidth={1.75} />
              </div>
              <p className="text-[15px] font-bold text-gray-900">No points activity yet</p>
              <p className="text-[13px] text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Your first delivered order earns {currentTier.multiplier}× points plus a {WELCOME_BONUS_POINTS}-point welcome bonus — and every AED you spend counts toward your next tier.
              </p>
              <Link
                href="/all-products"
                className="inline-flex items-center justify-center mt-5 px-8 py-3.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-90"
                style={{ background: LAVENDER }}
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div>
              {history.map((h, i) => {
                const isPending = h.type === 'pending' || h.type === 'placed';
                const isEarn = Number(h.points) > 0;
                const dateVal = h.createdAt || h.created_at;
                const Icon = isPending ? Clock : isEarn ? ArrowUpRight : ArrowDownRight;
                return (
                  <div
                    key={h.id ?? i}
                    className={`flex items-center gap-3.5 py-4 ${i < history.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={
                        isPending
                          ? { background: 'rgb(255,251,235)', color: 'rgb(217,154,43)' }
                          : isEarn
                            ? { background: LAVENDER_TINT, color: LAVENDER }
                            : { background: 'rgb(249,250,251)', color: 'rgb(156,163,175)' }
                      }
                    >
                      <Icon size={15} strokeWidth={2.25} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{h.description || h.desc}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {dateVal
                          ? new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : h.date}
                      </p>
                    </div>
                    {isPending ? (
                      <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                        Pending
                      </span>
                    ) : (
                      <span
                        className="text-[15px] font-bold tabular-nums shrink-0"
                        style={{ color: isEarn ? LAVENDER : 'rgb(107,114,128)' }}
                      >
                        {isEarn ? '+' : ''}{h.points}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Block>
      </section>

      {/* ── CTA — solid lavender block, same idiom as the Journal hub tile ── */}
      <section
        className="rounded-2xl px-6 py-12 md:px-14 md:py-14 text-center"
        style={{ background: LAVENDER }}
      >
        <p className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.18em]">Next ritual</p>
        <h2 className="mt-2 text-[28px] md:text-[32px] font-extrabold text-white leading-tight max-w-lg mx-auto">
          Find your routine, earn as you go
        </h2>
        <p className="mt-3 text-[14px] text-white/80 max-w-md mx-auto leading-relaxed">
          Take our two-minute skin quiz — every recommendation still earns your {currentTier.multiplier}× points.
        </p>
        <Link
          href="/skin-quiz"
          className="inline-flex items-center justify-center mt-6 px-8 py-3.5 rounded-full bg-white text-[11px] font-bold tracking-[0.18em] uppercase transition-opacity hover:opacity-90"
          style={{ color: LAVENDER }}
        >
          Take the skin quiz
        </Link>
      </section>

    </AccountShell>
  );
}

/* One tier in the collection — the card itself plus a homepage-style caption row. */
function TierPlate({ tier, idx, currentTierIdx, lifetimeSpend }) {
  const skin = SKINS[tier.name];
  const achieved = currentTierIdx >= idx;
  const isCurrent = idx === currentTierIdx;
  const locked = !achieved;
  const away = locked ? Math.max(0, tier.min - lifetimeSpend) : 0;

  const chipLabel = isCurrent ? 'Your tier' : achieved ? 'Unlocked' : `AED ${away.toLocaleString()} away`;
  const chipVariant = isCurrent ? 'current' : achieved ? 'unlocked' : 'locked';

  return (
    <div className="rounded-2xl border bg-white p-4 h-full flex flex-col" style={CARD_BORDER}>
      <TierCard
        compact
        skin={skin}
        ariaLabel={`${tier.name} tier card — press Enter to flip`}
        locked={locked}
        lockLabel={chipLabel}
        front={
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <LotusMark size={26} invert={skin.invertLogo} />
                <div>
                  <p style={{ fontFamily: serif, fontSize: '14px', letterSpacing: '0.09em', lineHeight: 1 }}>NAYA LUMIÈRE</p>
                  <p style={{ fontSize: '7px', letterSpacing: '0.2em', color: skin.inkSoft, marginTop: '1px' }}>COSMETICS</p>
                </div>
              </div>
              <span style={{ fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: skin.inkSoft, flexShrink: 0 }}>Tier 0{idx + 1}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CardChip background={skin.chip} />
              <ContactlessMark />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p style={{ fontFamily: serif, fontSize: 'clamp(24px,2.6vw,30px)', fontWeight: 300, lineHeight: 1 }}>{tier.name}</p>
                <p style={{ fontSize: '8.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: skin.inkSoft, marginTop: '4px' }}>
                  AED {tier.min.toLocaleString()}{idx < TIERS.length - 1 ? ` — ${(TIERS[idx + 1].min - 1).toLocaleString()}` : '+'}
                </p>
              </div>
              <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: skin.inkSoft }}>{tier.multiplier}× pts</span>
            </div>
          </>
        }
        back={
          <div className="h-full flex flex-col justify-between">
            <div>
              <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: skin.backInkSoft }}>{tier.name} benefits</p>
              <div className="mt-2 grid gap-1">
                {perksForTier(idx).map(p => (
                  <span key={p} style={{ fontSize: '12px', fontWeight: 300 }}>{p}</span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '9px', color: skin.backInkSoft, fontWeight: 300 }}>Naya Rewards · {tier.name} tier</p>
          </div>
        }
      />

      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-50">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: LAVENDER }}>Tier 0{idx + 1}</p>
          <p className="text-[15px] font-bold text-gray-900 leading-snug mt-0.5">{tier.name}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {perksForTier(idx).length} benefits · {tier.multiplier}× points
          </p>
        </div>
        <StatusChip label={chipLabel} variant={chipVariant} />
      </div>
    </div>
  );
}
