"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, ShoppingBag, Sparkles, X, Gift, Star, Trash2,
  ShieldCheck, ChevronDown, Tag, Truck, Minus, Plus, Check,
} from 'lucide-react';
import { calcShipping, nextShippingTier, SHIPPING_TIERS, ARTISAN_GIFT_THRESHOLD, ARTISAN_GIFT_NAME } from '@/lib/shipping';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PairItWithSection from '../components/PairItWithSection';
import BuyAgainSection from '../components/BuyAgainSection';
import TabbyPromo from '../components/TabbyPromo';

const GRADIENT = 'linear-gradient(90deg,#c087fc,#9869f7)';
const UNDO_WINDOW_MS = 4000;

// Must match app/api/orders/route.js, which rejects orders whose total drifts
// from its own calculation: VAT is 5% of the pre-discount subtotal, and every
// 100 loyalty points redeem for AED 5.
const VAT_RATE = 0.05;
const POINTS_BLOCK = 100;
const AED_PER_BLOCK = 5;

const fmt = (n) =>
  `AED ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7]/40';

function CartHeader({ onBack }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e5ea] bg-white">
      <div className="mx-auto relative flex h-[56px] md:h-[60px] max-w-[1180px] items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Continue shopping"
          className={`group shrink-0 flex items-center gap-2 h-[38px] px-3 sm:px-4 rounded-full border border-[#e5e5ea] bg-white text-[12px] font-semibold text-[#2a2a31] hover:bg-[#f3f3f5] hover:border-[#c8c8cf] transition-colors ${focusRing}`}
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Continue shopping</span>
        </button>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center rounded-md transition-opacity hover:opacity-75 active:opacity-60"
        >
          <BrandLogo priority />
        </Link>

        <div className="shrink-0 hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[#8a8a93]">
          <ShieldCheck size={13} className="text-emerald-500" />
          Secure checkout
        </div>
        <div className="sm:hidden w-[38px]" aria-hidden="true" />
      </div>
    </header>
  );
}

function IconBadge({ children }) {
  return (
    <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#f5f0fd] text-[#9869f7]">
      {children}
    </span>
  );
}

function SummaryRow({ label, value, positive = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#5a5a64]">{label}</dt>
      <dd className={`font-semibold tabular-nums ${positive ? 'text-emerald-600' : 'text-[#111114]'}`}>{value}</dd>
    </div>
  );
}

const stepBtn = `w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center rounded-full text-[#2a2a31] hover:bg-[#f3f3f5] disabled:opacity-30 disabled:hover:bg-transparent transition-colors ${focusRing}`;

