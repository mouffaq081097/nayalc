"use client";
import { useState, useEffect } from 'react';
import { ArrowRight, Plus, Minus, ShoppingBag, Truck, Sparkles, X } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PairItWithSection from '../components/PairItWithSection';
import BuyAgainSection from '../components/BuyAgainSection';
import TabbyPromo from '../components/TabbyPromo';
import { motion, AnimatePresence } from 'framer-motion';

/* ── sidebar card wrapper — defined outside to prevent focus loss on re-render ── */
const SCard = ({ children, className = '' }) => (
  <div className={`bg-white border border-[#e5e5ea] rounded-2xl ${className}`}>{children}</div>
);

export default function CartPage() {
  const {
    cartItems, removeFromCart, updateQuantity,
    subtotal, appliedCoupon, discountAmount, finalTotal,
    applyCoupon, removeCoupon, couponError,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [couponCode,       setCouponCode]       = useState('');
  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [loyaltyPoints,    setLoyaltyPoints]    = useState(0);
  const [pointsToUse,      setPointsToUse]      = useState(0);
  const [isAiLoading,      setIsAiLoading]      = useState(false);
  const [aiAdvice,         setAiAdvice]         = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch(`/api/users/${user.id}/buy-again`)
        .then(r => r.ok ? r.json() : [])
        .then(d => Array.isArray(d) && setBuyAgainProducts(d.filter(p => !cartItems.some(c => c.id === p.id))))
        .catch(err => console.error('Buy-again fetch failed:', err));
      fetch(`/api/users/${user.id}/loyalty`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.stats) setLoyaltyPoints(d.stats.points || 0); })
        .catch(() => {});
    }
  }, [isAuthenticated, user, cartItems]);

  const handleAiAdvice = async () => {
    if (!cartItems.length) return;
    setIsAiLoading(true); setAiAdvice(null);
    try {
      const res = await fetch('/api/ai/cart-advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartItems }) });
      const d = await res.json();
      setAiAdvice(d.advice || "I'm sorry, I couldn't generate advice at this moment.");
    } catch { setAiAdvice("I'm sorry, I couldn't generate advice at this moment."); }
    finally { setIsAiLoading(false); }
  };

  const FREE_SHIPPING = 200;
  const SHIP_COST     = 30;
  const shipping      = subtotal >= FREE_SHIPPING ? 0 : SHIP_COST;
  // Max redeemable: 1 point = 1 AED, capped at subtotal
  const maxPoints     = Math.min(loyaltyPoints, Math.floor(subtotal));
  const pointsDiscount = Math.min(pointsToUse, maxPoints);
  const total         = Math.max(0, finalTotal + shipping - pointsDiscount);
  const hasStockIssues = cartItems.some(i => i.stock_quantity === 0 || i.quantity > i.stock_quantity);

  const handleCheckout = () => {
    if (!isAuthenticated) { router.push('/auth?callbackUrl=/checkout'); return; }
    router.push('/need-anything-else');
  };

  if (cartItems.length === 0) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5 px-5">
      <div className="w-16 h-16 rounded-2xl bg-[#f3f3f5] border border-[#e5e5ea] flex items-center justify-center">
        <ShoppingBag size={24} strokeWidth={1.5} className="text-[#8a8a93]" />
      </div>
      <div className="text-center">
        <h2 className="text-[22px] font-semibold text-[#111114] mb-1">Your bag is empty</h2>
        <p className="text-[14px] text-[#5a5a64]">Discover our latest collections.</p>
      </div>
      <button
        onClick={() => router.push('/all-products')}
        className="h-12 px-8 rounded-full text-[13px] font-semibold uppercase tracking-[0.1em] text-white"
        style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
      >
        Explore Collection
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-28">

      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#e5e5ea]">
        <div className="max-w-[1180px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[13px] font-medium text-[#5a5a64] hover:text-[#111114] transition-colors group"
          >
            <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Continue Shopping
          </button>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-[#111114]">Your Bag</p>
            <p className="text-[11px] text-[#8a8a93] mt-0.5">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} {cartItems.reduce((s,i)=>s+i.quantity,0)===1?'item':'items'}
            </p>
          </div>
          <div className="w-[130px] hidden sm:block" />
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-6 pt-10 pb-16">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold tracking-tight text-[#111114]">Your Bag</h1>
          <p className="text-[14px] text-[#5a5a64] mt-1">
            {cartItems.reduce((s, i) => s + i.quantity, 0)} {cartItems.reduce((s,i)=>s+i.quantity,0)===1?'item':'items'} · Free shipping on orders over AED {FREE_SHIPPING}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ── LEFT: items + cross-sell ── */}
          <div>
            {/* AI advice banner */}
            <AnimatePresence>
              {aiAdvice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex gap-3 items-start p-4 rounded-xl bg-[#f9f9fb] border border-[#e5e5ea]">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}>
                      <Sparkles size={12} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-widest mb-1">AI Routine Advice</p>
                      <p className="text-[13px] text-[#2a2a31] leading-relaxed">{aiAdvice}</p>
                    </div>
                    <button onClick={() => setAiAdvice(null)} className="text-[#c8c8cf] hover:text-[#5a5a64] transition-colors shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cart item rows */}
            <div className="border border-[#e5e5ea] rounded-2xl overflow-hidden bg-white">
              {cartItems.map((item, i) => (
                <motion.div
                  layout
                  key={item.id}
                  className={`flex gap-5 px-6 py-5 ${i < cartItems.length - 1 ? 'border-b border-[#e5e5ea]' : ''}`}
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => router.push(`/product/${item.id}`)}
                    className="w-[88px] h-[88px] rounded-xl bg-[#f9f9fb] border border-[#e5e5ea] flex-shrink-0 overflow-hidden p-2 cursor-pointer"
                  >
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {/* Brand + name */}
                    <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-[0.12em] mb-0.5">
                      {item.brand || 'Naya Lumière'}
                    </p>
                    <h3
                      className="text-[15px] font-semibold text-[#111114] leading-snug cursor-pointer hover:underline underline-offset-2"
                      onClick={() => router.push(`/product/${item.id}`)}
                    >
                      {item.name}
                    </h3>

                    {/* Variant chips */}
                    {(item.size || item.shade) && (
                      <p className="text-[12px] text-[#8a8a93] mt-0.5">
                        {[item.size, item.shade].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {/* Stock warnings */}
                    {item.stock_quantity === 0 && (
                      <p className="text-[11px] font-medium text-red-500 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                        Out of stock
                      </p>
                    )}
                    {item.stock_quantity > 0 && item.quantity > item.stock_quantity && (
                      <p className="text-[11px] font-medium text-amber-600 mt-1">Only {item.stock_quantity} left</p>
                    )}

                    {/* Bottom row: qty · remove · price */}
                    <div className="flex items-center gap-4 mt-4">
                      {/* Qty stepper */}
                      <div className="flex items-center border border-[#e5e5ea] rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors disabled:opacity-30 text-[16px] font-light"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-[13px] font-semibold text-[#111114] tabular-nums select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity}
                          className="w-8 h-8 flex items-center justify-center text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors disabled:opacity-30 text-[16px] font-light"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove link */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[13px] text-[#8a8a93] underline underline-offset-2 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>

                      {/* Price — pushed right */}
                      <div className="ml-auto text-right">
                        <p className="text-[16px] font-semibold text-[#111114] tabular-nums">
                          AED {(item.price * item.quantity).toFixed(0)}
                        </p>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <p className="text-[12px] text-[#c8c8cf] line-through tabular-nums">
                            AED {(item.originalPrice * item.quantity).toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* AI advice trigger */}
            {!aiAdvice && (
              <button
                onClick={handleAiAdvice}
                disabled={isAiLoading}
                className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-[#8a8a93] hover:text-[#5a5a64] transition-colors disabled:opacity-50"
              >
                <Sparkles size={12} strokeWidth={2} className={isAiLoading ? 'animate-spin' : ''} />
                {isAiLoading ? 'Getting AI advice…' : 'Get AI routine advice'}
              </button>
            )}

            {/* Frequently bought together */}
            <div className="mt-10">
              <PairItWithSection currentCartItems={cartItems} />
            </div>

            {/* Buy again */}
            {buyAgainProducts.length > 0 && (
              <div className="mt-8">
                <BuyAgainSection products={buyAgainProducts} />
              </div>
            )}
          </div>

          {/* ── RIGHT: sidebar ── */}
          <div className="space-y-3 lg:sticky lg:top-6">

            {/* Order Summary */}
            <SCard className="p-5">
              <h3 className="text-[16px] font-semibold text-[#111114] mb-4">Order Summary</h3>
              <div className="space-y-3 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#5a5a64]">Subtotal</span>
                  <span className="font-semibold text-[#111114]">AED {subtotal.toFixed(0)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Discount</span>
                    <span>−AED {discountAmount.toFixed(0)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Points</span>
                    <span>−AED {pointsDiscount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#5a5a64]">Shipping</span>
                  <span className={shipping === 0 ? 'font-semibold text-green-600' : 'font-semibold text-[#111114]'}>
                    {shipping === 0 ? 'Free' : `AED ${shipping.toFixed(0)}`}
                  </span>
                </div>
              </div>

              {/* Shipping progress — only when not free */}
              {shipping > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8a8a93]">Add AED {(FREE_SHIPPING - subtotal).toFixed(0)} for free shipping</span>
                    <span className="font-semibold text-[#111114]">{Math.round((subtotal / FREE_SHIPPING) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f3f3f5] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%` }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#e5e5ea] flex justify-between items-baseline">
                <span className="text-[16px] font-semibold text-[#111114]">Total</span>
                <span className="text-[20px] font-bold text-[#111114] tabular-nums">AED {total.toFixed(0)}</span>
              </div>
            </SCard>

            {/* Promo Code */}
            <SCard className="p-5">
              <h3 className="text-[15px] font-semibold text-[#111114] mb-3">Promo Code</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between text-[13px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <span>✓ {appliedCoupon.code} applied</span>
                  <button onClick={removeCoupon} className="text-green-600 hover:underline text-[12px]">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && couponCode.trim() && applyCoupon(couponCode.trim())}
                    placeholder="Enter code"
                    className="flex-1 h-11 px-3.5 rounded-xl border border-[#e5e5ea] bg-white text-[14px] text-[#111114] placeholder:text-[#c8c8cf] focus:outline-none focus:border-[#9869f7] focus:ring-2 focus:ring-[#9869f7]/15"
                  />
                  <button
                    onClick={() => couponCode.trim() && applyCoupon(couponCode.trim())}
                    disabled={!couponCode.trim()}
                    className="h-11 px-5 rounded-xl text-[13px] font-semibold tracking-[0.08em] uppercase text-white disabled:opacity-40 transition-opacity"
                    style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-[11px] font-medium text-red-500 mt-2">{couponError}</p>}
            </SCard>

            {/* Loyalty Points */}
            {isAuthenticated && loyaltyPoints > 0 && (
              <SCard className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[15px] font-semibold text-[#111114]">Loyalty Points</h3>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(152,105,247,0.1)', color: '#9869f7' }}
                  >
                    {loyaltyPoints.toLocaleString()} pts available
                  </span>
                </div>
                <p className="text-[12px] text-[#8a8a93] mb-3">
                  1 point = 1 AED · Use up to {maxPoints} pts on this order
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxPoints}
                    value={pointsToUse}
                    onChange={e => setPointsToUse(Math.min(maxPoints, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="flex-1 h-11 px-3.5 rounded-xl border border-[#e5e5ea] bg-white text-[14px] text-[#111114] focus:outline-none focus:border-[#9869f7] focus:ring-2 focus:ring-[#9869f7]/15 tabular-nums"
                  />
                  <button
                    onClick={() => setPointsToUse(maxPoints)}
                    className="h-11 px-4 rounded-xl text-[13px] font-semibold text-[#5a5a64] border border-[#e5e5ea] hover:bg-[#f3f3f5] transition-colors whitespace-nowrap"
                  >
                    Use Max
                  </button>
                </div>
              </SCard>
            )}

            {/* Tabby */}
            <SCard className="p-5">
              <TabbyPromo price={total} source="cart" />
            </SCard>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckout}
              disabled={hasStockIssues}
              className="w-full h-14 rounded-full flex items-center justify-center gap-2.5 text-[14px] font-semibold tracking-[0.12em] uppercase text-white disabled:opacity-40 transition-opacity active:scale-[.98]"
              style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)', boxShadow: '0 4px 20px rgba(152,105,247,.30)' }}
            >
              Checkout
              <ArrowRight size={16} strokeWidth={2} />
            </button>

            {/* Trust line */}
            <p className="text-center text-[11px] text-[#8a8a93]">
              Secure checkout · 14-day returns · Free samples included
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
