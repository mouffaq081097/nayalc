"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, ShoppingBag, Sparkles, X, Gift, Star, Trash2,
  Truck, Minus, Plus, Check,
} from 'lucide-react';
import { calcShipping, nextShippingTier, SHIPPING_TIERS, ARTISAN_GIFT_THRESHOLD, ARTISAN_GIFT_NAME, formatShipping, getPreorderInfo } from '@/lib/shipping';
import { orderableQty, preorderUnits, leadDays } from '@/lib/backorderRules';
import { vatFromGross } from '@/lib/vat';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PairItWithSection from '../components/PairItWithSection';
import BuyAgainSection from '../components/BuyAgainSection';
import TabbyPromo from '../components/TabbyPromo';
import { useSignIn } from '@/app/context/SignInContext';
import { useLocale, useT } from '@/app/context/LocaleContext';

// Storefront palette: ink actions, warm off-white panels, lavender only for small accents
const INK = '#111114';
const ACCENT = 'rgb(147,104,236)';
// Checkout action buttons: solid violet, 12px corners (one shape for every action in the flow)
const ACTION = '#5b35ec';

const UNDO_WINDOW_MS = 4000;

// Must match app/api/orders/route.js, which rejects orders whose total drifts
// from its own calculation: VAT is 5% of the pre-discount subtotal, and every
// 100 loyalty points redeem for AED 5.
const POINTS_BLOCK = 100;
const AED_PER_BLOCK = 5;

