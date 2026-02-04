"use client";
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Minus, X, ShoppingBag, Heart, Gift, Check, ShieldCheck, Truck, Sparkles, RotateCcw } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import BuyAgainSection from '../components/BuyAgainSection';
import PairItWithSection from '../components/PairItWithSection';
import RecommendationsSection from '../components/RecommendationsSection';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, appliedCoupon, discountAmount, finalTotal, applyCoupon, removeCoupon, couponError } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBuyAgainProducts = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const response = await fetch(`/api/users/${user.id}/buy-again`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          const filteredProducts = data.filter(buyAgainProduct => 
            !cartItems.some(cartItem => cartItem.id === buyAgainProduct.id)
          );
          setBuyAgainProducts(filteredProducts);
        } catch (error) {
          console.error("Error fetching buy again products:", error);
          setBuyAgainProducts([]);
        }
      } else {
        setBuyAgainProducts([]);
      }
    };
    fetchBuyAgainProducts();
  }, [isAuthenticated, user, cartItems]);

  const savings = cartItems.reduce((sum, item) => 
    sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0
  );
  const FREE_SHIPPING_THRESHOLD = 200;
  const SHIPPING_COST = 30;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = finalTotal + shipping;

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCoupon(couponCode.trim());
    }
  };

  const hasStockIssues = cartItems.some(item => item.stock_quantity === 0 || item.quantity > item.stock_quantity);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900 pb-24">
      {/* Soft Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-pink/[0.03] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/[0.02] rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-[13px] font-medium tracking-tight group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Continue Shopping
            </button>
            <div className="text-center">
              <h1 className="text-[17px] font-semibold tracking-tight text-gray-900">Your Selection</h1>
              <p className="text-[11px] text-gray-400 font-medium tracking-tight">{cartItems.length} masterpieces</p>
            </div>
            <div className="w-[120px] hidden sm:block"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {cartItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-8 border border-gray-50">
                <ShoppingBag className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-serif italic text-gray-900 mb-4 leading-tight">Your vault is currently empty</h2>
            <p className="text-gray-400 text-[15px] font-light italic mb-10 max-w-sm mx-auto">Discover the essence of transformative beauty in our latest collections.</p>
            <Button 
              onClick={() => router.push('/all-products')}
              className="bg-gray-900 text-white hover:bg-brand-pink px-10 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all"
            >
              Explore Collection
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-8 space-y-10">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">Shopping Cart</h2>
                  <Sparkles className="text-brand-pink/20" size={20} />
                </div>
                
                <div className="divide-y divide-gray-50">
                  {cartItems.map((item) => (
                    <motion.div 
                        layout
                        key={item.id} 
                        className="p-8 flex flex-col sm:flex-row gap-8 group relative"
                    >
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 mx-auto sm:mx-0 border border-gray-100 p-4 shadow-inner">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-[16px] font-medium text-gray-900 tracking-tight hover:text-brand-pink transition-colors cursor-pointer" onClick={() => router.push(`/product/${item.id}`)}>{item.name}</h3>
                              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-1">{item.brand}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {(item.size || item.shade) && (
                            <div className="flex gap-3 mt-2">
                                {item.size && <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">Size: {item.size}</span>}
                                {item.shade && <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">Shade: {item.shade}</span>}
                            </div>
                          )}

                          {item.stock_quantity === 0 && (
                            <p className="text-[11px] font-semibold text-red-500 mt-2 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                                Currently Unavailable
                            </p>
                          )}
                          {item.stock_quantity > 0 && item.quantity > item.stock_quantity && (
                            <p className="text-[11px] font-semibold text-orange-500 mt-2">Limited Stock: Only {item.stock_quantity} remaining</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-2">
                            <span className="text-[16px] font-semibold text-gray-900">AED {item.price.toFixed(2)}</span>
                            {item.originalPrice && (
                              <span className="text-[12px] text-gray-300 line-through">AED {item.originalPrice}</span>
                            )}
                          </div>

                          <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 shadow-inner">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-pink transition-colors disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center text-[13px] font-semibold text-gray-900 tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-pink transition-colors disabled:opacity-30"
                              disabled={item.quantity >= item.stock_quantity}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-10">
                <PairItWithSection currentCartItems={cartItems} />
                <BuyAgainSection products={buyAgainProducts} />
                <RecommendationsSection />
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-8">Summary</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-[14px] text-gray-500 font-medium">
                      <span>Subtotal</span>
                      <span className="text-gray-900">AED {subtotal.toFixed(2)}</span>
                    </div>
                    
                    {savings > 0 && (
                      <div className="flex justify-between text-[14px] text-green-600 font-medium">
                        <span>Ritual Savings</span>
                        <span>-AED {savings.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-[14px] text-gray-500 font-medium">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-green-600' : 'text-gray-900'}>
                        {shipping === 0 ? 'Complimentary' : `AED ${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-50 mt-4">
                      {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-[12px] font-medium flex items-center gap-3">
                          <Truck size={16} />
                          <span>Your order qualifies for FREE Shipping!</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-gray-400 italic">Add AED {(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} for complimentary shipping</span>
                            <span className="text-brand-pink">{((subtotal / FREE_SHIPPING_THRESHOLD) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-1 border border-gray-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                              className="bg-brand-pink h-full rounded-full" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <h4 className="text-[12px] font-semibold text-gray-900 tracking-tight uppercase">Promo Code</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="bg-white border-gray-200 rounded-xl text-[13px] h-11 focus:ring-brand-pink/5"
                        disabled={!!appliedCoupon}
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={!!appliedCoupon || !couponCode.trim()}
                        className="px-5 bg-gray-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-brand-pink"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-red-500 font-medium ml-1">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-[12px] font-medium text-green-600 bg-green-50/50 px-3 py-2 rounded-lg border border-green-100">
                        <span>✓ {appliedCoupon.code}</span>
                        <button onClick={removeCoupon} className="text-green-800 hover:underline">Remove</button>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-6 mb-8">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[16px] font-semibold text-gray-900">Total</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 tracking-tighter">AED {total.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">VAT included where applicable</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-gray-900 text-white hover:bg-brand-pink h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                      size="lg"
                      onClick={() => router.push('/checkout')}
                      disabled={hasStockIssues}
                    >
                      Finalize Acquisition
                    </Button>
                    
                    <button 
                      className="w-full text-gray-400 hover:text-gray-900 transition-colors text-[12px] font-medium tracking-tight py-2"
                      onClick={() => router.push('/')}
                    >
                      Return to Boutique
                    </button>
                  </div>

                  <div className="mt-10 grid grid-cols-1 gap-4 pt-8 border-t border-gray-50">
                    {[
                        { icon: ShieldCheck, text: "Secured transactions" },
                        { icon: Truck, text: "Tracked express shipping" },
                        { icon: RotateCcw, text: "30-day elegant returns" }
                    ].map((feature, i) => (
                        <div key={feature.text} className="flex items-center gap-3 text-gray-400 group">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-white group-hover:border-brand-pink/20 transition-all">
                                <feature.icon size={14} className="group-hover:text-brand-pink transition-colors" />
                            </div>
                            <span className="text-[11px] font-medium tracking-tight">{feature.text}</span>
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
