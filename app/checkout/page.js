"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, MapPin, Lock, Check, Gift, ShieldCheck, Loader2, Pencil, Trash2, Plus, Sparkles, RotateCcw } from 'lucide-react';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { createFetchWithAuth } from '../lib/api';
import dynamic from 'next/dynamic';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import TabbyCard from '../components/TabbyCard';

const Modal = dynamic(() => import('../components/Modal'), { ssr: false });
const AddressInputForm = dynamic(() => import('../components/AddressInputForm'), { ssr: false });

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal, appliedCoupon, discountAmount, finalTotal, applyCoupon, removeCoupon, selectedShippingAddressId, setSelectedShippingAddressId, couponError } = useCart();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(selectedShippingAddressId);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [paymentAuthorized, setPaymentAuthorization] = useState(false);
  const [authorizedPaymentIntentId, setAuthorizedPaymentIntentId] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [formData, setFormData] = useState({ paymentMethod: 'cashOnDelivery', giftWrap: false, giftMessage: '', newsletter: false });
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);
  const [isTabbyLoading, setIsTabbyLoading] = useState(false);
  const piCreatedRef = useRef(false);

  const hasStockIssues = cartItems.some(item => item.stock_quantity === 0 || item.quantity > item.stock_quantity);
  const shipping = subtotal > 200 ? 0 : 30;
  const tax = subtotal * 0.05;
  const giftWrapFee = formData.giftWrap ? 100 : 0;
  const pointsDiscount = usePoints ? Math.floor(loyaltyPoints / 100) * 5 : 0;
  const total = Math.max(0, finalTotal + shipping + tax + giftWrapFee - pointsDiscount);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth?callbackUrl=/checkout');
  }, [authLoading, isAuthenticated, router]);

  const fetchShippingAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/addresses`);
      const data = await res.json();
      setShippingAddresses(data);
      if (data.length > 0 && !selectedShippingAddressId) {
        const def = data.find(a => a.isDefault);
        setSelectedAddressId(def ? def.id : data[0].id);
      }
    } catch {}
  }, [user, selectedShippingAddressId, fetchWithAuth]);

  useEffect(() => {
    if (user) {
      fetchShippingAddresses();
      fetchWithAuth(`/api/users/${user.id}/loyalty`)
        .then(r => r.json())
        .then(d => { setLoyaltyPoints(d.stats?.points || 0); setLoyaltyLoaded(true); })
        .catch(() => setLoyaltyLoaded(true));
    }
  }, [user, fetchShippingAddresses, fetchWithAuth]);

  useEffect(() => { setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)); }, []);

  useEffect(() => {
    if (formData.paymentMethod !== 'card' || total <= 0 || !loyaltyLoaded || piCreatedRef.current) return;
    piCreatedRef.current = true;
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(total * 100), currency: 'aed' }),
    })
      .then(r => r.json())
      .then(d => setClientSecret(d.clientSecret))
      .catch(() => { piCreatedRef.current = false; });
  }, [formData.paymentMethod, total, loyaltyLoaded]);

  useEffect(() => { piCreatedRef.current = false; setClientSecret(''); }, [formData.giftWrap, usePoints, appliedCoupon]);
  useEffect(() => { setSelectedShippingAddressId(selectedAddressId); }, [selectedAddressId, setSelectedShippingAddressId]);

  useEffect(() => {
    if (formData.paymentMethod !== 'card' || !selectedAddressId || !user?.id || cartItems.length === 0) return;
    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + 7);
    const pendingOrderData = {
      user_address_id: selectedAddressId,
      payment_method: 'card',
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping_cost: parseFloat(shipping.toFixed(2)),
      total_amount: parseFloat(total.toFixed(2)),
      shipping_scheduled_date: shippingDate.toISOString(),
      user_id: user.id,
      items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
      taxAmount: parseFloat(tax.toFixed(2)),
      applied_coupon_id: appliedCoupon ? appliedCoupon.id : null,
      discount_amount: parseFloat((discountAmount || 0).toFixed(2)),
      redeemed_points: usePoints ? Math.floor(loyaltyPoints / 100) * 100 : 0,
      points_discount: pointsDiscount,
      gift_wrap: formData.giftWrap,
      gift_wrap_cost: giftWrapFee,
    };
    sessionStorage.setItem('pendingCardOrder', JSON.stringify(pendingOrderData));
  }, [formData.paymentMethod, formData.giftWrap, selectedAddressId, user, subtotal, total, cartItems, discountAmount, usePoints, loyaltyPoints, appliedCoupon, giftWrapFee, pointsDiscount, shipping, tax]);

  const openAddressModal = (addr) => { setEditingAddress(addr); setIsAddressModalOpen(true); };
  const closeAddressModal = () => { setEditingAddress(null); setIsAddressModalOpen(false); };

  const handleCheckoutAddressSave = async (addressData) => {
    if (!user) return;
    const method = editingAddress ? 'PUT' : 'POST';
    const endpoint = editingAddress
      ? `/api/users/${user.id}/addresses/${editingAddress.id}`
      : `/api/users/${user.id}/addresses`;
    const res = await fetchWithAuth(endpoint, {
      method,
      body: JSON.stringify({
        address_line1: addressData.addressLine1,
        address_line2: addressData.apartment || addressData.addressLine2,
        city: addressData.city, zip_code: addressData.zipCode || '0000',
        country: addressData.country || 'United Arab Emirates',
        state: addressData.state || '',
        customer_phone: addressData.customerPhone,
        address_label: addressData.addressLabel || addressData.addressLine1,
        is_default: addressData.isDefault || false,
        latitude: addressData.latitude, longitude: addressData.longitude,
      }),
    });
    if (!res.ok) throw new Error('Failed to save address');
    closeAddressModal();
    fetchShippingAddresses();
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await fetchWithAuth(`/api/users/${user.id}/addresses/${id}`, { method: 'DELETE' });
      fetchShippingAddresses();
      if (selectedAddressId === id) setSelectedAddressId(null);
    } catch { toast.error('Error deleting address.'); }
  };

  const handleTabbyCheckout = async () => {
    if (!selectedAddressId) { toast.error('Please select a shipping address.'); return; }
    const addr = shippingAddresses.find(a => a.id === selectedAddressId);
    if (!addr) { toast.error('Selected address not found.'); return; }
    setIsTabbyLoading(true);
    try {
      const shippingDate = new Date();
      shippingDate.setDate(shippingDate.getDate() + 7);
      sessionStorage.setItem('pendingTabbyOrder', JSON.stringify({
        user_address_id: selectedAddressId,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping_cost: parseFloat(shipping.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2)),
        shipping_scheduled_date: shippingDate.toISOString(),
        user_id: user.id,
        items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        taxAmount: parseFloat(tax.toFixed(2)),
        applied_coupon_id: appliedCoupon ? appliedCoupon.id : null,
        discount_amount: parseFloat((discountAmount || 0).toFixed(2)),
        redeemed_points: usePoints ? Math.floor(loyaltyPoints / 100) * 100 : 0,
        points_discount: pointsDiscount,
        gift_wrap: formData.giftWrap,
        gift_wrap_cost: giftWrapFee,
      }));
      const res = await fetch('/api/tabby/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          items: cartItems.map(i => ({ id: i.id, productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image || '', productUrl: `${window.location.origin}/product/${i.id}` })),
          buyer: { email: user.email, name: user.name || user.first_name || '', phone: addr.customer_phone || '' },
          shippingAddress: { city: addr.city || 'Dubai', address: addr.shipping_address || addr.addressLine1 || '', zip: addr.zip_code || '00000' },
          taxAmount: tax, shippingAmount: shipping, discountAmount: discountAmount || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Tabby checkout failed.'); setIsTabbyLoading(false); return; }
      window.location.href = data.webUrl;
    } catch {
      toast.error('Could not connect to Tabby. Please try another payment method.');
      setIsTabbyLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedAddressId) { toast.error('Please select a shipping address.'); return; }
    if (currentStep === 2 && formData.paymentMethod === 'tabby') { handleTabbyCheckout(); return; }
    if (currentStep === 2 && formData.paymentMethod === 'card' && !paymentAuthorized) { toast.error('Please complete card authorization.'); return; }
    if (currentStep < 3) setCurrentStep(s => s + 1);
  };

  const handleAuthorizedCardPayment = (piId) => {
    setAuthorizedPaymentIntentId(piId);
    setPaymentAuthorization(true);
    setCurrentStep(3);
    toast.success('Payment authorized!');
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId) return;
    setIsPlacingOrder(true);
    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + 7);
    const orderData = {
      user_address_id: selectedAddressId,
      payment_method: formData.paymentMethod,
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping_cost: parseFloat(shipping.toFixed(2)),
      total_amount: parseFloat(total.toFixed(2)),
      shipping_scheduled_date: shippingDate.toISOString(),
      user_id: user.id,
      items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
      taxAmount: tax,
      applied_coupon_id: appliedCoupon ? appliedCoupon.id : null,
      discount_amount: discountAmount,
      redeemed_points: usePoints ? Math.floor(loyaltyPoints / 100) * 100 : 0,
      points_discount: pointsDiscount,
      gift_wrap: formData.giftWrap,
      gift_wrap_cost: giftWrapFee,
      stripe_payment_intent_id: authorizedPaymentIntentId,
    };
    try {
      const res = await fetchWithAuth('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
      const result = await res.json();
      if (res.status === 409) { clearCart(); router.push(`/order-confirmed/${result.orderId}`); return; }
      if (!res.ok) { toast.error(result.message || 'Error placing order. Please contact support.'); setIsPlacingOrder(false); return; }
      clearCart();
      router.push(`/order-confirmed/${result.orderId}`);
    } catch { toast.error('Error placing order. Please contact support.'); setIsPlacingOrder(false); }
  };

  const steps = [
    { id: 1, label: 'Shipping', Icon: Truck },
    { id: 2, label: 'Payment', Icon: CreditCard },
    { id: 3, label: 'Review',   Icon: Check },
  ];

  const btnLabel = isPlacingOrder ? 'Processing…'
    : isTabbyLoading ? 'Redirecting to Tabby…'
    : currentStep === 3 ? `Place Order · AED ${total.toFixed(2)}`
    : formData.paymentMethod === 'tabby' && currentStep === 2 ? 'Pay with Tabby'
    : formData.paymentMethod === 'card'  && currentStep === 2 ? 'Authorize Card'
    : 'Continue';

  if (!authLoading && !isAuthenticated) return null;

  /* ── shared card style ── */
  const card = 'bg-white border border-[#e5e5ea] rounded-2xl';

  return (
    <div className="min-h-screen bg-white pb-28 lg:pb-12">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#e5e5ea]">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/cart')}
            className="flex items-center gap-2 text-[13px] font-medium text-[#5a5a64] hover:text-[#111114] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Cart
          </button>
          <div className="text-center">
            <h1 className="text-[16px] font-semibold text-[#111114]">Checkout</h1>
            <p className="text-[11px] text-[#8a8a93] mt-0.5">Step {currentStep} of 3</p>
          </div>
          <div className="w-[120px] hidden sm:block" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left column */}
          <div className="lg:col-span-8 space-y-5">

            {/* Step progress */}
            <div className={card + ' p-5'}>
              <div className="flex items-center justify-between max-w-xs mx-auto relative">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center gap-1.5 relative z-10">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 text-white"
                      style={currentStep >= step.id
                        ? { background: 'linear-gradient(90deg,#c087fc,#9869f7)', boxShadow: '0 2px 8px rgba(152,105,247,.3)' }
                        : { background: '#f3f3f5', color: '#c8c8cf' }}
                    >
                      <step.Icon
                        size={15}
                        strokeWidth={currentStep === step.id ? 2.5 : 1.5}
                        className={currentStep >= step.id ? 'text-white' : 'text-[#c8c8cf]'}
                      />
                    </div>
                    <span className={`text-[11px] font-medium ${currentStep >= step.id ? 'text-[#111114]' : 'text-[#c8c8cf]'}`}>
                      {step.label}
                    </span>
                    {idx < steps.length - 1 && (
                      <div
                        className="absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-4 h-px"
                        style={{ background: currentStep > step.id ? '#9869f7' : '#e5e5ea' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className={card + ' p-6 lg:p-8 min-h-[400px] flex flex-col'}
              >

                {/* Step 1 — Shipping */}
                {currentStep === 1 && (
                  <div className="space-y-6 flex-grow">
                    <div>
                      <h2 className="text-[20px] font-semibold text-[#111114]">Shipping address</h2>
                      <p className="text-[13px] text-[#5a5a64] mt-1">Where should your order be delivered?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {shippingAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`relative p-5 cursor-pointer rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? 'border-[#9869f7] bg-[#f9f9fb] shadow-sm'
                                : 'border-[#e5e5ea] bg-white hover:border-[#c8c8cf]'
                            }`}
                          >
                            {isSelected && (
                              <div
                                className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
                                style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                              >
                                <Check size={11} strokeWidth={3} />
                              </div>
                            )}
                            <div className="space-y-1.5 pr-6">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-semibold text-[#111114]">
                                  {addr.addressLabel || addr.customerName || user?.name}
                                </p>
                                {addr.isDefault && (
                                  <span
                                    className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                                    style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                                  >
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#5a5a64] truncate">{addr.shipping_address || addr.addressLine1}</p>
                              <p className="text-[11px] text-[#8a8a93] flex items-center gap-1">
                                <MapPin size={10} /> {addr.city}, {addr.country}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#e5e5ea]">
                              <button
                                onClick={(e) => { e.stopPropagation(); openAddressModal(addr); }}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-[#5a5a64] hover:text-[#111114] transition-colors"
                              >
                                <Pencil size={11} /> Edit
                              </button>
                              <span className="text-[#e5e5ea]">·</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={11} /> Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add new address */}
                      <button
                        onClick={() => openAddressModal(null)}
                        className="min-h-[120px] rounded-xl border-2 border-dashed border-[#e5e5ea] flex flex-col items-center justify-center gap-2 text-[#8a8a93] hover:border-[#9869f7] hover:text-[#9869f7] hover:bg-[#f9f9fb] transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-lg border border-current flex items-center justify-center">
                          <Plus size={14} />
                        </div>
                        <span className="text-[12px] font-medium">Add new address</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 — Payment */}
                {currentStep === 2 && (
                  <div className="space-y-6 flex-grow">
                    <div>
                      <h2 className="text-[20px] font-semibold text-[#111114]">Payment</h2>
                      <p className="text-[13px] text-[#5a5a64] mt-1">Choose your preferred payment method.</p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { id: 'card',           label: 'Credit Card',      Icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
                        { id: 'cashOnDelivery', label: 'Cash on Delivery', Icon: Truck,      desc: 'Payment upon delivery'  },
                      ].map(({ id, label, Icon, desc }) => {
                        const sel = formData.paymentMethod === id;
                        return (
                          <div
                            key={id}
                            onClick={() => setFormData(p => ({ ...p, paymentMethod: id }))}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                              sel ? 'border-[#9869f7] bg-[#f9f9fb]' : 'border-[#e5e5ea] bg-white hover:border-[#c8c8cf]'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sel ? 'text-[#9869f7] bg-white border border-[#e5e5ea]' : 'bg-[#f3f3f5] text-[#5a5a64]'}`}>
                                <Icon size={18} strokeWidth={1.5} />
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-[#111114]">{label}</p>
                                <p className="text-[11px] text-[#8a8a93]">{desc}</p>
                              </div>
                            </div>
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                              style={sel
                                ? { borderColor: '#9869f7', background: 'linear-gradient(90deg,#c087fc,#9869f7)' }
                                : { borderColor: '#e5e5ea' }}
                            >
                              {sel && <Check size={10} strokeWidth={3} className="text-white" />}
                            </div>
                          </div>
                        );
                      })}

                      {/* Tabby */}
                      {(() => {
                        const sel = formData.paymentMethod === 'tabby';
                        return (
                          <div
                            onClick={() => setFormData(p => ({ ...p, paymentMethod: 'tabby' }))}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                              sel ? 'border-[#3DFFA0] bg-[#f0fff8]' : 'border-[#e5e5ea] bg-white hover:border-[#c8c8cf]'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                <Image src="/0x0.png" alt="Tabby" width={40} height={40} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[14px] font-semibold text-[#111114]">Pay in 4</p>
                                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: '#3DFFA0', color: '#1A1A2E' }}>tabby</span>
                                </div>
                                <p className="text-[11px] text-[#8a8a93]">4 × AED {(total / 4).toFixed(2)} · No interest</p>
                              </div>
                            </div>
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                              style={sel ? { borderColor: '#3DFFA0', background: '#3DFFA0' } : { borderColor: '#e5e5ea' }}
                            >
                              {sel && <Check size={10} strokeWidth={3} style={{ color: '#1A1A2E' }} />}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Stripe card form */}
                    <AnimatePresence mode="wait">
                      {formData.paymentMethod === 'card' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                          <div className="rounded-2xl border border-[#e5e5ea] overflow-hidden">
                            <div className="px-5 py-3 border-b border-[#e5e5ea] bg-[#f9f9fb] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-green-500" />
                                <p className="text-[12px] font-semibold text-[#2a2a31]">Secure Payment</p>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#8a8a93]">
                                <Lock size={11} />
                                <span className="text-[10px] font-medium uppercase tracking-wide">Encrypted</span>
                              </div>
                            </div>
                            <div className="p-5">
                              {clientSecret && stripePromise ? (
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                  <CheckoutForm onSuccessfulPayment={handleAuthorizedCardPayment} buttonLabel="Authorize & Review" amount={Math.round(total * 100)} clientSecret={clientSecret} />
                                </Elements>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                  <Loader2 className="animate-spin text-[#9869f7]" size={22} />
                                  <p className="text-[11px] text-[#8a8a93] uppercase tracking-widest font-medium">Initializing secure gateway…</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tabby card */}
                    <AnimatePresence mode="wait">
                      {formData.paymentMethod === 'tabby' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                          <TabbyCard price={total} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Gift wrap */}
                    <div className="rounded-xl border border-[#e5e5ea] p-4">
                      <label className="flex items-center gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.giftWrap}
                          onChange={e => setFormData(p => ({ ...p, giftWrap: e.target.checked }))}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#9869f7' }}
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#f3f3f5] flex items-center justify-center text-[#5a5a64]">
                            <Gift size={15} strokeWidth={1.75} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#111114]">Gift wrap</p>
                            <p className="text-[11px] text-[#8a8a93]">+AED 100 · Naya Signature Packaging</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3 — Review */}
                {currentStep === 3 && (
                  <div className="space-y-5 flex-grow">
                    <div>
                      <h2 className="text-[20px] font-semibold text-[#111114]">Review your order</h2>
                      <p className="text-[13px] text-[#5a5a64] mt-1">Check everything looks right before placing your order.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Shipping */}
                      <div className="rounded-xl border border-[#e5e5ea] p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={13} className="text-[#8a8a93]" />
                          <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-widest">Shipping address</p>
                        </div>
                        {(() => {
                          const addr = shippingAddresses.find(a => a.id === selectedAddressId);
                          return addr ? (
                            <div className="text-[13px] space-y-0.5">
                              <p className="font-semibold text-[#111114]">{addr.customerName || user?.name}</p>
                              <p className="text-[#5a5a64]">{addr.shipping_address || addr.addressLine1}</p>
                              <p className="text-[#8a8a93]">{addr.city}, {addr.country}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Payment */}
                      <div className="rounded-xl border border-[#e5e5ea] p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard size={13} className="text-[#8a8a93]" />
                          <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-widest">Payment</p>
                        </div>
                        <p className="text-[14px] font-semibold text-[#111114]">
                          {formData.paymentMethod === 'card' ? 'Credit card (authorized)' : 'Cash on delivery'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#8a8a93]">
                          <ShieldCheck size={12} className="text-green-500" /> Secure checkout
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop nav */}
                <div className="hidden lg:flex items-center justify-between mt-8 pt-6 border-t border-[#e5e5ea]">
                  <button
                    onClick={() => currentStep > 1 && setCurrentStep(s => s - 1)}
                    disabled={currentStep === 1}
                    className="text-[13px] font-medium text-[#5a5a64] hover:text-[#111114] transition-colors disabled:opacity-0"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => currentStep < 3 ? handleNextStep() : handlePlaceOrder()}
                    disabled={isPlacingOrder || isTabbyLoading || hasStockIssues}
                    className="h-12 px-10 rounded-full text-[13px] font-semibold tracking-[0.1em] uppercase text-white disabled:opacity-40 transition-opacity"
                    style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
                  >
                    {btnLabel}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className={card + ' p-6'}>
                <h3 className="text-[15px] font-semibold text-[#111114] mb-5">Order Summary</h3>

                {/* Items */}
                <div className="max-h-[200px] overflow-y-auto pr-1 no-scrollbar mb-5 space-y-3">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#f9f9fb] border border-[#e5e5ea] p-1">
                        <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#111114] truncate">{item.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[11px] text-[#8a8a93]">Qty: {item.quantity}</p>
                          <p className="text-[12px] font-semibold text-[#111114]">AED {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Breakdown */}
                <div className="space-y-2.5 text-[13px] mb-5">
                  <div className="flex justify-between"><span className="text-[#5a5a64]">Subtotal</span><span className="font-semibold text-[#111114]">AED {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-[#5a5a64]">Shipping</span>
                    <span className={shipping === 0 ? 'font-semibold text-green-600' : 'font-semibold text-[#111114]'}>
                      {shipping === 0 ? 'Free' : `AED ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-[#5a5a64]">Tax (5%)</span><span className="font-semibold text-[#111114]">AED {tax.toFixed(2)}</span></div>
                  {giftWrapFee > 0 && <div className="flex justify-between"><span className="text-[#5a5a64]">Gift wrap</span><span className="font-semibold text-[#111114]">AED {giftWrapFee.toFixed(2)}</span></div>}
                  {discountAmount > 0 && <div className="flex justify-between font-semibold text-green-600"><span>Discount</span><span>−AED {discountAmount.toFixed(2)}</span></div>}
                  {pointsDiscount > 0 && <div className="flex justify-between font-semibold text-green-600"><span>Points discount</span><span>−AED {pointsDiscount.toFixed(2)}</span></div>}

                  <div className="flex justify-between items-baseline pt-4 border-t border-[#e5e5ea]">
                    <span className="text-[15px] font-semibold text-[#111114]">Total</span>
                    <p className="text-[22px] font-bold text-[#111114] tabular-nums">AED {total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Trust */}
                <div className="pt-4 border-t border-[#e5e5ea] space-y-2.5">
                  {[
                    { Icon: Lock,        text: 'Secured transaction',  color: 'text-green-500' },
                    { Icon: ShieldCheck, text: 'Authentic products',   color: 'text-blue-400'  },
                    { Icon: RotateCcw,   text: '30-day returns',       color: 'text-[#9869f7]' },
                  ].map(({ Icon, text, color }) => (
                    <div key={text} className="flex items-center gap-2.5 text-[12px] text-[#5a5a64]">
                      <Icon size={12} className={color} /> {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white border-t border-[#e5e5ea] p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(s => s - 1)}
            disabled={currentStep === 1}
            className="w-12 h-12 rounded-full flex items-center justify-center border border-[#e5e5ea] text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors disabled:opacity-0"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => currentStep < 3 ? handleNextStep() : handlePlaceOrder()}
            disabled={isPlacingOrder || isTabbyLoading || hasStockIssues}
            className="flex-1 h-12 rounded-full text-[13px] font-semibold tracking-[0.1em] uppercase text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
          >
            {btnLabel}
          </button>
        </div>
      </div>

      {/* Address modal */}
      <Modal isOpen={isAddressModalOpen} onClose={closeAddressModal} title={editingAddress ? 'Edit address' : 'New address'} size="max-w-3xl">
        <AddressInputForm initialData={editingAddress} onSave={handleCheckoutAddressSave} onCancel={closeAddressModal} />
      </Modal>
    </div>
  );
}