const fmt = (n) =>
  `AED ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114]/30';

// Same header as checkout (Shopify's): logo over the left column, "Continue
// shopping" over the right
function CartHeader({ onBack }) {
  const t = useT();
  return (
    <header className="border-b border-[#dedede] bg-white">
      <div className="flex h-[64px] items-center justify-between px-4 sm:px-6 md:h-[84px] lg:grid lg:grid-cols-2 lg:px-0">
        <div className="lg:ms-auto lg:w-full lg:max-w-[600px] lg:px-[38px]">
          <Link href="/" className="inline-flex items-center rounded-md transition-opacity hover:opacity-75 active:opacity-60">
            <BrandLogo priority />
          </Link>
        </div>
        <div className="lg:w-full lg:max-w-[500px] lg:px-[38px] lg:text-end">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex h-10 items-center gap-1.5 rounded-md text-[14px] text-[#111114] underline-offset-4 hover:underline ${focusRing}`}
          >
            <ArrowLeft size={15} className="flip-rtl" />
            <span className="hidden sm:inline">{t('Continue shopping')}</span>
            <span className="sm:hidden">{t('Shop')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function IconBadge({ children }) {
  return (
    <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#f5f5f5] text-[#111114]">
      {children}
    </span>
  );
}

function SummaryRow({ label, value, positive = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#111114]">{label}</dt>
      <dd className={`tabular-nums ${positive ? 'text-emerald-600' : 'text-[#111114]'}`}>{value}</dd>
    </div>
  );
}

const stepBtn = `w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center rounded-full text-[#2a2a31] hover:bg-[#f3f3f5] disabled:opacity-30 disabled:hover:bg-transparent transition-colors ${focusRing}`;

function CartItemRow({ item, onQuantity, onRemove }) {
  const { t, date } = useLocale();
  // Shelf stock plus what may still be pre-ordered (lib/backorderRules.js)
  const maxQty = orderableQty(item);
  const outOfStock = maxQty === 0;
  const overStock = !outOfStock && item.quantity > maxQty;
  const atStockLimit = item.quantity >= maxQty;
  const preorderQty = outOfStock ? 0 : preorderUnits(item, Math.min(item.quantity, maxQty));
  const onSale = item.originalPrice > item.price;
  const productHref = `/product/${item.id}`;

  return (
    <div className={`flex gap-4 sm:gap-6 py-5 sm:py-6 ${outOfStock ? 'bg-red-50/50' : ''}`}>
      <Link
        href={productHref}
        className={`shrink-0 w-[92px] h-[110px] sm:w-[120px] sm:h-[144px] bg-[#f6f5f2] overflow-hidden p-2.5 ${focusRing}`}
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
            <p className="text-[11px] sm:text-[12px] text-[#8a8a93] truncate">
              {item.brand || 'Naya Lumière'}
            </p>
            <Link
              href={productHref}
              className="mt-0.5 block text-[15px] sm:text-[16px] font-medium leading-snug text-[#111114] line-clamp-2 hover:underline underline-offset-2"
            >
              <bdi>{item.name}</bdi>
            </Link>
            {(item.size || item.shade) && (
              <p className="mt-0.5 text-[12px] text-[#8a8a93]"><bdi>{[item.size, item.shade].filter(Boolean).join(' · ')}</bdi></p>
            )}
          </div>

          <div className="shrink-0 text-end">
            <p className="text-[14px] sm:text-[16px] font-semibold text-[#111114] tabular-nums">{fmt(item.price * item.quantity)}</p>
            {onSale && (
              <p className="text-[11.5px] text-[#a1a1aa] line-through tabular-nums">{fmt(item.originalPrice * item.quantity)}</p>
            )}
            {item.quantity > 1 && (
              <p className="text-[11px] text-[#8a8a93] tabular-nums">{t('{price} each', { price: fmt(item.price) })}</p>
            )}
          </div>
        </div>

        {outOfStock && (
          <p className="mt-2 self-start rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            {t('Out of stock — remove to continue')}
          </p>
        )}
        {overStock && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            <span className="font-semibold text-amber-700">{t('Only {n} left', { n: maxQty })}</span>
            <button
              type="button"
              onClick={() => onQuantity(item.id, maxQty)}
              className="font-semibold text-[#111114] underline underline-offset-2"
            >
              {t('Update to {n}', { n: maxQty })}
            </button>
          </div>
        )}
        {preorderQty > 0 && (
          <p className="mt-2 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: ACCENT }}>
            {preorderQty === item.quantity ? t('Pre-order') : t('{n} of {total} on pre-order', { n: preorderQty, total: item.quantity })} · {t('ships by {date}', { date: date(getPreorderInfo(leadDays(item)).shipByLabel) })}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div
            role="group"
            aria-label={t('Quantity of {name}', { name: item.name })}
            className="flex items-center rounded-full border border-[#d9d9de] bg-white"
          >
            <button
              type="button"
              onClick={() => (item.quantity <= 1 ? onRemove(item.id) : onQuantity(item.id, item.quantity - 1))}
              aria-label={item.quantity <= 1 ? t('Remove {name} from bag', { name: item.name }) : t('Decrease quantity of {name}', { name: item.name })}
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
              aria-label={t('Increase quantity of {name}', { name: item.name })}
              className={stepBtn}
            >
              <Plus size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className={`h-11 px-2 -me-2 inline-flex items-center gap-1.5 rounded-full text-[13px] font-medium text-[#8a8a93] hover:text-red-600 transition-colors ${focusRing}`}
          >
            <Trash2 size={14} />
            {t('Remove')}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemovedRow({ item, onUndo }) {
  const { t, rich } = useLocale();
  return (
    <div role="status" className="relative flex items-center justify-between gap-3 px-4 py-3 bg-[#f6f5f2]">
      <p className="min-w-0 truncate text-[13px] text-[#5a5a64]">
        {rich('Removed {name}', { name: <bdi className="font-semibold text-[#111114]">{item.name}</bdi> })}
      </p>
      <button
        type="button"
        onClick={() => onUndo(item.id)}
        className={`shrink-0 h-11 px-4 rounded-full text-[13px] font-semibold text-[#111114] underline underline-offset-4 hover:opacity-70 transition-opacity ${focusRing}`}
      >
        {t('Undo')}
      </button>
      <motion.span
        aria-hidden="true"
        className="absolute start-0 bottom-0 h-0.5 w-full origin-left rtl:origin-right"
        style={{ background: INK }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: UNDO_WINDOW_MS / 1000, ease: 'linear' }}
      />
    </div>
  );
}

export default function CartPage() {
  const { openSignIn } = useSignIn();
  const { t, rich, locale } = useLocale();
  const {
    cartItems, removeFromCart, updateQuantity,
    appliedCoupon, discountAmount, applyCoupon, removeCoupon, couponError,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
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
  // VAT-inclusive prices: extracted from the total, never added to it.
  const total = Math.max(0, subtotal - discountAmount + shipping);
  const vat = vatFromGross(total);
  const totalSavings = itemSavings + discountAmount;
  const hasStockIssues = visibleItems.some(i => orderableQty(i) === 0 || i.quantity > orderableQty(i));
  const canCheckout = visibleItems.length > 0 && !hasStockIssues;

  const artisanPct = Math.min(100, Math.round((subtotal / ARTISAN_GIFT_THRESHOLD) * 100));
  const artisanGap = Math.max(0, ARTISAN_GIFT_THRESHOLD - subtotal);
  const redeemableAed = Math.floor(loyaltyPoints / POINTS_BLOCK) * AED_PER_BLOCK;
  const pointsEarned = Math.floor(subtotal);
  const checkoutLabel = t('Checkout');
  const itemsLabel = t(totalQty === 1 ? '{n} item' : '{n} items', { n: totalQty });

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/all-products');
  };

  const handleCheckout = () => {
    if (!canCheckout) return;
    flushPendingRemovals();
    // Signed out goes straight in too: checkout takes an email (guest checkout) or offers sign-in
    router.push('/checkout');
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
      setAiAdvice(d.advice || t('Sorry, we couldn’t put advice together just now.'));
    } catch {
      setAiAdvice(t('Sorry, we couldn’t put advice together just now.'));
    } finally {
      setIsAiLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <CartHeader onBack={handleBack} />
        <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#f6f5f2]">
            <ShoppingBag size={30} strokeWidth={1.3} className="text-[#111114]" />
          </div>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-semibold text-[#111114]">{t('Your bag is empty')}</h1>
            <p className="mt-1.5 max-w-xs text-[14px] text-[#5a5a64]">
              {t('Find something you love — shipping is free from 3 items.')}
            </p>
          </div>
          <Link
            href="/all-products"
            className={`inline-flex items-center gap-2 h-12 px-8 rounded-xl text-[14px] font-semibold text-white transition-transform active:scale-[0.98] ${focusRing}`}
            style={{ background: ACTION }}
          >
            {t('Explore the collection')}
            <ArrowRight size={15} className="flip-rtl" />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white pb-32 lg:pb-0">
        <CartHeader onBack={handleBack} />

        {/* Checkout's split (Shopify's): items on white, right-aligned in the left half; the
            summary on grey filling the right half. On phones: items, summary, then suggestions. */}
        <main className="lg:grid lg:min-h-[calc(100vh-85px)] lg:grid-cols-2 lg:grid-rows-[auto_1fr]">

            {/* ── Items ── */}
            <section aria-labelledby="bag-heading" className="mx-auto min-w-0 max-w-[600px] px-4 pt-6 pb-8 sm:px-6 lg:col-start-1 lg:row-start-1 lg:mx-0 lg:ms-auto lg:w-full lg:px-[38px] lg:pt-[38px] lg:pb-6">
              <h1 id="bag-heading" className="mb-4 text-[22px] sm:text-[24px] font-semibold text-[#111114]">
                {t('Your bag')} <span className="text-[15px] font-normal text-[#707070]">· {itemsLabel}</span>
              </h1>
              <ul className="border-y border-[#dedede] divide-y divide-[#ececec]">
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

            {/* ── Summary: the grey right half, as on checkout ── */}
            <aside className="min-w-0 border-y border-[#dedede] bg-[#f5f5f5] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-y-0 lg:border-s">
              <div className="mx-auto max-w-[600px] space-y-6 px-4 py-8 sm:px-6 lg:sticky lg:top-0 lg:mx-0 lg:max-w-[500px] lg:px-[38px] lg:py-[38px]">
              <section aria-labelledby="summary-heading">
                <h2 id="summary-heading" className="text-[17px] font-semibold text-[#111114]">{t('Order summary')}</h2>

                <dl className="mt-4 space-y-2 text-[14px]">
                  <SummaryRow label={`${t('Subtotal')} (${itemsLabel})`} value={fmt(subtotal)} />
                  {discountAmount > 0 && (
                    <SummaryRow
                      label={`${t('Promo')}${appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}`}
                      value={<bdi>−{fmt(discountAmount)}</bdi>}
                      positive
                    />
                  )}
                  <SummaryRow label={t('Shipping')} value={shipping === 0 ? t('Free') : fmt(shipping)} positive={shipping === 0} />
                </dl>

                {/* Discount code: always open, as on checkout */}
                <div className="mt-5">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2">
                      <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-emerald-700">
                        <Check size={14} className="shrink-0" />
                        <span className="truncate">{t('{code} applied', { code: appliedCoupon.code })}</span>
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className={`shrink-0 h-9 px-2 rounded-full text-[12px] font-semibold text-[#111114] underline underline-offset-4 ${focusRing}`}
                      >
                        {t('Remove')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <form onSubmit={e => { e.preventDefault(); handleApplyCoupon(); }} className="flex gap-2">
                        <label htmlFor="promo-code" className="sr-only">{t('Discount code')}</label>
                        <input
                          id="promo-code"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value); if (couponError) removeCoupon(); }}
                          placeholder={t('Discount code')}
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          enterKeyHint="done"
                          aria-invalid={!!couponError}
                          aria-describedby={couponError ? 'promo-error' : undefined}
                          className="h-[52px] min-w-0 flex-1 rounded-xl border border-[#dedede] bg-white px-4 text-[16px] text-[#111114] placeholder:text-[#707070] focus:border-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114] lg:text-[14px]"
                        />
                        <button
                          type="submit"
                          disabled={!couponCode.trim() || isApplyingCoupon}
                          className="inline-flex h-[52px] min-w-[84px] items-center justify-center rounded-xl border border-[#dedede] bg-[#111114] px-5 text-[14px] font-semibold text-white transition-colors disabled:bg-[#ebebeb] disabled:text-[#707070]"
                        >
                          {isApplyingCoupon
                            ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-label={t('Applying')} />
                            : t('Apply')}
                        </button>
                      </form>
                      {couponError && (
                        <p id="promo-error" role="alert" className="mt-2 text-[12px] font-medium text-red-600">{t(couponError)}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Total */}
                <div className="mt-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-[19px] font-semibold text-[#111114]">{t('Total')}</span>
                      <p className="text-[12.5px] text-[#707070]">{t('Including {vat} in VAT', { vat: fmt(vat) })}</p>
                    </div>
                    <span className="flex items-baseline gap-2">
                      <span className="text-[12px] text-[#707070]">AED</span>
                      <span className="text-[22px] font-semibold tabular-nums text-[#111114]">
                        {Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                  {totalSavings > 0 && (
                    <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700">
                      {t('You’re saving {amount} on this order', { amount: fmt(totalSavings) })}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="hidden lg:flex mt-5 w-full h-[52px] rounded-xl items-center justify-center gap-2.5 text-[15px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#111114]"
                  style={{ background: ACTION }}
                >
                  {checkoutLabel}
                  <ArrowRight size={17} className="flip-rtl" />
                </button>
                {hasStockIssues && (
                  <p role="alert" className="hidden lg:block mt-2.5 text-center text-[12px] font-medium text-red-600">
                    {t('Remove or update the highlighted items to continue.')}
                  </p>
                )}

                {/* TabbyPromo renders an empty div when unconfigured — collapse the gap then */}
                <div className="mt-4 has-[>div:empty]:hidden">
                  <TabbyPromo price={total} source="cart" lang={locale} />
                </div>

              </section>

              {totalQty > 0 && (
                <section aria-label={t('Delivery and rewards')} className="rounded-xl border border-[#dedede] bg-white p-5 space-y-5">
                  {/* Shipping tiers */}
                  <div>
                    <div className="flex items-start gap-3">
                      <IconBadge><Truck size={15} /></IconBadge>
                      <p className="pt-1.5 text-[13px] leading-snug text-[#2a2a31]">
                        {!nextTier ? (
                          rich('{unlocked} on this order', { unlocked: <span className="font-semibold text-emerald-600">{t('Free shipping unlocked')}</span> })
                        ) : (() => {
                          const more = <span className="font-semibold">{t(nextTier.itemsNeeded === 1 ? '{n} more item' : '{n} more items', { n: nextTier.itemsNeeded })}</span>;
                          return nextTier.newCost === 0
                            ? rich('Add {more} for {free}', { more, free: <span className="font-semibold text-emerald-600">{t('free shipping')}</span> })
                            : rich('Add {more} to cut shipping to {cost}', { more, cost: <span className="font-semibold">AED {nextTier.newCost}</span> });
                        })()}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {SHIPPING_TIERS.map(tier => {
                        const reached = totalQty >= tier.minItems;
                        return (
                          <div key={tier.label}>
                            <div className="h-1.5 rounded-full transition-colors" style={{ background: reached ? INK : '#e2e0db' }} />
                            <p className={`mt-1.5 text-[11px] ${reached ? 'font-semibold text-[#2a2a31]' : 'text-[#a1a1aa]'}`}>
                              {t(tier.label)} · {t(formatShipping(tier.cost))}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Artisan gift */}
                  <div className="pt-5 border-t border-[#e2e0db] flex items-start gap-3">
                    <IconBadge><Gift size={15} /></IconBadge>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <p className="text-[13px] leading-snug text-[#2a2a31]">
                        {artisanGap <= 0
                          ? rich('You’ve unlocked a free {gift}', { gift: <span className="font-semibold text-[#111114]">{t(ARTISAN_GIFT_NAME)}</span> })
                          : rich('{amount} away from a free {gift}', {
                            amount: <span className="font-semibold">{fmt(artisanGap)}</span>,
                            gift: <span className="font-semibold text-[#111114]">{t(ARTISAN_GIFT_NAME)}</span>,
                          })}
                      </p>
                      {artisanGap > 0 && (
                        <div
                          role="progressbar"
                          aria-label={t('Progress to {gift}', { gift: t(ARTISAN_GIFT_NAME) })}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={artisanPct}
                          className="mt-2.5 h-1.5 rounded-full bg-[#e2e0db] overflow-hidden"
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: ACCENT }}
                            initial={false}
                            animate={{ width: `${artisanPct}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loyalty — informational only; points are redeemed at checkout */}
                  <div className="pt-5 border-t border-[#e2e0db] flex items-start gap-3">
                    <IconBadge><Star size={15} /></IconBadge>
                    <div className="flex-1 min-w-0 pt-1.5 text-[13px] leading-snug text-[#2a2a31]">
                      {isAuthenticated ? (
                        <>
                          <p>
                            {rich('This order earns {points}', { points: <span className="font-semibold">{t('{n} points', { n: pointsEarned.toLocaleString('en-US') })}</span> })}
                            <span className="text-[#8a8a93]">{t(', credited on delivery')}</span>
                          </p>
                          {loyaltyPoints >= POINTS_BLOCK ? (
                            <p className="mt-1 text-[12px] text-[#5a5a64]">
                              {rich('You have {points} — worth {amount} off. Redeem them at checkout.', {
                                points: t('{n} points', { n: loyaltyPoints.toLocaleString('en-US') }),
                                amount: <span className="font-semibold text-[#111114]">{fmt(redeemableAed)}</span>,
                              })}
                            </p>
                          ) : loyaltyPoints > 0 ? (
                            <p className="mt-1 text-[12px] text-[#5a5a64]">
                              {t('You have {points}. Every {block} points is worth AED {aed} at checkout.', {
                                points: t('{n} points', { n: loyaltyPoints.toLocaleString('en-US') }),
                                block: POINTS_BLOCK,
                                aed: AED_PER_BLOCK,
                              })}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p>
                          {rich('{signIn} to earn {points} on this order', {
                            signIn: (
                              <Link href="/auth?callbackUrl=/cart" onClick={(e) => { e.preventDefault(); openSignIn(); }} className="font-semibold text-[#111114] underline underline-offset-2">
                                {t('Sign in')}
                              </Link>
                            ),
                            points: t('{n} points', { n: pointsEarned.toLocaleString('en-US') }),
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}
              </div>
            </aside>

            {/* ── Advice & cross-sell (under the items on desktop, after the summary on phones) ── */}
            <div className="mx-auto min-w-0 max-w-[600px] space-y-4 px-4 py-8 sm:px-6 lg:col-start-1 lg:row-start-2 lg:mx-0 lg:ms-auto lg:w-full lg:px-[38px] lg:pt-4 lg:pb-[38px]">
              <AnimatePresence mode="wait" initial={false}>
                {aiAdvice ? (
                  <motion.div
                    key="advice"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-3 rounded-xl bg-[#f6f5f2] p-4"
                  >
                    <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: ACCENT }}>
                      <Sparkles size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#111114]">{t('Routine advice')}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-[#2a2a31]">{aiAdvice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiAdvice(null)}
                      aria-label={t('Dismiss advice')}
                      className={`shrink-0 w-9 h-9 -mt-1 -me-1 rounded-full flex items-center justify-center text-[#a1a1aa] hover:bg-white hover:text-[#5a5a64] transition-colors ${focusRing}`}
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
                    <Sparkles size={14} style={{ color: ACCENT }} className={isAiLoading ? 'motion-safe:animate-pulse' : ''} />
                    {isAiLoading ? t('Building your routine advice…') : t('Get routine advice for your bag')}
                  </motion.button>
                )}
              </AnimatePresence>

              <PairItWithSection currentCartItems={cartItems} />
              <BuyAgainSection products={buyAgainRaw} cartItems={cartItems} />
            </div>
        </main>

        {/* ── Mobile checkout bar ── */}
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#ececec] bg-white"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {hasStockIssues && (
            <p role="alert" className="px-4 pt-2 text-center text-[11.5px] font-medium text-red-600">
              {t('Remove or update the highlighted items to continue.')}
            </p>
          )}
          <div className="mx-auto flex max-w-[640px] items-center gap-4 px-4 pt-3">
            <div className="min-w-0">
              <p className="text-[11px] leading-none text-[#8a8a93]">{t('Total · VAT incl.')}</p>
              <p className="mt-1 text-[18px] font-bold leading-none tabular-nums text-[#111114]">{fmt(total)}</p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canCheckout}
              className="flex-1 h-[52px] rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold text-white disabled:opacity-40 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#111114]"
              style={{ background: ACTION }}
            >
              {checkoutLabel}
              <ArrowRight size={17} className="flip-rtl" />
            </button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
