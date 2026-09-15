'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, Check, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import CartSuggestionCard from '../components/CartSuggestionCard';
import { orderedLabel } from '../components/BuyAgainSection';

const GRADIENT = 'linear-gradient(90deg,#c087fc,#9869f7)';
const STEP = 10;
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7]/40';
const gridClass = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';

const fmt = (n) =>
  `AED ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function FlowHeader({ onBack }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e5ea] bg-white">
      <div className="relative mx-auto flex h-[56px] max-w-[1180px] items-center justify-between px-4 sm:px-6 md:h-[60px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to bag"
          className={`group flex h-[38px] shrink-0 items-center gap-2 rounded-full border border-[#e5e5ea] bg-white px-3 text-[12px] font-semibold text-[#2a2a31] transition-colors hover:border-[#c8c8cf] hover:bg-[#f3f3f5] sm:px-4 ${focusRing}`}
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Back to bag</span>
        </button>

        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-md transition-opacity hover:opacity-75 active:opacity-60"
        >
          <BrandLogo priority />
        </Link>

        <div className="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium text-[#8a8a93] sm:flex">
          <ShieldCheck size={13} className="text-emerald-500" />
          Secure checkout
        </div>
        <div className="w-[38px] sm:hidden" aria-hidden="true" />
      </div>
    </header>
  );
}

