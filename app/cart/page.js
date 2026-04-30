"use client";
import { useState, useEffect } from 'react';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Minus, X, ShoppingBag, ShieldCheck, Truck, RotateCcw, Tag, Sparkles, Star } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import BuyAgainSection from '../components/BuyAgainSection';
import TabbyPromo from '../components/TabbyPromo';
import PairItWithSection from '../components/PairItWithSection';
import { motion, AnimatePresence } from 'framer-motion';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 24px rgba(147,51,234,0.07)',
};

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, appliedCoupon, discountAmount, finalTotal, applyCoupon, removeCoupon, couponError } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const router = useRouter();

  const handleAiAdvice = async () => {
    if (cartItems.length === 0) return;
    setIsAiLoading(true);
    setAiAdvice(null);
    try {
      const res = await fetch('/api/ai/cart-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems })
      });
      const data = await res.json();
      if (data.advice) {
        setAiAdvice(data.advice);
      } else {
        console.error('AI Advice Error Response:', data);
        setAiAdvice("I'm sorry, I couldn't generate advice at this moment.");
      }
    } catch (err) {
      console.error('AI Advice Fetch Error:', err);
      setAiAdvice("I'm sorry, I couldn't generate advice at this moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch(`/api/users/${user.id}/buy-again`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setBuyAgainProducts(data.filter(p => !cartItems.some(c => c.id === p.id))))
        .catch(() => setBuyAgainProducts([]));

      fetch(`/api/users/${user.id}/loyalty`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.stats) {
            setLoyaltyPoints(data.stats.points || 0);
          }
        })
        .catch(() => setLoyaltyPoints(0));
    } else {
      setBuyAgainProducts([]);
      setLoyaltyPoints(0);
    }
  }, [isAuthenticated, user, cartItems]);

  const FREE_SHIPPING = 200;
  const SHIP_COST = 30;
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIP_COST;
  const total = finalTotal + shipping;
  const hasStockIssues = cartItems.some(item => item.stock_quantity === 0 || item.quantity > item.stock_quantity);

  return (
    <div className="min-h-screen pb-28" style={{ background: '#fdf8ff' }}>
      {/* Background auras */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ background: 'rgba(196,167,254,0.18)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: 'rgba(216,180,254,0.12)' }} />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl" style={{ background: 'rgba(253,248,255,0.85)', borderBottom: '1px solid rgba(216,180,254,0.25)' }}>
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[13px] font-semibold transition-all group"
            style={{ color: 'rgba(59,7,100,0.55)' }}
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Continue Shopping
          </button>
          <div className="text-center">
            <h1 className="text-[16px] font-bold tracking-tight" style={{ color: '#3b0764' }}>Your Selection</h1>
            <p className="text-[11px] font-medium" style={{ color: 'rgba(59,7,100,0.45)' }}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="w-[120px] hidden sm:block" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-10 relative z-10">
        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-28 flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-lg" style={{ background: 'rgba(196,167,254,0.18)', border: '1px solid rgba(216,180,254,0.35)' }}>
              <ShoppingBag size={28} strokeWidth={1.5} style={{ color: 'rgba(196,167,254,0.7)' }} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ color: '#3b0764' }}>Your vault is empty</h2>
            <p className="text-[15px] mb-10 max-w-sm" style={{ color: 'rgba(59,7,100,0.45)' }}>Discover transformative beauty in our latest collections.</p>
            <button
              onClick={() => router.push('/all-products')}
              className="px-10 py-4 rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
              style={{ background: 'var(--cl-gradient)', boxShadow: '0 8px 32px rgba(147,51,234,0.25)' }}
            >
              Explore Collection
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart items */}
            <div className="lg:col-span-8 space-y-6">
              {/* Items card */}
              <div className="rounded-[2.5rem] overflow-hidden" style={glass}>
                <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(216,180,254,0.2)' }}>
                  <h2 className="text-[16px] font-bold tracking-tight" style={{ color: '#3b0764' }}>Shopping Cart</h2>
                  <button
                    onClick={handleAiAdvice}
                    disabled={isAiLoading || cartItems.length === 0}
                    className="group flex items-center justify-center p-2 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                    style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}
                    title="Ask AI for routine advice"
                  >
                    <Sparkles size={14} strokeWidth={2} className={isAiLoading ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
                  </button>
                </div>

                <AnimatePresence>
                  {aiAdvice && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ borderBottom: '1px solid rgba(216,180,254,0.2)', background: 'linear-gradient(to right, rgba(248,240,255,0.8), rgba(255,255,255,0.4))' }}
                      className="overflow-hidden"
                    >
                      <div className="px-7 py-6 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md" style={{ background: 'var(--cl-gradient)', color: 'white' }}>
                          <Sparkles size={16} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgb(126,105,230)' }}>AI Curator Insights</h4>
                            <button onClick={() => setAiAdvice(null)} className="p-1 -mr-2 text-gray-400 hover:text-gray-600 transition-colors" title="Dismiss">
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-[13px] leading-relaxed font-medium" style={{ color: '#3b0764' }}>{aiAdvice}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  {cartItems.map((item, i) => (
                    <motion.div
                      layout
                      key={item.id}
                      className="px-7 py-6 flex flex-col sm:flex-row gap-6 group relative"
                      style={{ borderBottom: i < cartItems.length - 1 ? '1px solid rgba(216,180,254,0.15)' : 'none' }}
                    >
                      {/* Image */}
                      <div
                        className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 mx-auto sm:mx-0 p-3"
                        style={{ background: 'rgba(248,240,255,0.8)', border: '1px solid rgba(216,180,254,0.25)' }}
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1.5">
                            <div>
                              <h3
                                className="text-[15px] font-bold tracking-tight cursor-pointer transition-colors"
                                style={{ color: '#3b0764' }}
                                onClick={() => router.push(`/product/${item.id}`)}
                              >
                                {item.name}
                              </h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.12em] mt-0.5" style={{ color: 'rgba(126,105,230,0.7)' }}>{item.brand}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                              style={{ color: 'rgba(59,7,100,0.3)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(254,226,226,0.7)'; e.currentTarget.style.color = 'rgb(239,68,68)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(59,7,100,0.3)'; }}
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {(item.size || item.shade) && (
                            <div className="flex gap-2 mt-1.5">
                              {item.size && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(196,167,254,0.15)', color: 'rgb(126,105,230)', border: '1px solid rgba(196,167,254,0.3)' }}>Size: {item.size}</span>}
                              {item.shade && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(196,167,254,0.15)', color: 'rgb(126,105,230)', border: '1px solid rgba(196,167,254,0.3)' }}>Shade: {item.shade}</span>}
                            </div>
                          )}

                          {item.stock_quantity === 0 && (
                            <p className="text-[11px] font-semibold text-red-500 mt-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse inline-block" />
                              Unavailable
                            </p>
                          )}
                          {item.stock_quantity > 0 && item.quantity > item.stock_quantity && (
                            <p className="text-[11px] font-semibold text-orange-500 mt-1.5">Limited: {item.stock_quantity} left</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[16px] font-bold" style={{ color: '#3b0764' }}>AED {item.price.toFixed(2)}</span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-[12px] line-through" style={{ color: 'rgba(59,7,100,0.3)' }}>AED {item.originalPrice}</span>
                            )}
                          </div>

                          {/* Qty controls */}
                          <div className="flex items-center rounded-xl p-0.5" style={{ background: 'rgba(196,167,254,0.12)', border: '1px solid rgba(216,180,254,0.3)' }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30"
                              style={{ color: 'rgb(126,105,230)' }}
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-9 text-center text-[13px] font-bold tabular-nums" style={{ color: '#3b0764' }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock_quantity}
                              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30"
                              style={{ color: 'rgb(126,105,230)' }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Cross-sell sections */}
              <PairItWithSection currentCartItems={cartItems} />
              <BuyAgainSection products={buyAgainProducts} />
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28 space-y-4">
                <div className="rounded-[2.5rem] p-7" style={glass}>
                  <h3 className="text-[16px] font-bold tracking-tight mb-7" style={{ color: '#3b0764' }}>Order Summary</h3>

                  {/* Line items */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-[13px]" style={{ color: 'rgba(59,7,100,0.55)' }}>
                      <span>Subtotal</span>
                      <span className="font-semibold" style={{ color: '#3b0764' }}>AED {subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[13px] font-semibold text-green-600">
                        <span>Discount</span>
                        <span>−AED {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px]" style={{ color: 'rgba(59,7,100,0.55)' }}>
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'} style={shipping !== 0 ? { color: '#3b0764' } : {}}>
                        {shipping === 0 ? 'Complimentary' : `AED ${shipping.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Shipping progress */}
                  <div className="mb-6 rounded-2xl p-4" style={{ background: 'rgba(196,167,254,0.1)', border: '1px solid rgba(216,180,254,0.25)' }}>
                    {subtotal >= FREE_SHIPPING ? (
                      <div className="flex items-center gap-2 text-green-600 text-[12px] font-semibold">
                        <Truck size={14} />
                        Your order qualifies for FREE shipping!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span style={{ color: 'rgba(59,7,100,0.55)' }}>Add AED {(FREE_SHIPPING - subtotal).toFixed(2)} for free shipping</span>
                          <span className="font-bold" style={{ color: 'rgb(126,105,230)' }}>{((subtotal / FREE_SHIPPING) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(216,180,254,0.3)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%` }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg,rgb(196,167,254),rgb(126,105,230))' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Loyalty Balance */}
                  {isAuthenticated && loyaltyPoints > 0 && (
                    <div className="mb-6 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden" style={{ background: 'var(--cl-gradient)', boxShadow: '0 4px 20px rgba(147,51,234,0.15)' }}>
                      <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-[20px] -mr-10 -mt-10 pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-1 text-white/90">
                          <Star size={13} fill="currentColor" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Loyalty Balance</h4>
                        </div>
                        <p className="text-[18px] font-black text-white">{loyaltyPoints.toLocaleString()} <span className="text-[12px] font-medium text-white/80">Points</span></p>
                      </div>
                      <div className="relative z-10 text-right">
                        <p className="text-[10px] text-white/70 font-semibold mb-0.5">Value</p>
                        <p className="text-[14px] font-bold text-white">AED {(Math.floor(loyaltyPoints / 100) * 5).toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {/* Coupon */}
                  <div className="mb-6 rounded-2xl p-4 space-y-3" style={{ background: 'rgba(248,240,255,0.7)', border: '1px solid rgba(216,180,254,0.25)' }}>
                    <div className="flex items-center gap-2">
                      <Tag size={13} style={{ color: 'rgb(196,167,254)' }} />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: 'rgba(59,7,100,0.55)' }}>Promo Code</h4>
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.8)',
                          border: '1px solid rgba(216,180,254,0.4)',
                          color: '#3b0764',
                        }}
                      />
                      <button
                        onClick={() => couponCode.trim() && applyCoupon(couponCode.trim())}
                        disabled={!!appliedCoupon || !couponCode.trim()}
                        className="px-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-all disabled:opacity-30"
                        style={{ background: 'var(--cl-gradient)' }}
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] font-semibold text-red-500">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-[11px] font-semibold text-green-600 rounded-lg px-3 py-2" style={{ background: 'rgba(220,252,231,0.6)', border: '1px solid rgba(134,239,172,0.3)' }}>
                        <span>✓ {appliedCoupon.code}</span>
                        <button onClick={removeCoupon} className="text-green-700 hover:underline">Remove</button>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-baseline mb-7 pt-5" style={{ borderTop: '1px solid rgba(216,180,254,0.25)' }}>
                    <span className="text-[15px] font-bold" style={{ color: '#3b0764' }}>Total</span>
                    <div className="text-right">
                      <p className="text-2xl font-black tabular-nums" style={{ color: '#3b0764' }}>AED {total.toFixed(2)}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(59,7,100,0.45)' }}>VAT included where applicable</p>
                    </div>
                  </div>

                  {/* Tabby promo */}
                  <div className="mb-4">
                    <TabbyPromo price={total} source="cart" />
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => router.push('/checkout')}
                    disabled={hasStockIssues}
                    className="w-full py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 mb-3"
                    style={{ background: 'var(--cl-gradient)', boxShadow: '0 8px 32px rgba(147,51,234,0.25)' }}
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full py-2.5 text-[12px] font-semibold transition-colors"
                    style={{ color: 'rgba(59,7,100,0.45)' }}
                  >
                    Return to Boutique
                  </button>

                  {/* Trust badges */}
                  <div className="mt-7 pt-6 grid grid-cols-1 gap-3" style={{ borderTop: '1px solid rgba(216,180,254,0.2)' }}>
                    {[
                      { Icon: ShieldCheck, text: 'Secured transactions' },
                      { Icon: Truck,       text: 'Tracked express shipping' },
                      { Icon: RotateCcw,   text: '30-day elegant returns' },
                    ].map(({ Icon, text }) => (
                      <div key={text} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,167,254,0.15)', color: 'rgb(126,105,230)' }}>
                          <Icon size={13} strokeWidth={1.75} />
                        </div>
                        <span className="text-[11px] font-medium" style={{ color: 'rgba(59,7,100,0.55)' }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
