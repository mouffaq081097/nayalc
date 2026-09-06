'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cormorant_Garamond } from 'next/font/google';
import {
  Star, Award, Crown, Gem,
  Zap, Wallet, Lock, ArrowUpRight, ArrowDownRight, ShoppingBag, Sparkle,
} from 'lucide-react';
import Link from 'next/link';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';
import { useAuth } from '../../context/AuthContext';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500'], style: ['normal', 'italic'], display: 'swap' });
const serif = cormorant.style.fontFamily;

const TIERS = [
  { name: 'Silver',   min: 0,     multiplier: 1,   Icon: Star },
  { name: 'Gold',     min: 2000,  multiplier: 1.5, Icon: Award },
  { name: 'Platinum', min: 5000,  multiplier: 2,   Icon: Crown },
  { name: 'Diamond',  min: 10000, multiplier: 2.5, Icon: Gem },
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

function Card({ children, className = '', delay = 0, id }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`w-full bg-white border border-[#eaeaea] rounded-lg overflow-hidden mb-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ title }) {
  return (
    <div className="px-6 py-4 border-b border-[#eaeaea]">
      <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-2 py-2 border-t border-[#f0f0f0] first:border-t-0">
      <span className="flex-none text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="flex-1 border-b border-dotted border-gray-200 -translate-y-[3px]" />
      <span className="flex-none text-[12.5px] text-gray-700">{value}</span>
    </div>
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
          <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </AccountShell>
    );
  }

  const points        = Number(loyaltyData?.stats?.points        || 0);
  const lifetimeSpend  = Number(loyaltyData?.stats?.lifetimeSpend || 0);
  const history         = loyaltyData?.transactions || [];

  const currentTierIdx = Math.max(0, TIERS.findIndex(t => t.name === tier));
  const currentTier    = TIERS[currentTierIdx];
  const nextTier        = TIERS[currentTierIdx + 1] || null;
  const spendToNext     = nextTier ? Math.max(0, nextTier.min - lifetimeSpend) : 0;
  const progress         = nextTier ? Math.min(100, Math.round((lifetimeSpend / nextTier.min) * 100)) : 100;

  const memberName  = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Member';
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const heroSkin     = SKINS[currentTier.name];

  return (
    <AccountShell wishCount={wishCount}>

      {/* Greeting */}
      <div className="mb-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Naya Rewards</span>
        <h1 className="mt-1 text-[30px] leading-tight" style={{ fontFamily: serif, fontWeight: 300 }}>
          {greetingForHour()}, {user?.first_name || 'there'}.
        </h1>
        <p className="mt-1.5 text-[14px] text-gray-500 max-w-lg">
          Your membership deepens with every order — quiet rewards, earlier access, and points that never expire.
        </p>
      </div>

      {/* Hero card + balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-10">
        <div className="relative">
          <AnimatePresence>
            {justUpgraded && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap shadow-lg"
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
                    <LotusMark size={38} invert={heroSkin.invertLogo} />
                    <div>
                      <p style={{ fontFamily: serif, fontSize: '19px', letterSpacing: '0.1em', lineHeight: 1 }}>NAYA LUMIÈRE</p>
                      <p style={{ fontSize: '8px', letterSpacing: '0.22em', color: heroSkin.inkSoft, marginTop: '1px' }}>COSMETICS</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '9.5px', letterSpacing: '0.28em', textTransform: 'uppercase', padding: '5px 12px', border: `1px solid ${heroSkin.inkFaint}`, borderRadius: '999px', flexShrink: 0 }}>{tier}</span>
                </div>

                <div className="flex items-center gap-3">
                  <CardChip background={heroSkin.chip} />
                  <ContactlessMark />
                  <div className="ml-auto" style={{ width: '26px', aspectRatio: '1', borderRadius: '50%', background: heroSkin.holo, opacity: 0.72 }} />
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p style={{ fontSize: '7.5px', letterSpacing: '0.3em', textTransform: 'uppercase', color: heroSkin.inkSoft }}>
                      {memberSince ? `Member since ${memberSince}` : 'Naya Rewards member'}
                    </p>
                    <p style={{ fontFamily: serif, fontSize: '22px', marginTop: '4px' }}>{memberName}</p>
                    <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12.5px', letterSpacing: '0.2em', color: heroSkin.inkMid, marginTop: '4px' }}>
                      •••• •••• {String(user?.id ?? '0000').padStart(4, '0').slice(-4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: '8px', letterSpacing: '0.26em', textTransform: 'uppercase', color: heroSkin.inkSoft }}>Points</p>
                    <p style={{ fontFamily: serif, fontSize: '26px', lineHeight: 1 }}>{points.toLocaleString()}</p>
                    {nextTier && (
                      <p style={{ fontSize: '8px', letterSpacing: '0.14em', color: heroSkin.inkSoft, marginTop: '4px' }}>
                        {spendToNext.toLocaleString()} TO {nextTier.name.toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>
              </>
            }
            back={
              <div className="h-full flex flex-col justify-between">
                <div>
                  <p style={{ fontSize: '8.5px', letterSpacing: '0.28em', textTransform: 'uppercase', color: heroSkin.backInkSoft }}>{tier} benefits</p>
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
        </div>

        <div className="grid gap-5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span style={{ fontFamily: serif, fontSize: 'clamp(40px,5vw,54px)', fontWeight: 300, lineHeight: 1 }}>{points.toLocaleString()}</span>
              <span className="text-[13px] uppercase tracking-wide text-gray-400">points</span>
            </div>
          </div>

          <div>
            <div
              className="h-[3px] bg-[#ebe6f3] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={nextTier ? `Progress toward ${nextTier.name} tier` : 'Top tier reached'}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#B79BE6,#7C5CD6)' }}
              />
            </div>
            <p className="mt-2 text-[14px] font-light text-gray-500">
              {nextTier
                ? `AED ${spendToNext.toLocaleString()} to ${nextTier.name} — ${currentTier.multiplier}× points until then.`
                : `You're at our highest tier — ${currentTier.multiplier}× points on every order, for good.`}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400 self-center">Tap the card to flip</span>
            <a href="#rewards" className="border border-[#dad3e6] text-gray-900 px-6 py-3 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] hover:border-purple-300 transition-colors">
              How it works
            </a>
          </div>
        </div>
      </div>

      {/* Tier ladder */}
      <Card delay={0.05}>
        <CardHeader title="Tier Progress" />
        <div className="px-6 py-6">
          <div className="flex items-start">
            {TIERS.map((t, i) => {
              const achieved = lifetimeSpend >= t.min;
              const isCurrent = t.name === tier;
              const Icon = t.Icon;
              return (
                <React.Fragment key={t.name}>
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${achieved ? 'shadow-md' : 'bg-gray-50 border border-[#eaeaea]'}`}
                      style={achieved ? { background: SKINS[t.name].edge } : {}}
                    >
                      <Icon size={18} strokeWidth={1.75} className={achieved ? '' : 'text-gray-300'} style={achieved ? { color: SKINS[t.name].ink } : {}} />
                    </div>
                    <div className="text-center">
                      <p className={`text-[11px] font-semibold ${isCurrent ? 'text-purple-600' : achieved ? 'text-gray-700' : 'text-gray-300'}`}>{t.name}</p>
                      <p className="text-[9px] text-gray-300 mt-0.5">AED {t.min.toLocaleString()}+</p>
                    </div>
                    {isCurrent && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                  {i < TIERS.length - 1 && (
                    <div className={`h-0.5 flex-1 mt-5 rounded-full ${lifetimeSpend >= TIERS[i + 1].min ? 'bg-purple-300' : 'bg-[#eaeaea]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      {/* The Collection — one plate per tier */}
      <div className="mb-2">
        <div className="h-[2px] bg-gray-900 mb-4" />
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-900">The Collection</span>
          <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400">Four tiers · Real rewards</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(28px,3.6vw,40px)' }}>Four levels of care</h2>
          <p className="text-[13.5px] text-gray-500 max-w-xs">Tap any card to see what it holds. Your tier only ever moves up.</p>
        </div>
      </div>

      <div className="border-b border-gray-900/15">
        {TIERS.map((t, idx) => {
          const skin = SKINS[t.name];
          const achieved = currentTierIdx >= idx;
          const locked = currentTierIdx < idx;
          const isCurrent = idx === currentTierIdx;
          const away = locked ? Math.max(0, t.min - lifetimeSpend) : 0;

          let chipLabel, chipStyle;
          if (isCurrent) {
            chipLabel = 'Your tier';
            chipStyle = { background: '#7C5CD6', color: '#fff' };
          } else if (achieved) {
            chipLabel = 'Unlocked';
            chipStyle = { background: '#EFE9FB', color: '#6D4FC4' };
          } else {
            chipLabel = `AED ${away.toLocaleString()} away`;
            chipStyle = { background: '#F3F1F7', color: '#9B93A8' };
          }

          return (
            <article key={t.name} className="grid gap-5 py-8 border-t border-gray-900/15">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-2.5">
                  <span style={{ fontFamily: serif, fontSize: '22px', fontWeight: 300, color: '#1C1A22' }}>{['I', 'II', 'III', 'IV'][idx]}</span>
                  <span className="text-[8.5px] uppercase tracking-[0.32em] text-gray-400">Plate {['one', 'two', 'three', 'four'][idx]}</span>
                </div>
                <span className="text-[8.5px] uppercase tracking-[0.28em] text-gray-400">NL–0{idx + 1}</span>
              </div>

              <div className="flex flex-wrap items-start gap-10">
                <div className="flex-1 min-w-[280px] max-w-[520px]" style={{ opacity: locked ? 0.9 : 1 }}>
                  <div className="relative">
                    <TierCard
                      compact
                      skin={skin}
                      ariaLabel={`${t.name} tier card — press Enter to flip`}
                      locked={locked}
                      lockLabel={chipLabel}
                      front={
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <LotusMark size={30} invert={skin.invertLogo} />
                              <div>
                                <p style={{ fontFamily: serif, fontSize: '16px', letterSpacing: '0.09em', lineHeight: 1 }}>NAYA LUMIÈRE</p>
                                <p style={{ fontSize: '7.5px', letterSpacing: '0.2em', color: skin.inkSoft, marginTop: '1px' }}>COSMETICS</p>
                              </div>
                            </div>
                            <span style={{ fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: skin.inkSoft, flexShrink: 0 }}>Tier 0{idx + 1}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <CardChip background={skin.chip} />
                            <ContactlessMark />
                          </div>
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p style={{ fontFamily: serif, fontSize: 'clamp(26px,3vw,34px)', fontWeight: 300, lineHeight: 1 }}>{t.name}</p>
                              <p style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: skin.inkSoft, marginTop: '4px' }}>
                                AED {t.min.toLocaleString()}{idx < TIERS.length - 1 ? ` — ${(TIERS[idx + 1].min - 1).toLocaleString()}` : '+'}
                              </p>
                            </div>
                            <span style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: skin.inkSoft }}>{t.multiplier}× pts</span>
                          </div>
                        </>
                      }
                      back={
                        <div className="h-full flex flex-col justify-between">
                          <div>
                            <p style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: skin.backInkSoft }}>{t.name} benefits</p>
                            <div className="mt-2 grid gap-1">
                              {perksForTier(idx).map(p => (
                                <span key={p} style={{ fontSize: '12.5px', fontWeight: 300 }}>{p}</span>
                              ))}
                            </div>
                          </div>
                          <p style={{ fontSize: '9px', color: skin.backInkSoft, fontWeight: 300 }}>Naya Rewards · {t.name} tier</p>
                        </div>
                      }
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[260px] grid gap-4 content-start">
                  <div>
                    <h3 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(24px,3vw,30px)' }}>{t.name}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed mt-1">
                      {idx === 0 && 'The beginning — free to join, points from your very first order.'}
                      {idx === 1 && `Reached at AED ${t.min.toLocaleString()} lifetime spend — faster points, free shipping, early access.`}
                      {idx === 2 && `Reached at AED ${t.min.toLocaleString()} lifetime spend — ${t.multiplier}× points and every everyday perk unlocked.`}
                      {idx === 3 && `Our top tier — AED ${t.min.toLocaleString()}+, ${t.multiplier}× points, a dedicated concierge, and free returns with no minimum.`}
                    </p>
                  </div>
                  <div>
                    <InfoRow label="Threshold" value={`AED ${t.min.toLocaleString()}+`} />
                    <InfoRow label="Earn rate" value={`${t.multiplier}× per AED 1`} />
                    <InfoRow label="Perks" value={`${perksForTier(idx).length} of ${PERKS.length}`} />
                    <InfoRow label="Finish" value={t.name === 'Silver' ? 'Brushed pewter' : t.name === 'Gold' ? 'Warm gold' : t.name === 'Platinum' ? 'Deep violet' : 'Midnight steel'} />
                  </div>
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full justify-self-start" style={chipStyle}>
                    {chipLabel}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* How it works */}
      <Card delay={0.2} id="rewards">
        <CardHeader title="How Naya Rewards Works" />
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#eaeaea]">
          <div className="px-6 py-5 flex flex-col items-start gap-2">
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap size={16} strokeWidth={1.75} />
            </div>
            <p className="text-[13px] font-semibold text-gray-900">Earn</p>
            <p className="text-[12px] text-gray-500">1 point per AED 1 spent, multiplied by your tier — Silver 1×, Gold 1.5×, Platinum 2×, Diamond 2.5×.</p>
          </div>
          <div className="px-6 py-5 flex flex-col items-start gap-2">
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet size={16} strokeWidth={1.75} />
            </div>
            <p className="text-[13px] font-semibold text-gray-900">Redeem</p>
            <p className="text-[12px] text-gray-500">Every 100 points is worth AED 5 off your order at checkout.</p>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-[#f3f3f5] bg-[#fafafa]">
          <p className="text-[11px] text-gray-400">Your points never expire, and tier status is based on lifetime spend — once you reach a tier, you keep it.</p>
        </div>
      </Card>

      {/* Points History */}
      <Card delay={0.25}>
        <CardHeader title="Points History" />
        {history.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-500 mx-auto flex items-center justify-center mb-3">
              <ShoppingBag size={18} strokeWidth={1.75} />
            </div>
            <p className="text-[13px] font-semibold text-gray-900">No transactions yet</p>
            <p className="text-[12px] text-gray-400 mt-1 max-w-xs mx-auto">
              Your first order earns {currentTier.multiplier}× points — every AED 1 spent counts.
            </p>
            <Link
              href="/all-products"
              className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-semibold text-purple-600 hover:underline"
            >
              Shop now
            </Link>
          </div>
        ) : (
          <div className="px-6 py-2">
            {history.map((h, i) => {
              const isPending = h.type === 'pending' || h.type === 'placed';
              const isEarn = Number(h.points) > 0;
              const dateVal = h.createdAt || h.created_at;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-2.5 ${
                      isPending ? 'bg-amber-50 text-amber-500' : isEarn ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {isEarn ? <ArrowUpRight size={13} strokeWidth={2.25} /> : <ArrowDownRight size={13} strokeWidth={2.25} />}
                    </div>
                    {i < history.length - 1 && <div className="w-px flex-1 bg-[#eaeaea]" style={{ minHeight: '12px' }} />}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between py-3">
                    <div>
                      <div className="text-[13px] font-medium text-gray-900">{h.description || h.desc}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {dateVal ? new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : h.date}
                      </div>
                    </div>
                    {isPending ? (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Pending
                      </span>
                    ) : (
                      <span className={`text-[13px] font-semibold tabular-nums ${isEarn ? 'text-green-600' : 'text-red-500'}`}>
                        {isEarn ? '+' : ''}{h.points}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* CTA */}
      <div className="rounded-2xl p-10 md:p-14 grid gap-3 justify-items-center text-center" style={{ background: 'linear-gradient(120deg,#F3EDFC 0%,#FAF7FE 60%,#F7F3FB 100%)' }}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-400">Next ritual</span>
        <h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(24px,3.4vw,34px)' }} className="max-w-sm">Find your routine, earn as you go</h2>
        <p className="max-w-md text-[14px] text-gray-500">Take our two-minute skin quiz — every recommendation still earns your {currentTier.multiplier}× points.</p>
        <Link href="/skin-quiz" className="mt-2 bg-gray-900 text-white px-7 py-3.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] hover:opacity-85 transition-opacity">
          Take the skin quiz
        </Link>
      </div>

    </AccountShell>
  );
}