function FlowSteps() {
  const steps = [
    { label: 'Bag', state: 'done', href: '/cart' },
    { label: 'Extras', state: 'current' },
    { label: 'Checkout', state: 'upcoming' },
  ];

  return (
    <ol aria-label="Checkout progress" className="flex items-center gap-2 text-[12px] font-medium">
      {steps.map((step, i) => {
        const dot = (
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              step.state === 'done'
                ? 'bg-[#f5f0fd] text-[#7c3aed]'
                : step.state === 'current'
                  ? 'text-white'
                  : 'border border-[#e5e5ea] text-[#a1a1aa]'
            }`}
            style={step.state === 'current' ? { background: GRADIENT } : undefined}
          >
            {step.state === 'done' ? <Check size={11} strokeWidth={3} /> : i + 1}
          </span>
        );
        const tone = step.state === 'upcoming' ? 'text-[#a1a1aa]' : 'text-[#2a2a31]';

        return (
          <li key={step.label} className="flex items-center gap-2">
            {step.href ? (
              <Link href={step.href} className={`flex items-center gap-1.5 rounded-full ${tone} hover:text-[#7c3aed] ${focusRing}`}>
                {dot}
                {step.label}
              </Link>
            ) : (
              <span aria-current={step.state === 'current' ? 'step' : undefined} className={`flex items-center gap-1.5 ${tone}`}>
                {dot}
                {step.label}
              </span>
            )}
            {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-[#e5e5ea] sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}

function GridSkeleton() {
  return (
    <div role="status" className="space-y-4 motion-safe:animate-pulse">
      <span className="sr-only">Loading suggestions</span>
      <div className="space-y-2">
        <div className="h-5 w-40 rounded bg-[#f1f1f4]" />
        <div className="h-3.5 w-28 rounded bg-[#f5f5f7]" />
      </div>
      <div className={gridClass}>
        {Array.from({ length: STEP }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[#eeeef1]">
            <div className="aspect-square bg-[#f5f5f7]" />
            <div className="space-y-2 p-3">
              <div className="h-2.5 w-1/2 rounded bg-[#f1f1f4]" />
              <div className="h-3 w-4/5 rounded bg-[#f1f1f4]" />
              <div className="h-9 rounded-full bg-[#f5f5f7]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtrasSection({ id, title, subtitle, action, products, cartIds, onAdd, getMeta }) {
  const [shown, setShown] = useState(STEP);
  const visible = products.slice(0, shown);
  const remaining = products.length - visible.length;

  return (
    <section aria-labelledby={`${id}-heading`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`${id}-heading`} className="text-[18px] font-semibold text-[#111114] sm:text-[20px]">{title}</h2>
          <p className="mt-0.5 text-[13px] text-[#8a8a93]">{subtitle}</p>
        </div>
        {action}
      </div>

      <ul className={gridClass}>
        {visible.map(product => (
          <li key={product.id}>
            <CartSuggestionCard
              product={product}
              inBag={cartIds.has(product.id)}
              onAdd={onAdd}
              meta={getMeta ? getMeta(product) : undefined}
            />
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShown(s => s + STEP)}
            className={`h-11 rounded-full border border-[#e5e5ea] bg-white px-6 text-[13px] font-semibold text-[#2a2a31] transition-colors hover:border-[#c8c8cf] hover:bg-[#fafafb] ${focusRing}`}
          >
            Show {Math.min(STEP, remaining)} more
          </button>
        </div>
      )}
    </section>
  );
}

export default function NeedAnythingElsePage() {
  const router = useRouter();
  const { cartItems, addToCart, closeCart, subtotal, isCartReady } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useAppContext();
  const userId = user?.id;

  const [buyAgainRaw, setBuyAgainRaw] = useState([]);
  const [buyAgainLoaded, setBuyAgainLoaded] = useState(false);
  // The bag as it was when this page became ready. Those products are hidden from the
  // suggestions; anything added here stays in place and flips to "In your bag".
  const [initialCartIds, setInitialCartIds] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !userId) {
      setBuyAgainLoaded(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${userId}/buy-again`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => { if (!cancelled) setBuyAgainRaw(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBuyAgainLoaded(true); });
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, userId]);

  useEffect(() => {
    if (isCartReady && initialCartIds === null) {
      setInitialCartIds(new Set(cartItems.map(i => i.id)));
    }
  }, [isCartReady, initialCartIds, cartItems]);

  const cartIds = useMemo(() => new Set(cartItems.map(i => i.id)), [cartItems]);

  const buyAgain = useMemo(
    () => (initialCartIds ? buyAgainRaw.filter(p => !initialCartIds.has(p.id)) : []),
    [buyAgainRaw, initialCartIds]
  );

  const suggestions = useMemo(() => {
    if (!initialCartIds) return [];
    const buyAgainIds = new Set(buyAgainRaw.map(p => p.id));
    return (products || [])
      .filter(p => !initialCartIds.has(p.id) && !buyAgainIds.has(p.id))
      // `image` is the placeholder-safe version of imageUrl set by processProductData
      .map(p => ({ ...p, imageUrl: p.image }))
      .sort((a, b) =>
        (Number(b.totalSold) || 0) - (Number(a.totalSold) || 0) ||
        (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0)
      )
      .slice(0, 30);
  }, [products, buyAgainRaw, initialCartIds]);

  const hasSalesData = suggestions.some(p => Number(p.totalSold) > 0);
  const ready = isCartReady && initialCartIds !== null && buyAgainLoaded && !productsLoading;
  const cartCount = cartItems.reduce((t, i) => t + i.quantity, 0);

  const handleAdd = (product) => {
    addToCart({ ...product, stock_quantity: product.stockQuantity ?? product.stock_quantity ?? 0 }, 1);
    closeCart(); // this page is already part of the bag flow — don't slide the drawer over it
  };

  const handleContinue = () => {
    router.push(isAuthenticated ? '/checkout' : '/auth?callbackUrl=/checkout');
  };

  const showBar = ready && cartItems.length > 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className={`min-h-screen bg-white ${showBar ? 'pb-32' : 'pb-16'}`}>
        <FlowHeader onBack={() => router.push('/cart')} />

        <main className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 sm:pt-10">
          <FlowSteps />

          <div className="mb-6 mt-4 sm:mb-8">
            <h1 className="text-[26px] font-semibold tracking-tight text-[#111114] sm:text-[32px]">Need anything else?</h1>
            <p className="mt-1 text-[14px] text-[#5a5a64]">
              Add a favourite before you check out — or skip straight to checkout.
            </p>
          </div>

          {!ready ? (
            <GridSkeleton />
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f0fd]">
                <ShoppingBag size={30} strokeWidth={1.5} className="text-[#9869f7]" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold text-[#111114]">Your bag is empty</h2>
                <p className="mt-1.5 text-[14px] text-[#5a5a64]">Add something to your bag before checking out.</p>
              </div>
              <Link
                href="/all-products"
                className={`inline-flex h-12 items-center gap-2 rounded-full px-8 text-[14px] font-semibold text-white transition-transform active:scale-[0.98] ${focusRing}`}
                style={{ background: GRADIENT }}
              >
                Explore the collection
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {buyAgain.length > 0 && (
                <ExtrasSection
                  id="buy-again"
                  title="Buy it again"
                  subtitle="From your past orders"
                  products={buyAgain}
                  cartIds={cartIds}
                  onAdd={handleAdd}
                  getMeta={p => orderedLabel(p.lastOrderedAt)}
                  action={
                    <Link
                      href="/account/orders"
                      className={`inline-flex h-11 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold text-[#7c3aed] transition-colors hover:bg-[#f5f0fd] lg:h-9 ${focusRing}`}
                    >
                      View orders
                    </Link>
                  }
                />
              )}

              {suggestions.length > 0 && (
                <ExtrasSection
                  id="best-sellers"
                  title={hasSalesData ? 'Best sellers' : 'More to explore'}
                  subtitle={hasSalesData ? 'The products our customers order most' : 'From our collection'}
                  products={suggestions}
                  cartIds={cartIds}
                  onAdd={handleAdd}
                />
              )}

              {buyAgain.length === 0 && suggestions.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f0fd]">
                    <Check size={22} strokeWidth={2} className="text-[#9869f7]" />
                  </div>
                  <h2 className="text-[18px] font-semibold text-[#111114]">You&apos;re all set</h2>
                  <p className="mt-1.5 text-[14px] text-[#5a5a64]">Continue to checkout whenever you&apos;re ready.</p>
                </div>
              )}
            </div>
          )}
        </main>

        {showBar && (
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e5ea] bg-white/95 backdrop-blur-md"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 pt-3 sm:px-6">
              <Link href="/cart" className={`min-w-0 rounded-lg ${focusRing}`}>
                <p className="text-[11px] leading-none text-[#8a8a93]">
                  Subtotal · {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </p>
                {/* Re-keyed on change so each add visibly updates the total */}
                <motion.p
                  key={subtotal}
                  initial={{ opacity: 0.35, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-1 text-[18px] font-bold leading-none tabular-nums text-[#111114]"
                >
                  {fmt(subtotal)}
                </motion.p>
              </Link>
              <button
                type="button"
                onClick={handleContinue}
                className="ml-auto flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7] focus-visible:ring-offset-2 sm:max-w-[320px]"
                style={{ background: GRADIENT, boxShadow: '0 6px 20px rgba(152,105,247,.30)' }}
              >
                {isAuthenticated ? 'Continue to checkout' : 'Sign in to checkout'}
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