function CartItemRow({ item, onQuantity, onRemove }) {
  const outOfStock = item.stock_quantity === 0;
  const overStock = !outOfStock && item.quantity > item.stock_quantity;
  const atStockLimit = item.quantity >= item.stock_quantity;
  const onSale = item.originalPrice > item.price;
  const productHref = `/product/${item.id}`;

  return (
    <div className={`flex gap-3.5 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 ${outOfStock ? 'bg-red-50/50' : ''}`}>
      <Link
        href={productHref}
        className={`shrink-0 w-[76px] h-[76px] sm:w-[96px] sm:h-[96px] rounded-xl bg-[#f7f7f9] border border-[#eeeef1] overflow-hidden p-2 ${focusRing}`}
      >
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          className={`w-full h-full object-contain mix-blend-multiply ${outOfStock ? 'opacity-50' : ''}`}
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8a8a93] truncate">
              {item.brand || 'Naya Lumière'}
            </p>
            <Link
              href={productHref}
              className="mt-0.5 block text-[14px] sm:text-[15px] font-semibold leading-snug text-[#111114] line-clamp-2 hover:underline underline-offset-2"
            >
              {item.name}
            </Link>
            {(item.size || item.shade) && (
              <p className="mt-0.5 text-[12px] text-[#8a8a93]">{[item.size, item.shade].filter(Boolean).join(' · ')}</p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[14px] sm:text-[16px] font-semibold text-[#111114] tabular-nums">{fmt(item.price * item.quantity)}</p>
            {onSale && (
              <p className="text-[11.5px] text-[#a1a1aa] line-through tabular-nums">{fmt(item.originalPrice * item.quantity)}</p>
            )}
            {item.quantity > 1 && (
              <p className="text-[11px] text-[#8a8a93] tabular-nums">{fmt(item.price)} each</p>
            )}
          </div>
        </div>

        {outOfStock && (
          <p className="mt-2 self-start rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            Out of stock — remove to continue
          </p>
        )}
        {overStock && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            <span className="font-semibold text-amber-700">Only {item.stock_quantity} left</span>
            <button
              type="button"
              onClick={() => onQuantity(item.id, item.stock_quantity)}
              className="font-semibold text-[#7c3aed] underline underline-offset-2"
            >
              Update to {item.stock_quantity}
            </button>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div
            role="group"
            aria-label={`Quantity for ${item.name}`}
            className="flex items-center rounded-full border border-[#e5e5ea] bg-white"
          >
            <button
              type="button"
              onClick={() => (item.quantity <= 1 ? onRemove(item.id) : onQuantity(item.id, item.quantity - 1))}
              aria-label={item.quantity <= 1 ? `Remove ${item.name}` : `Decrease quantity of ${item.name}`}
              className={stepBtn}
            >
              {item.quantity <= 1 ? <Trash2 size={15} /> : <Minus size={15} />}
            </button>
            <span aria-live="polite" className="w-8 text-center text-[14px] font-semibold tabular-nums text-[#111114] select-none">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantity(item.id, item.quantity + 1)}
              disabled={outOfStock || atStockLimit}
              aria-label={`Increase quantity of ${item.name}`}
              className={stepBtn}
            >
              <Plus size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className={`h-11 px-2 -mr-2 inline-flex items-center gap-1.5 rounded-full text-[13px] font-medium text-[#8a8a93] hover:text-red-600 transition-colors ${focusRing}`}
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function RemovedRow({ item, onUndo }) {
  return (
    <div role="status" className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#faf7ff]">
      <p className="min-w-0 truncate text-[13px] text-[#5a5a64]">
        Removed <span className="font-semibold text-[#111114]">{item.name}</span>
      </p>
      <button
        type="button"
        onClick={() => onUndo(item.id)}
        className={`shrink-0 h-11 px-4 rounded-full text-[13px] font-semibold text-[#7c3aed] hover:bg-[#f0e6ff] transition-colors ${focusRing}`}
      >
        Undo
      </button>
      <motion.span
        aria-hidden="true"
        className="absolute left-0 bottom-0 h-0.5 w-full origin-left"
        style={{ background: GRADIENT }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: UNDO_WINDOW_MS / 1000, ease: 'linear' }}
      />
    </div>
  );
}

export default function CartPage() {
  const {
    cartItems, removeFromCart, updateQuantity,
    appliedCoupon, discountAmount, applyCoupon, removeCoupon, couponError,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [buyAgainRaw, setBuyAgainRaw] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  // Ids removed but still inside their undo window (the cart itself isn't touched yet)
  const [pendingRemoval, setPendingRemoval] = useState(() => new Set());

  const removalTimers = useRef(new Map());
  const latestRemove = useRef(removeFromCart);
  useEffect(() => { latestRemove.current = removeFromCart; });

  // Once per signed-in user — previously this refetched on every quantity tap.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let cancelled = false;
    fetch(`/api/users/${userId}/buy-again`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (!cancelled && Array.isArray(d)) setBuyAgainRaw(d); })
      .catch(err => console.error('Buy-again fetch failed:', err));
    fetch(`/api/users/${userId}/loyalty`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d?.stats) setLoyaltyPoints(d.stats.points || 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, userId]);

  // Leaving the page mid-undo-window still commits the removal.
  useEffect(() => {
    const timers = removalTimers.current;
    const remove = latestRemove;
    return () => {
      timers.forEach((timer, id) => { clearTimeout(timer); remove.current(id); });
      timers.clear();
    };
  }, []);

  const dropPending = (id) =>
    setPendingRemoval(prev => { const next = new Set(prev); next.delete(id); return next; });

  const scheduleRemove = (id) => {
    if (removalTimers.current.has(id)) return;
    setPendingRemoval(prev => new Set(prev).add(id));
    const timer = setTimeout(() => {
      removalTimers.current.delete(id);
      latestRemove.current(id);
      dropPending(id);
    }, UNDO_WINDOW_MS);
    removalTimers.current.set(id, timer);
  };

  const undoRemove = (id) => {
    clearTimeout(removalTimers.current.get(id));
    removalTimers.current.delete(id);
    dropPending(id);
  };

  const flushPendingRemovals = () => {
    removalTimers.current.forEach((timer, id) => { clearTimeout(timer); latestRemove.current(id); });
    removalTimers.current.clear();
    setPendingRemoval(new Set());
  };

  const visibleItems = cartItems.filter(i => !pendingRemoval.has(i.id));
  const totalQty = visibleItems.reduce((s, i) => s + i.quantity, 0);
  const subtotal = visibleItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemSavings = visibleItems.reduce(
    (s, i) => s + (i.originalPrice > i.price ? (i.originalPrice - i.price) * i.quantity : 0),
    0
  );
  const shipping = calcShipping(totalQty);
  const nextTier = nextShippingTier(totalQty);
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = Math.max(0, subtotal - discountAmount + shipping + vat);
  const totalSavings = itemSavings + discountAmount;
  const hasStockIssues = visibleItems.some(i => i.stock_quantity === 0 || i.quantity > i.stock_quantity);
  const canCheckout = visibleItems.length > 0 && !hasStockIssues;

  const artisanPct = Math.min(100, Math.round((subtotal / ARTISAN_GIFT_THRESHOLD) * 100));
  const artisanGap = Math.max(0, ARTISAN_GIFT_THRESHOLD - subtotal);
  const redeemableAed = Math.floor(loyaltyPoints / POINTS_BLOCK) * AED_PER_BLOCK;
  const pointsEarned = Math.floor(subtotal);
  const checkoutLabel = isAuthenticated ? 'Checkout' : 'Sign in to checkout';

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/all-products');
  };

  const handleCheckout = () => {
    if (!canCheckout) return;
    flushPendingRemovals();
    router.push(isAuthenticated ? '/need-anything-else' : '/auth?callbackUrl=/checkout');
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code || isApplyingCoupon) return;
    setIsApplyingCoupon(true);
    try { await applyCoupon(code); } finally { setIsApplyingCoupon(false); }
  };

  const handleAiAdvice = async () => {
    if (!visibleItems.length) return;
    setIsAiLoading(true);
    setAiAdvice(null);
    try {
      const res = await fetch('/api/ai/cart-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: visibleItems }),
      });
      const d = await res.json();
      setAiAdvice(d.advice || "I'm sorry, I couldn't generate advice at this moment.");
    } catch {
      setAiAdvice("I'm sorry, I couldn't generate advice at this moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <CartHeader onBack={handleBack} />
        <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#f5f0fd]">
            <ShoppingBag size={30} strokeWidth={1.5} className="text-[#9869f7]" />
          </div>
          <div>
            <h1 className="text-[24px] font-semibold text-[#111114]">Your bag is empty</h1>
            <p className="mt-1.5 max-w-xs text-[14px] text-[#5a5a64]">
              Find something you love — shipping is free from 3 items.
            </p>
          </div>
          <Link
            href="/all-products"
            className={`inline-flex items-center gap-2 h-12 px-8 rounded-full text-[14px] font-semibold text-white transition-transform active:scale-[0.98] ${focusRing}`}
            style={{ background: GRADIENT }}
          >
            Explore the collection
            <ArrowRight size={15} />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white pb-32 lg:pb-16">
        <CartHeader onBack={handleBack} />

        <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
          <h1 className="mb-5 sm:mb-8 text-[26px] sm:text-[32px] font-semibold tracking-tight text-[#111114]">
            Your bag
            <span className="ml-2 text-[15px] sm:text-[17px] font-medium text-[#8a8a93]">
              ({totalQty} {totalQty === 1 ? 'item' : 'items'})
            </span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10 items-start">

            {/* ── Items ── */}
            <section aria-label="Items in your bag" className="min-w-0">
              <ul className="-mx-4 sm:mx-0 border-y sm:border border-[#e5e5ea] sm:rounded-2xl overflow-hidden bg-white divide-y divide-[#eeeef1]">
                <AnimatePresence initial={false}>
                  {cartItems.map(item => (
                    <motion.li
                      key={item.id}
                      layout
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      {pendingRemoval.has(item.id)
                        ? <RemovedRow item={item} onUndo={undoRemove} />
                        : <CartItemRow item={item} onQuantity={updateQuantity} onRemove={scheduleRemove} />}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>

            {/* ── Summary (sticky on desktop; directly after the items on mobile) ── */}
            <aside className="lg:row-span-2 lg:sticky lg:top-[84px] space-y-4 min-w-0">
              <section aria-labelledby="summary-heading" className="bg-white border border-[#e5e5ea] rounded-2xl p-5 sm:p-6">
                <h2 id="summary-heading" className="text-[17px] font-semibold text-[#111114]">Order summary</h2>

                <dl className="mt-4 space-y-2.5 text-[14px]">
                  <SummaryRow label={`Subtotal (${totalQty} ${totalQty === 1 ? 'item' : 'items'})`} value={fmt(subtotal)} />
                  {discountAmount > 0 && (
                    <SummaryRow
                      label={`Promo${appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}`}
                      value={`−${fmt(discountAmount)}`}
                      positive
                    />
                  )}
                  <SummaryRow label="Shipping" value={shipping === 0 ? 'Free' : fmt(shipping)} positive={shipping === 0} />
                  <SummaryRow label="VAT (5%)" value={fmt(vat)} />
                </dl>

                {/* Promo code */}
                <div className="mt-4 pt-4 border-t border-[#eeeef1]">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2">
                      <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-emerald-700">
                        <Check size={14} className="shrink-0" />
                        <span className="truncate">{appliedCoupon.code} applied</span>
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className={`shrink-0 h-9 px-2 rounded-full text-[12px] font-semibold text-emerald-700 hover:underline ${focusRing}`}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setPromoOpen(o => !o)}
                        aria-expanded={promoOpen}
                        aria-controls="promo-panel"
                        className={`w-full h-11 -my-1 flex items-center justify-between rounded-lg text-[14px] font-medium text-[#2a2a31] ${focusRing}`}
                      >
                        <span className="flex items-center gap-2">
                          <Tag size={15} className="text-[#9869f7]" />
                          Add a promo code
                        </span>
                        <ChevronDown size={16} className={`text-[#8a8a93] transition-transform ${promoOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {promoOpen && (
                        <div id="promo-panel" className="mt-3">
                          <form
                            onSubmit={e => { e.preventDefault(); handleApplyCoupon(); }}
                            className="flex gap-2"
                          >
                            <label htmlFor="promo-code" className="sr-only">Promo code</label>
                            <input
                              id="promo-code"
                              value={couponCode}
                              onChange={e => { setCouponCode(e.target.value); if (couponError) removeCoupon(); }}
                              placeholder="Enter code"
                              autoComplete="off"
                              autoCapitalize="characters"
                              spellCheck={false}
                              enterKeyHint="done"
                              aria-invalid={!!couponError}
                              aria-describedby={couponError ? 'promo-error' : undefined}
                              className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border border-[#e5e5ea] bg-white text-[16px] lg:text-[14px] text-[#111114] placeholder:text-[#b4b4bb] focus:outline-none focus:border-[#9869f7] focus:ring-2 focus:ring-[#9869f7]/15"
                            />
                            <button
                              type="submit"
                              disabled={!couponCode.trim() || isApplyingCoupon}
                              className="min-w-[84px] h-11 px-5 rounded-xl inline-flex items-center justify-center text-[13px] font-semibold text-white disabled:opacity-40 transition-opacity"
                              style={{ background: GRADIENT }}
                            >
                              {isApplyingCoupon
                                ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-label="Applying" />
                                : 'Apply'}
                            </button>
                          </form>
                          {couponError && (
                            <p id="promo-error" role="alert" className="mt-2 text-[12px] font-medium text-red-600">{couponError}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-[#e5e5ea]">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[16px] font-semibold text-[#111114]">Total</span>
                    <span className="text-[22px] font-bold text-[#111114] tabular-nums">{fmt(total)}</span>
                  </div>
                  <p className="mt-0.5 text-right text-[11.5px] text-[#8a8a93]">VAT included</p>
                  {totalSavings > 0 && (
                    <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700">
                      You&apos;re saving {fmt(totalSavings)} on this order
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="hidden lg:flex mt-5 w-full h-14 rounded-full items-center justify-center gap-2.5 text-[15px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#9869f7]"
                  style={{ background: GRADIENT, boxShadow: '0 6px 22px rgba(152,105,247,.32)' }}
                >
                  {checkoutLabel}
                  <ArrowRight size={17} />
                </button>
                {hasStockIssues && (
                  <p role="alert" className="hidden lg:block mt-2.5 text-center text-[12px] font-medium text-red-600">
                    Remove or update the highlighted items to continue.
                  </p>
                )}

                {/* TabbyPromo renders an empty div when unconfigured — collapse the gap then */}
                <div className="mt-4 has-[>div:empty]:hidden">
                  <TabbyPromo price={total} source="cart" />
                </div>

                <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11.5px] text-[#8a8a93]">
                  <li className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Secure checkout
                  </li>
                  <li aria-hidden="true">·</li>
                  <li>14-day returns</li>
                  <li aria-hidden="true">·</li>
                  <li>Free samples included</li>
                </ul>
              </section>

              {totalQty > 0 && (
                <section aria-label="Delivery and rewards" className="bg-white border border-[#e5e5ea] rounded-2xl p-5 sm:p-6 space-y-5">
                  {/* Shipping tiers */}
                  <div>
                    <div className="flex items-start gap-3">
                      <IconBadge><Truck size={15} /></IconBadge>
                      <p className="pt-1.5 text-[13px] leading-snug text-[#2a2a31]">
                        {!nextTier ? (
                          <><span className="font-semibold text-emerald-600">Free shipping unlocked</span> on this order</>
                        ) : (
                          <>
                            Add <span className="font-semibold">{nextTier.itemsNeeded} more {nextTier.itemsNeeded === 1 ? 'item' : 'items'}</span>
                            {nextTier.newCost === 0
                              ? <> for <span className="font-semibold text-emerald-600">free shipping</span></>
                              : <> to cut shipping to <span className="font-semibold">AED {nextTier.newCost}</span></>}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {SHIPPING_TIERS.map(tier => {
                        const reached = totalQty >= tier.minItems;
                        return (
                          <div key={tier.label}>
                            <div className="h-1.5 rounded-full transition-colors" style={{ background: reached ? GRADIENT : '#f1eef6' }} />
                            <p className={`mt-1.5 text-[11px] ${reached ? 'font-semibold text-[#2a2a31]' : 'text-[#a1a1aa]'}`}>
                              {tier.label} · {tier.cost === 0 ? 'Free' : `AED ${tier.cost}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Artisan gift */}
                  <div className="pt-5 border-t border-[#eeeef1] flex items-start gap-3">
                    <IconBadge><Gift size={15} /></IconBadge>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <p className="text-[13px] leading-snug text-[#2a2a31]">
                        {artisanGap <= 0 ? (
                          <>You&apos;ve unlocked a free <span className="font-semibold text-[#7c3aed]">{ARTISAN_GIFT_NAME}</span></>
                        ) : (
                          <><span className="font-semibold">{fmt(artisanGap)}</span> away from a free <span className="font-semibold text-[#7c3aed]">{ARTISAN_GIFT_NAME}</span></>
                        )}
                      </p>
                      {artisanGap > 0 && (
                        <div
                          role="progressbar"
                          aria-label={`Progress to ${ARTISAN_GIFT_NAME}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={artisanPct}
                          className="mt-2.5 h-1.5 rounded-full bg-[#f1eef6] overflow-hidden"
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: GRADIENT }}
                            initial={false}
                            animate={{ width: `${artisanPct}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loyalty — informational only; points are redeemed at checkout */}
                  <div className="pt-5 border-t border-[#eeeef1] flex items-start gap-3">
                    <IconBadge><Star size={15} /></IconBadge>
                    <div className="flex-1 min-w-0 pt-1.5 text-[13px] leading-snug text-[#2a2a31]">
                      {isAuthenticated ? (
                        <>
                          <p>
                            This order earns <span className="font-semibold">{pointsEarned.toLocaleString()} points</span>
                            <span className="text-[#8a8a93]">, credited on delivery</span>
                          </p>
                          {loyaltyPoints >= POINTS_BLOCK ? (
                            <p className="mt-1 text-[12px] text-[#5a5a64]">
                              You have {loyaltyPoints.toLocaleString()} points — worth{' '}
                              <span className="font-semibold text-[#7c3aed]">{fmt(redeemableAed)}</span> off. Redeem them at checkout.
                            </p>
                          ) : loyaltyPoints > 0 ? (
                            <p className="mt-1 text-[12px] text-[#5a5a64]">
                              You have {loyaltyPoints.toLocaleString()} points. Every {POINTS_BLOCK} points is worth AED {AED_PER_BLOCK} at checkout.
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p>
                          <Link href="/auth?callbackUrl=/cart" className="font-semibold text-[#7c3aed] underline underline-offset-2">
                            Sign in
                          </Link>{' '}
                          to earn {pointsEarned.toLocaleString()} points on this order
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </aside>

            {/* ── Advice & cross-sell (below the items on desktop, last on mobile) ── */}
            <div className="min-w-0 space-y-10">
              <AnimatePresence mode="wait" initial={false}>
                {aiAdvice ? (
                  <motion.div
                    key="advice"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-3 rounded-2xl border border-[#ece3fb] bg-[#faf7ff] p-4"
                  >
                    <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: GRADIENT }}>
                      <Sparkles size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#7c3aed]">Routine advice</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-[#2a2a31]">{aiAdvice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiAdvice(null)}
                      aria-label="Dismiss advice"
                      className={`shrink-0 w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center text-[#a1a1aa] hover:bg-white hover:text-[#5a5a64] transition-colors ${focusRing}`}
                    >
                      <X size={15} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="trigger"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleAiAdvice}
                    disabled={isAiLoading || visibleItems.length === 0}
                    className={`inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#e5e5ea] bg-white text-[13px] font-medium text-[#2a2a31] hover:border-[#c8c8cf] hover:bg-[#fafafb] disabled:opacity-50 transition-colors ${focusRing}`}
                  >
                    <Sparkles size={14} className={`text-[#9869f7] ${isAiLoading ? 'motion-safe:animate-pulse' : ''}`} />
                    {isAiLoading ? 'Building your routine advice…' : 'Get routine advice for your bag'}
                  </motion.button>
                )}
              </AnimatePresence>

              <PairItWithSection currentCartItems={cartItems} />
              <BuyAgainSection products={buyAgainRaw} cartItems={cartItems} />
            </div>
          </div>
        </main>

        {/* ── Mobile checkout bar ── */}
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e5ea] bg-white/95 backdrop-blur-md"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {hasStockIssues && (
            <p role="alert" className="px-4 pt-2 text-center text-[11.5px] font-medium text-red-600">
              Remove or update the highlighted items to continue.
            </p>
          )}
          <div className="mx-auto flex max-w-[640px] items-center gap-4 px-4 pt-3">
            <div className="min-w-0">
              <p className="text-[11px] leading-none text-[#8a8a93]">Total · VAT incl.</p>
              <p className="mt-1 text-[18px] font-bold leading-none tabular-nums text-[#111114]">{fmt(total)}</p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canCheckout}
              className="flex-1 h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-semibold text-white disabled:opacity-40 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#9869f7]"
              style={{ background: GRADIENT, boxShadow: '0 6px 20px rgba(152,105,247,.30)' }}
            >
              {checkoutLabel}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
