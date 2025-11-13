"use client"; // Added use client directive
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Minus, X, ShoppingBag, Heart, Gift, Check } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useRouter } from 'next/navigation'; // Added useRouter import
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, appliedCoupon, discountAmount, finalTotal, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const router = useRouter(); // Initialize useRouter

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
      setCouponCode('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}> {/* Changed onClick */}
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-serif bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Your Cart
              </h1>
              <p className="text-sm text-gray-500">{cartItems.length} items</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Discover our beautiful selection of premium beauty products</p>
            <Button 
              onClick={() => router.back()} // Changed onClick
              className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-medium">Shopping Cart</h2>
                </div>
                
                <div className="space-y-0">
                  {cartItems.map((item, index) => (
                    <div key={item.id} className={`p-6 flex flex-col sm:flex-row gap-4 ${index !== cartItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      {/* Product Image */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white flex-shrink-0 mx-auto sm:mx-0">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                          <div className="mb-2 sm:mb-0">
                            <h3 className="text-gray-900 font-medium">{item.name}</h3>
                            <p className="text-sm text-[var(--brand-blue)]">Brand: {item.brand}</p>
                            {(item.size || item.shade) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.size && `Size: ${item.size}`}
                                {item.size && item.shade && ' • '}
                                {item.shade && `Shade: ${item.shade}`}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 -mt-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 sm:mt-0">
                          <div className="flex items-center gap-2 mb-2 sm:mb-0">
                            <span className="text-lg font-medium">AED {item.price}</span>
                            {item.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">AED {item.originalPrice}</span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Code */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-medium mb-4">Promo Code</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                    disabled={!!appliedCoupon}
                  />
                  <Button 
                    onClick={handleApplyCoupon}
                    variant="outline"
                    disabled={!!appliedCoupon}
                  >
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="mt-3 text-sm text-green-600 flex justify-between items-center">
                    <span>✓ Promo code "{appliedCoupon.code}" applied!</span>
                    <Button variant="ghost" size="sm" onClick={removeCoupon}>Remove</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="text-xl font-medium mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>AED {subtotal.toFixed(2)}</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>You Save</span>
                      <span>-AED {savings.toFixed(2)}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Promo Discount</span>
                      <span>-AED {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `AED ${shipping.toFixed(2)}`}</span>
                  </div>
                  
                  {/* Free Shipping Progress Bar */}
                  <div className="mt-4">
                    {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                      <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Your order qualifies for FREE Shipping!</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Add AED {(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} for FREE Shipping</span>
                          <span>{((subtotal / FREE_SHIPPING_THRESHOLD) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[var(--brand-blue)] h-2 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>AED {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 transition-opacity"
                    size="lg"
                    onClick={() => router.push('/checkout')} // Changed onClick
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.back()} // Changed onClick
                  >
                    Continue Shopping
                  </Button>
                </div>

                {/* Features */}
                <div className="mt-8 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[var(--brand-pink)]" />
                    <span>Free gift with orders over AED 1,000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[var(--brand-pink)]" />
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[var(--brand-pink)]" />
                    <span>Secure checkout</span>
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