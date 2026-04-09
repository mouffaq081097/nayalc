"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
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

const Modal = dynamic(() => import('../components/Modal'), { ssr: false });
const AddressInputForm = dynamic(() => import('../components/AddressInputForm'), { ssr: false });

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 24px rgba(147,51,234,0.07)',
};

const lavGradient = 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))';

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal, appliedCoupon, discountAmount, finalTotal, applyCoupon, removeCoupon, selectedShippingAddressId, setSelectedShippingAddressId, couponError } = useCart();
  const { user, logout } = useAuth();
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

  const hasStockIssues = cartItems.some(item => item.stock_quantity === 0 || item.quantity > item.stock_quantity);
  const shipping = subtotal > 200 ? 0 : 30;
  const tax = subtotal * 0.05;
  const giftWrapFee = formData.giftWrap ? 100 : 0;
  const pointsDiscount = usePoints ? Math.floor(loyaltyPoints / 100) * 5 : 0;
  const total = Math.max(0, finalTotal + shipping + tax + giftWrapFee - pointsDiscount);

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
        .then(d => setLoyaltyPoints(d.stats?.points || 0))
        .catch(() => {});
    }
  }, [user, fetchShippingAddresses, fetchWithAuth]);

  useEffect(() => { setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)); }, []);

  useEffect(() => {
    if (formData.paymentMethod === 'card' && total > 0) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: 'aed' }),
      }).then(r => r.json()).then(d => setClientSecret(d.clientSecret)).catch(() => {});
    }
  }, [formData.paymentMethod, total]);

  useEffect(() => { setSelectedShippingAddressId(selectedAddressId); }, [selectedAddressId, setSelectedShippingAddressId]);

  const openAddressModal = (addr) => { setEditingAddress(addr); setIsAddressModalOpen(true); };
  const closeAddressModal = () => { setEditingAddress(null); setIsAddressModalOpen(false); };

  const handleCheckoutAddressSave = async (addressData) => {
    if (!user) return;
    const method = editingAddress ? 'PUT' : 'POST';
    const endpoint = editingAddress
      ? `/api/users/${user.id}/addresses/${editingAddress.id}`
      : `/api/users/${user.id}/addresses`;
    try {
      await fetchWithAuth(endpoint, {
        method,
        body: JSON.stringify({
          address_line1: addressData.addressLine1,
          address_line2: addressData.apartment || addressData.addressLine2,
          city: addressData.city, zip_code: addressData.zipCode || '0000',
          country: addressData.country || 'United Arab Emirates',
          state: addressData.state || '',
          customer_phone: addressData.customerPhone,
          customer_email: user.email,
          address_label: addressData.addressLabel || addressData.addressLine1,
          is_default: addressData.isDefault || false,
          latitude: addressData.latitude, longitude: addressData.longitude,
        }),
      });
      closeAddressModal();
      fetchShippingAddresses();
      toast.success(`Address ${editingAddress ? 'updated' : 'saved'}!`);
    } catch { toast.error('Error saving address.'); }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await fetchWithAuth(`/api/users/${user.id}/addresses/${id}`, { method: 'DELETE' });
      fetchShippingAddresses();
      if (selectedAddressId === id) setSelectedAddressId(null);
    } catch { toast.error('Error deleting address.'); }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedAddressId) { toast.error('Please select a shipping address.'); return; }
    if (currentStep === 2 && formData.paymentMethod === 'card' && !paymentAuthorized) { toast.error('Please complete card authorization.'); return; }
    if (currentStep < 3) setCurrentStep(s => s + 1);
  };

  const handleAuthorizedCardPayment = (piId) => {
    setAuthorizedPaymentIntentId(piId);
    setPaymentAuthorization(true);
    setCurrentStep(3);
    toast.success('Payment Authorized!');
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
      toast.success('Order Placed!');
      clearCart();
      router.push(`/orders/${result.orderId}`);
    } catch { toast.error('Error placing order.'); setIsPlacingOrder(false); }
  };

  const steps = [
    { id: 1, label: 'Shipping', Icon: Truck },
    { id: 2, label: 'Payment', Icon: CreditCard },
    { id: 3, label: 'Review',   Icon: Check },
  ];

  const btnLabel = isPlacingOrder ? 'Processing…'
    : currentStep === 3 ? `Finalize · AED ${total.toFixed(2)}`
    : formData.paymentMethod === 'card' && currentStep === 2 ? 'Authorize Card'
    : 'Continue';

  return (
    <div className="min-h-screen pb-28 lg:pb-12" style={{ background: '#fdf8ff' }}>
      {/* Auras */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full blur-[120px]" style={{ background: 'rgba(196,167,254,0.15)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: 'rgba(216,180,254,0.1)' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl" style={{ background: 'rgba(253,248,255,0.88)', borderBottom: '1px solid rgba(216,180,254,0.25)' }}>
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/cart')} className="flex items-center gap-2 text-[13px] font-semibold transition-all group" style={{ color: 'rgba(59,7,100,0.55)' }}>
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Return to Cart
          </button>
          <div className="text-center">
            <h1 className="text-[16px] font-bold tracking-tight" style={{ color: '#3b0764' }}>Checkout</h1>
            <p className="text-[11px] font-medium" style={{ color: 'rgba(59,7,100,0.4)' }}>Step {currentStep} of 3</p>
          </div>
          <div className="w-[120px] hidden sm:block" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Step progress */}
            <div className="rounded-2xl p-5 overflow-hidden" style={glass}>
              <div className="flex items-center justify-between max-w-sm mx-auto relative">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center gap-1.5 relative z-10">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500"
                      style={currentStep >= step.id
                        ? { background: lavGradient, color: '#fff', boxShadow: '0 4px 16px rgba(147,51,234,0.25)' }
                        : { background: 'rgba(196,167,254,0.15)', color: 'rgba(196,167,254,0.5)' }}
                    >
                      <step.Icon size={15} strokeWidth={currentStep === step.id ? 2.5 : 1.5} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: currentStep >= step.id ? '#3b0764' : 'rgba(59,7,100,0.3)' }}>
                      {step.label}
                    </span>
                    {idx < steps.length - 1 && (
                      <div className="absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-4 h-px" style={{ background: currentStep > step.id ? 'rgba(196,167,254,0.6)' : 'rgba(216,180,254,0.25)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl p-6 lg:p-10 min-h-[420px] flex flex-col"
                style={glass}
              >

                {/* Step 1 — Shipping */}
                {currentStep === 1 && (
                  <div className="space-y-7 flex-grow">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#3b0764' }}>Destination</h2>
                      <p className="text-[13px] mt-1" style={{ color: 'rgba(59,7,100,0.45)' }}>Where should your selection be delivered?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shippingAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <motion.div
                            layout
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className="relative p-5 cursor-pointer rounded-2xl transition-all duration-400 group"
                            style={isSelected
                              ? { border: '1.5px solid rgba(196,167,254,0.7)', background: 'rgba(196,167,254,0.1)', boxShadow: '0 4px 20px rgba(147,51,234,0.12)' }
                              : { border: '1px solid rgba(216,180,254,0.3)', background: 'rgba(255,255,255,0.5)' }}
                          >
                            {isSelected && (
                              <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: lavGradient }}>
                                <Check size={11} strokeWidth={3} color="#fff" />
                              </div>
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-[14px] font-bold tracking-tight" style={{ color: '#3b0764' }}>
                                  {addr.addressLabel || addr.customerName || user?.name}
                                </h3>
                                {addr.isDefault && (
                                  <span className="text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full text-white" style={{ background: lavGradient }}>Primary</span>
                                )}
                              </div>
                              <div className="text-[12px] leading-relaxed space-y-0.5" style={{ color: 'rgba(59,7,100,0.55)' }}>
                                <p className="truncate">{addr.shipping_address || addr.addressLine1}</p>
                                <p className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(59,7,100,0.4)' }}>
                                  <MapPin size={10} /> {addr.city}, {addr.country}
                                </p>
                              </div>
                              <div className="pt-1.5 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); openAddressModal(addr); }} className="text-[10px] font-semibold flex items-center gap-1" style={{ color: 'rgb(126,105,230)' }}>
                                  <Pencil size={10} /> Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }} className="text-[10px] font-semibold flex items-center gap-1 text-red-400 hover:text-red-600">
                                  <Trash2 size={10} /> Remove
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Add address */}
                      <button
                        onClick={() => openAddressModal(null)}
                        className="min-h-[130px] rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all"
                        style={{ border: '1.5px dashed rgba(216,180,254,0.4)', color: 'rgba(196,167,254,0.7)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,167,254,0.7)'; e.currentTarget.style.color = 'rgb(126,105,230)'; e.currentTarget.style.background = 'rgba(196,167,254,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(216,180,254,0.4)'; e.currentTarget.style.color = 'rgba(196,167,254,0.7)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <FaPlus size={14} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">New Address</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 — Payment */}
                {currentStep === 2 && (
                  <div className="space-y-7 flex-grow">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#3b0764' }}>Payment</h2>
                      <p className="text-[13px] mt-1" style={{ color: 'rgba(59,7,100,0.45)' }}>Secure your acquisition with your preferred method.</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { id: 'card',          label: 'Credit Card',        Icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
                        { id: 'cashOnDelivery', label: 'Cash on Delivery',   Icon: Truck,      desc: 'Payment upon delivery' },
                      ].map(({ id, label, Icon, desc }) => {
                        const sel = formData.paymentMethod === id;
                        return (
                          <div
                            key={id}
                            onClick={() => setFormData(p => ({ ...p, paymentMethod: id }))}
                            className="flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-400"
                            style={sel
                              ? { border: '1.5px solid rgba(196,167,254,0.7)', background: 'rgba(196,167,254,0.1)', boxShadow: '0 4px 20px rgba(147,51,234,0.1)' }
                              : { border: '1px solid rgba(216,180,254,0.3)', background: 'rgba(255,255,255,0.5)' }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: sel ? 'rgba(196,167,254,0.2)' : 'rgba(196,167,254,0.1)', color: 'rgb(126,105,230)' }}>
                                <Icon size={20} strokeWidth={1.5} />
                              </div>
                              <div>
                                <p className="text-[14px] font-bold" style={{ color: '#3b0764' }}>{label}</p>
                                <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: 'rgba(59,7,100,0.4)' }}>{desc}</p>
                              </div>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all" style={sel ? { borderColor: 'rgb(126,105,230)', background: lavGradient } : { borderColor: 'rgba(216,180,254,0.5)' }}>
                              {sel && <Check size={11} strokeWidth={3} color="#fff" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stripe card form */}
                    <AnimatePresence mode="wait">
                      {formData.paymentMethod === 'card' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                          <div className="rounded-3xl p-6 lg:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4c1d95, #7e22ce, #9333ea)', boxShadow: '0 12px 40px rgba(147,51,234,0.3)' }}>
                            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[70px]" style={{ background: 'rgba(249,168,212,0.2)' }} />
                            <div className="relative z-10 space-y-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-bold text-white">Secure Payment</h3>
                                  <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold mt-0.5">Encrypted</p>
                                </div>
                                <div className="flex gap-2 opacity-50">
                                  <ShieldCheck size={16} color="#fff" />
                                  <Lock size={16} color="#fff" />
                                </div>
                              </div>
                              <div className="rounded-2xl p-5 lg:p-7" style={{ background: 'rgba(248,240,255,0.95)' }}>
                                {clientSecret && stripePromise ? (
                                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <CheckoutForm onSuccessfulPayment={handleAuthorizedCardPayment} buttonLabel="Authorize & Review" amount={Math.round(total * 100)} clientSecret={clientSecret} />
                                  </Elements>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                                    <Loader2 className="animate-spin" size={24} style={{ color: 'rgb(126,105,230)' }} />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(59,7,100,0.4)' }}>Initializing secure gateway…</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Gift wrap */}
                    <div className="rounded-2xl p-5" style={{ border: '1px solid rgba(216,180,254,0.3)', background: 'rgba(248,240,255,0.6)' }}>
                      <label className="flex items-center gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.giftWrap}
                          onChange={e => setFormData(p => ({ ...p, giftWrap: e.target.checked }))}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: 'rgb(126,105,230)' }}
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                            <Gift size={16} strokeWidth={1.75} />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold" style={{ color: '#3b0764' }}>Gift Wrap Selection</p>
                            <p className="text-[11px]" style={{ color: 'rgba(59,7,100,0.45)' }}>+AED 100 · Naya Signature Packaging</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3 — Review */}
                {currentStep === 3 && (
                  <div className="space-y-6 flex-grow">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#3b0764' }}>Review</h2>
                      <p className="text-[13px] mt-1" style={{ color: 'rgba(59,7,100,0.45)' }}>Final check before we finalize your order.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Shipping */}
                      <div className="rounded-2xl p-5 space-y-3" style={{ border: '1px solid rgba(216,180,254,0.3)', background: 'rgba(248,240,255,0.6)' }}>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} style={{ color: 'rgb(196,167,254)' }} />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'rgba(59,7,100,0.45)' }}>Shipping Address</h3>
                        </div>
                        {(() => {
                          const addr = shippingAddresses.find(a => a.id === selectedAddressId);
                          return addr ? (
                            <div className="text-[13px] leading-relaxed space-y-0.5">
                              <p className="font-bold" style={{ color: '#3b0764' }}>{addr.customerName || user?.name}</p>
                              <p style={{ color: 'rgba(59,7,100,0.55)' }}>{addr.shipping_address || addr.addressLine1}</p>
                              <p style={{ color: 'rgba(59,7,100,0.45)' }}>{addr.city}, {addr.country}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Payment */}
                      <div className="rounded-2xl p-5 space-y-3" style={{ border: '1px solid rgba(216,180,254,0.3)', background: 'rgba(248,240,255,0.6)' }}>
                        <div className="flex items-center gap-2">
                          <CreditCard size={13} style={{ color: 'rgb(196,167,254)' }} />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'rgba(59,7,100,0.45)' }}>Payment</h3>
                        </div>
                        <p className="text-[13px] font-bold" style={{ color: '#3b0764' }}>
                          {formData.paymentMethod === 'card' ? 'Authorized Credit Card' : 'Cash on Delivery'}
                        </p>
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(59,7,100,0.4)' }}>
                          <ShieldCheck size={12} className="text-green-500" /> Secure Protocol Active
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop navigation */}
                <div className="hidden lg:flex items-center justify-between mt-10 pt-7" style={{ borderTop: '1px solid rgba(216,180,254,0.2)' }}>
                  <button
                    onClick={() => currentStep > 1 && setCurrentStep(s => s - 1)}
                    disabled={currentStep === 1}
                    className="text-[13px] font-semibold transition-colors disabled:opacity-0"
                    style={{ color: 'rgba(59,7,100,0.5)' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => currentStep < 3 ? handleNextStep() : handlePlaceOrder()}
                    disabled={isPlacingOrder || hasStockIssues}
                    className="px-12 py-4 rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: lavGradient, boxShadow: '0 8px 32px rgba(147,51,234,0.25)' }}
                  >
                    {btnLabel}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="rounded-3xl p-6" style={glass}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-bold tracking-tight" style={{ color: '#3b0764' }}>Summary</h3>
                  <Sparkles size={15} strokeWidth={1.5} style={{ color: 'rgba(196,167,254,0.6)' }} />
                </div>

                {/* Items */}
                <div className="max-h-[220px] overflow-y-auto pr-1 no-scrollbar mb-6 space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-3 group">
                      <div className="w-13 h-13 rounded-xl overflow-hidden flex-shrink-0 p-1.5" style={{ background: 'rgba(248,240,255,0.8)', border: '1px solid rgba(216,180,254,0.25)', width: 48, height: 48 }}>
                        <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate" style={{ color: '#3b0764' }}>{item.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[10px]" style={{ color: 'rgba(59,7,100,0.4)' }}>Qty: {item.quantity}</p>
                          <p className="text-[12px] font-bold" style={{ color: '#3b0764' }}>AED {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Breakdown */}
                <div className="space-y-2.5 text-[13px] mb-6">
                  <div className="flex justify-between" style={{ color: 'rgba(59,7,100,0.55)' }}>
                    <span>Subtotal</span><span className="font-semibold" style={{ color: '#3b0764' }}>AED {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'rgba(59,7,100,0.55)' }}>
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'} style={shipping !== 0 ? { color: '#3b0764' } : {}}>
                      {shipping === 0 ? 'Free' : `AED ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'rgba(59,7,100,0.55)' }}>
                    <span>Tax (5%)</span><span className="font-semibold" style={{ color: '#3b0764' }}>AED {tax.toFixed(2)}</span>
                  </div>
                  {giftWrapFee > 0 && (
                    <div className="flex justify-between" style={{ color: 'rgba(59,7,100,0.55)' }}>
                      <span>Gift Wrap</span><span className="font-semibold" style={{ color: '#3b0764' }}>AED {giftWrapFee.toFixed(2)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Discount</span><span>−AED {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-4" style={{ borderTop: '1px solid rgba(216,180,254,0.25)' }}>
                    <span className="text-[15px] font-bold" style={{ color: '#3b0764' }}>Total</span>
                    <p className="text-2xl font-black tabular-nums" style={{ color: '#3b0764' }}>AED {total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Trust */}
                <div className="pt-5 space-y-3" style={{ borderTop: '1px solid rgba(216,180,254,0.2)' }}>
                  {[
                    { Icon: Lock,       text: 'Secured Transaction',  color: 'text-green-500' },
                    { Icon: ShieldCheck, text: 'Authentic Selection',  color: 'text-blue-400' },
                    { Icon: RotateCcw,  text: '30-day Returns',        color: 'text-purple-400' },
                  ].map(({ Icon, text, color }) => (
                    <div key={text} className="flex items-center gap-2.5 text-[11px]" style={{ color: 'rgba(59,7,100,0.45)' }}>
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
      <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden backdrop-blur-2xl p-4" style={{ background: 'rgba(253,248,255,0.92)', borderTop: '1px solid rgba(216,180,254,0.3)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(s => s - 1)}
            disabled={currentStep === 1}
            className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-0 transition-all"
            style={{ border: '1px solid rgba(216,180,254,0.45)', color: 'rgb(126,105,230)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => currentStep < 3 ? handleNextStep() : handlePlaceOrder()}
            disabled={isPlacingOrder || hasStockIssues}
            className="flex-1 h-14 rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: lavGradient, boxShadow: '0 8px 32px rgba(147,51,234,0.25)' }}
          >
            {btnLabel}
          </button>
        </div>
      </div>

      {/* Address modal */}
      <Modal isOpen={isAddressModalOpen} onClose={closeAddressModal} title={editingAddress ? 'Edit Address' : 'New Address'} size="max-w-3xl">
        <AddressInputForm initialData={editingAddress} onSave={handleCheckoutAddressSave} onCancel={closeAddressModal} />
      </Modal>
    </div>
  );
}
