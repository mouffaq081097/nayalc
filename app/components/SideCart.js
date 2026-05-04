'use client';

import { useCart } from '../context/CartContext';
import { X, ShoppingBag, Minus, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SideCart() {
  const { isCartOpen, closeCart, cartItems, removeFromCart, updateQuantity } = useCart();

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((t, i) => t + i.quantity, 0);
  const FREE_SHIPPING = 200;
  const toFreeShipping = Math.max(0, FREE_SHIPPING - subtotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[300]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="absolute inset-0"
            style={{ background: 'rgba(15,0,30,0.45)', backdropFilter: 'blur(6px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute top-0 right-0 h-full w-full sm:max-w-[400px] flex flex-col"
            style={{
              background: 'rgba(249,242,255,0.97)',
              borderLeft: '1px solid rgba(216,180,254,0.5)',
              backdropFilter: 'blur(40px)',
            }}
          >
            {/* Aura */}
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(196,167,254,0.18)' }} />

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between relative z-10" style={{ borderBottom: '1px solid rgba(216,180,254,0.3)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' }}>
                  <ShoppingBag size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold leading-tight" style={{ color: '#3b0764' }}>Your Selection</h2>
                  <p className="text-[10px] font-semibold" style={{ color: 'rgba(107,33,168,0.5)' }}>
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all hover:bg-purple-100"
                style={{ color: 'rgba(107,33,168,0.5)', border: '1px solid rgba(216,180,254,0.4)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Free shipping progress */}
            {cartItems.length > 0 && (
              <div className="px-6 py-3 relative z-10" style={{ borderBottom: '1px solid rgba(216,180,254,0.18)', background: 'rgba(248,240,255,0.5)' }}>
                {toFreeShipping === 0 ? (
                  <p className="text-[11px] font-bold text-green-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    You qualify for complimentary shipping!
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold flex justify-between" style={{ color: 'rgba(59,7,100,0.5)' }}>
                      <span>Add AED {toFreeShipping.toFixed(2)} for free shipping</span>
                      <span className="font-black" style={{ color: 'rgb(126,105,230)' }}>{Math.round((subtotal / FREE_SHIPPING) * 100)}%</span>
                    </p>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(216,180,254,0.3)' }}>
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
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 relative z-10" style={{ scrollbarWidth: 'none' }}>
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-5">
                  <div className="w-18 h-18 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)', border: '1px solid rgba(216,180,254,0.35)' }}>
                    <ShoppingBag size={26} strokeWidth={1.25} style={{ color: 'rgba(196,167,254,0.6)' }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold mb-1.5" style={{ color: '#3b0764' }}>Your vault is empty</p>
                    <p className="text-[12px]" style={{ color: 'rgba(59,7,100,0.45)' }}>Discover our luxury collection</p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="mt-1 px-8 py-3 rounded-full text-white text-[10px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.97] shadow-lg"
                    style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))', boxShadow: '0 8px 24px rgba(147,51,234,0.25)' }}
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0, padding: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 250 }}
                      className="flex gap-4 p-4 rounded-2xl"
                      style={{
                        background: 'rgba(255,255,255,0.76)',
                        border: '1px solid rgba(216,180,254,0.28)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {/* Product image */}
                      <div
                        className="w-20 h-20 rounded-xl flex-shrink-0 p-2 overflow-hidden cursor-pointer"
                        style={{ background: 'rgba(248,240,255,0.9)', border: '1px solid rgba(216,180,254,0.22)' }}
                        onClick={closeCart}
                      >
                        <Link href={`/product/${item.id}`}>
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500"
                          />
                        </Link>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <Link href={`/product/${item.id}`} onClick={closeCart}>
                            <p className="text-[12px] font-bold leading-snug line-clamp-2 hover:text-[#9333ea] transition-colors" style={{ color: '#3b0764' }}>
                              {item.name}
                            </p>
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:bg-red-50"
                            style={{ color: 'rgba(107,33,168,0.35)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgb(239,68,68)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(107,33,168,0.35)'}
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {item.brand && (
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] mb-2.5" style={{ color: 'rgba(126,105,230,0.65)' }}>
                            {item.brand}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-auto">
                          {/* Qty stepper */}
                          <div className="flex items-center rounded-xl p-0.5 gap-0.5" style={{ background: 'rgba(196,167,254,0.12)', border: '1px solid rgba(216,180,254,0.28)' }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-25"
                              style={{ color: 'rgb(126,105,230)' }}
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-7 text-center text-[12px] font-bold tabular-nums" style={{ color: '#3b0764' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                              style={{ color: 'rgb(126,105,230)' }}
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          {/* Price */}
                          <p className="text-[13px] font-black tabular-nums" style={{ color: '#3b0764' }}>
                            AED {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="px-5 pb-7 pt-5 space-y-3 relative z-10" style={{ borderTop: '1px solid rgba(216,180,254,0.3)', background: 'rgba(248,240,255,0.65)' }}>
                {/* Subtotal row */}
                <div className="flex justify-between items-baseline px-1">
                  <span className="text-[12px] font-semibold" style={{ color: 'rgba(59,7,100,0.5)' }}>Subtotal</span>
                  <div className="text-right">
                    <span className="text-[17px] font-black tabular-nums" style={{ color: '#3b0764' }}>AED {subtotal.toFixed(2)}</span>
                    <p className="text-[9px] mt-0.5" style={{ color: 'rgba(59,7,100,0.38)' }}>Shipping & taxes at checkout</p>
                  </div>
                </div>

                {/* Primary CTA — goes to cart page */}
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
                    boxShadow: '0 8px 28px rgba(147,51,234,0.3)',
                  }}
                >
                  <Sparkles size={13} />
                  Review My Order
                  <ArrowRight size={13} />
                </Link>

                {/* Continue shopping */}
                <button
                  onClick={closeCart}
                  className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:opacity-60"
                  style={{ color: 'rgba(107,33,168,0.45)' }}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
