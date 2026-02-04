"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { ArrowLeft, CreditCard, Truck, MapPin, Lock, Check, Gift, Tag, Info, Trash2, Pencil, Star, Sparkles, ChevronRight, RotateCcw, ShieldCheck, Loader2 } from 'lucide-react';
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
  const [couponCode, setCouponCode] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [paymentAuthorized, setPaymentAuthorization] = useState(false);
  const [authorizedPaymentIntentId, setAuthorizedPaymentIntentId] = useState(null);

  const [formData, setFormData] = useState({
    paymentMethod: 'cashOnDelivery',
    giftWrap: false,
    giftMessage: '',
    newsletter: false
  });

  const hasStockIssues = cartItems.some(item => item.stock_quantity === 0 || item.quantity > item.stock_quantity);
  const shipping = subtotal > 200 ? 0 : 30;
  const tax = subtotal * 0.05;
  const giftWrapFee = formData.giftWrap ? 100 : 0;
  const pointsDiscount = usePoints ? Math.floor(loyaltyPoints / 100) * 5 : 0;
  const total = Math.max(0, finalTotal + shipping + tax + giftWrapFee - pointsDiscount);

  const fetchShippingAddresses = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const response = await fetchWithAuth(`/api/users/${user.id}/addresses`);
      const data = await response.json();
      setShippingAddresses(data);
      if (data.length > 0 && !selectedShippingAddressId) {
        const defaultAddress = data.find(addr => addr.isDefault);
        setSelectedAddressId(defaultAddress ? defaultAddress.id : data[0].id);
      }
    } catch (error) {
      console.error("Error fetching shipping addresses:", error);
    }
  }, [user, selectedShippingAddressId, fetchWithAuth]);

  useEffect(() => {
    if (user) {
      fetchShippingAddresses();
      fetchWithAuth(`/api/users/${user.id}/loyalty`)
        .then(res => res.json())
        .then(data => setLoyaltyPoints(data.stats?.points || 0))
        .catch(err => console.error('Failed to fetch points:', err));
    }
  }, [user, fetchShippingAddresses, fetchWithAuth]);

  useEffect(() => {
    setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY));
  }, []);

  useEffect(() => {
    if (formData.paymentMethod === 'card' && total > 0) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: 'aed' }),
      })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch(error => console.error('Payment intent error:', error));
    }
  }, [formData.paymentMethod, total]);

  useEffect(() => {
    setSelectedShippingAddressId(selectedAddressId);
  }, [selectedAddressId, setSelectedShippingAddressId]);

  const openAddressModal = (address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(false);
  };

  const handleCheckoutAddressSave = async (addressData) => {
    if (!user) return;
    const method = editingAddress ? 'PUT' : 'POST';
    const endpoint = editingAddress
      ? `/api/users/${user.id}/addresses/${editingAddress.id}`
      : `/api/users/${user.id}/addresses`;

    try {
      const payload = {
        ...addressData,
        address_line2: addressData.apartment,
        customer_email: user.email,
        address_label: addressData.addressLine1,
      };
      await fetchWithAuth(endpoint, { method, body: JSON.stringify(payload) });
      closeAddressModal();
      fetchShippingAddresses();
      toast.success(`Address ${editingAddress ? 'updated' : 'saved'} successfully!`);
    } catch (error) {
      toast.error('An error occurred while saving the address.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await fetchWithAuth(`/api/users/${user.id}/addresses/${addressId}`, { method: 'DELETE' });
      fetchShippingAddresses();
      if (selectedAddressId === addressId) setSelectedAddressId(null);
    } catch (error) {
      toast.error('Error deleting address.');
    }
  };

  const steps = [
    { id: 1, title: 'Shipping', icon: Truck },
    { id: 2, title: 'Payment', icon: CreditCard },
    { id: 3, title: 'Review', icon: Check }
  ];

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedAddressId) {
      toast.error('Please select a shipping address.');
      return;
    }
    if (currentStep === 2 && formData.paymentMethod === 'card' && !paymentAuthorized) {
        toast.error('Please complete the secure card authorization below before reviewing your order.');
        return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAuthorizedCardPayment = (paymentIntentId) => {
    setAuthorizedPaymentIntentId(paymentIntentId);
    setPaymentAuthorization(true);
    setCurrentStep(3);
    toast.success('Payment Authorized Successfully');
  };

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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
      items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
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
      const response = await fetchWithAuth('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
      const result = await response.json();
      toast.success('Order Placed Successfully!');
      clearCart();
      router.push(`/orders/${result.orderId}`);
    } catch (error) {
      toast.error('Error placing order.');
      setIsPlacingOrder(false);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCoupon(couponCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900 pb-24 lg:pb-0">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-pink/[0.03] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/[0.02] rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/cart')} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-[13px] font-medium tracking-tight group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Return to Cart
            </button>
            <div className="text-center">
              <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 uppercase tracking-[0.2em]">Acquisition</h1>
              <p className="text-[11px] text-gray-400 font-medium tracking-tight">Step {currentStep} of 3</p>
            </div>
            <div className="w-[120px] hidden sm:block"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-6 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            <div className="bg-white/60 backdrop-blur-md rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 border border-gray-100 shadow-sm overflow-hidden text-center">
              <div className="flex items-center justify-between max-w-2xl mx-auto relative">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 relative z-10">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      currentStep >= step.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-300'
                    }`}>
                      <step.icon size={14} className="lg:hidden" />
                      <step.icon size={18} className="hidden lg:block" strokeWidth={currentStep === step.id ? 2.5 : 1.5} />
                    </div>
                    <span className={`text-[10px] lg:text-[12px] font-semibold tracking-tight transition-colors ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`hidden lg:block w-8 lg:w-16 h-px mx-2 ${currentStep > step.id ? 'bg-brand-pink/40' : 'bg-gray-100'}`} />
                    )}
                  </div>
                ))}
                <div className="absolute top-4 left-4 right-4 h-[1px] bg-gray-100 lg:hidden -z-0">
                    <motion.div 
                        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        className="h-full bg-brand-pink/40"
                    />
                </div>
              </div>
            </div>

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm p-6 lg:p-12 min-h-[400px] lg:min-h-[500px] flex flex-col"
            >
              {currentStep === 1 && (
                <div className="space-y-8 flex-grow">
                  <div className="space-y-1">
                    <h2 className="text-2xl lg:text-3xl font-serif italic text-gray-900 leading-tight">Destination</h2>
                    <p className="text-[12px] lg:text-[13px] text-gray-400 font-normal">Where should your selection be delivered?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {shippingAddresses.map((address) => (
                      <motion.div
                        layout
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`relative p-5 lg:p-6 cursor-pointer rounded-2xl lg:rounded-[2rem] border transition-all duration-500 group ${
                          selectedAddressId === address.id 
                          ? 'border-brand-pink bg-brand-pink/[0.02] shadow-lg lg:shadow-xl shadow-brand-pink/5' 
                          : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                        }`}
                      >
                        {selectedAddressId === address.id && (
                          <div className="absolute top-4 right-4 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-brand-pink text-white flex items-center justify-center shadow-lg">
                            <Check size={12} strokeWidth={3} className="lg:hidden" />
                            <Check size={14} strokeWidth={3} className="hidden lg:block" />
                          </div>
                        )}
                        <div className="space-y-3 lg:space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[14px] lg:text-[15px] font-semibold text-gray-900 tracking-tight text-left">
                              {address.customerName || user?.name}
                            </h3>
                            {address.isDefault && <Badge className="bg-gray-900 text-white text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 border-none">Default</Badge>}
                          </div>
                          <div className="text-[12px] lg:text-[13px] text-gray-500 leading-relaxed font-normal space-y-1 text-left">
                            <p className="truncate">{address.shipping_address || address.addressLine1}</p>
                            <p className="text-gray-400 text-[10px] lg:text-[11px] font-medium tracking-tight pt-1 flex items-center gap-2">
                                <MapPin size={10} /> {address.city}, {address.country}
                            </p>
                          </div>
                          <div className="pt-1 flex items-center gap-4 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); openAddressModal(address); }} className="text-[10px] lg:text-[11px] font-semibold text-gray-400 hover:text-gray-900 flex items-center gap-1.5 py-1">
                                <Pencil size={10} /> Edit
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(address.id); }} className="text-[10px] lg:text-[11px] font-semibold text-gray-400 hover:text-red-500 flex items-center gap-1.5 py-1">
                                <Trash2 size={10} /> Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <button 
                        onClick={() => openAddressModal(null)}
                        className="h-full min-h-[140px] rounded-2xl lg:rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3 text-gray-300 hover:border-brand-pink/30 hover:text-brand-pink transition-all group p-6 text-center"
                    >
                        <FaPlus className="text-lg lg:text-base" />
                        <span className="text-[11px] lg:text-[12px] font-semibold tracking-tight uppercase tracking-widest">New Address</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8 lg:space-y-10 flex-grow">
                  <div className="space-y-1">
                    <h2 className="text-2xl lg:text-3xl font-serif italic text-gray-900 leading-tight text-left">Payment</h2>
                    <p className="text-[12px] lg:text-[13px] text-gray-400 font-normal text-left">Secure your acquisition with your preferred method.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:gap-4">
                    {[
                        { id: 'card', title: 'Secured Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, American Express' },
                        { id: 'cashOnDelivery', title: 'Boutique Concierge COD', icon: Truck, desc: 'Payment upon delivery' }
                    ].map((method) => (
                        <div
                            key={method.id}
                            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                            className={`p-5 lg:p-6 rounded-2xl lg:rounded-[2rem] border transition-all duration-500 cursor-pointer flex items-center justify-between group overflow-hidden relative ${
                                formData.paymentMethod === method.id 
                                ? 'border-gray-900 bg-gray-900 text-white shadow-xl' 
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <div className="flex items-center gap-4 lg:gap-6 relative z-10 text-left">
                                <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors ${
                                    formData.paymentMethod === method.id ? 'bg-white/10 text-white' : 'bg-gray-50 text-gray-400'
                                }`}>
                                    <method.icon size={20} strokeWidth={1.5} className="lg:hidden" />
                                    <method.icon size={24} strokeWidth={1.5} className="hidden lg:block" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] lg:text-[16px] font-semibold tracking-tight leading-none">{method.title}</h3>
                                    <p className={`text-[10px] lg:text-[11px] font-medium mt-1 lg:mt-1.5 uppercase tracking-widest ${formData.paymentMethod === method.id ? 'text-white/60' : 'text-gray-400'}`}>{method.desc}</p>
                                </div>
                            </div>
                            <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                formData.paymentMethod === method.id ? 'border-white bg-white text-gray-900' : 'border-gray-100'
                            }`}>
                                {formData.paymentMethod === method.id && (
                                    <>
                                        <Check size={12} strokeWidth={4} className="lg:hidden" />
                                        <Check size={14} strokeWidth={4} className="hidden lg:block" />
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {formData.paymentMethod === 'card' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-6"
                        >
                            <div className="p-6 lg:p-10 bg-[#0a0a0a] rounded-3xl lg:rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] lg:bg-[size:40px_40px] opacity-20"></div>
                                <div className="relative z-10 space-y-6 lg:space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1 text-left">
                                            <h3 className="text-lg lg:text-xl font-serif italic text-white leading-none">Payment Vault</h3>
                                            <p className="text-[8px] lg:text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Encrypted Selection</p>
                                        </div>
                                        <div className="flex gap-1.5 lg:gap-2 opacity-40">
                                            <ShieldCheck size={16} />
                                            <Lock size={16} />
                                        </div>
                                    </div>

                                    <div className="bg-[#F5F5F7] rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 text-gray-900 shadow-inner">
                                        {clientSecret && stripePromise ? (
                                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                                <CheckoutForm onSuccessfulPayment={handleAuthorizedCardPayment} buttonLabel="Authorize & Review" />
                                            </Elements>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 lg:py-10 gap-4 text-center">
                                                <Loader2 className="animate-spin text-gray-400 size-6" />
                                                <p className="text-[10px] lg:text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Initializing Secure<br/>Gateways...</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-white/30 text-center italic">Professional-grade security protocols active.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-6 lg:p-8 bg-white rounded-2xl lg:rounded-[2rem] border border-gray-100 space-y-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id="giftWrap"
                        checked={formData.giftWrap}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, giftWrap: checked }))}
                        className="rounded-full w-5 h-5"
                      />
                      <Label htmlFor="giftWrap" className="flex items-center gap-3 text-gray-700 cursor-pointer group text-left">
                        <div className="w-10 h-10 rounded-xl bg-brand-rose flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform shadow-sm">
                            <Gift className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] lg:text-[14px] font-semibold text-gray-900 leading-none mb-1">Gift Wrap Selection</span>
                            <span className="text-[10px] lg:text-[11px] text-gray-400 font-medium">+100 AED · Naya Signature</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8 flex-grow">
                  <div className="space-y-1">
                    <h2 className="text-2xl lg:text-3xl font-serif italic text-gray-900 leading-tight text-left">Review</h2>
                    <p className="text-[12px] lg:text-[13px] text-gray-400 font-normal text-left">Final inspection of your bespoke ritual selection.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                    <div className="p-6 lg:p-8 bg-gray-50/50 rounded-2xl lg:rounded-3xl border border-gray-100 space-y-4 text-left">
                        <div className="flex items-center gap-3 text-gray-400">
                            <MapPin size={14} className="lg:hidden" />
                            <MapPin size={16} className="hidden lg:block" />
                            <h3 className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em]">Shipping Address</h3>
                        </div>
                        {(() => {
                            const addr = shippingAddresses.find(a => a.id === selectedAddressId);
                            return addr ? (
                                <div className="text-[13px] lg:text-[14px] text-gray-700 leading-relaxed font-normal">
                                    <p className="font-semibold text-gray-900">{addr.customerName || user?.name}</p>
                                    <p className="truncate">{addr.shipping_address || addr.addressLine1}</p>
                                    <p>{addr.city}, {addr.country}</p>
                                </div>
                            ) : null;
                        })()}
                    </div>

                    <div className="p-6 lg:p-8 bg-gray-50/50 rounded-2xl lg:rounded-3xl border border-gray-100 space-y-4 text-left">
                        <div className="flex items-center gap-3 text-gray-400">
                            <CreditCard size={14} className="lg:hidden" />
                            <CreditCard size={16} className="hidden lg:block" />
                            <h3 className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em]">Payment</h3>
                        </div>
                        <p className="text-[13px] lg:text-[14px] font-semibold text-gray-900 uppercase tracking-widest">
                            {formData.paymentMethod === 'card' ? 'Authorized Card' : 'Cash on Delivery'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <ShieldCheck size={12} className="text-green-500" /> Secure Protocol
                        </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="hidden lg:flex items-center justify-between mt-12 pt-8 border-t border-gray-50">
                <button onClick={handlePreviousStep} disabled={currentStep === 1} className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-0">
                  Back
                </button>
                <Button 
                    onClick={() => currentStep < 3 ? handleNextStep() : handlePlaceOrder()} 
                    className="bg-gray-900 text-white hover:bg-brand-pink px-12 h-14 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-xl transition-all disabled:opacity-50"
                    disabled={isPlacingOrder || hasStockIssues}
                >
                    {isPlacingOrder ? 'Processing...' : currentStep === 3 ? 'Finalize Acquisition' : formData.paymentMethod === 'card' && currentStep === 2 ? 'Complete Authorization' : 'Continue'}
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32 space-y-6">
              <div className="bg-white rounded-3xl lg:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 lg:mb-8">
                    <h3 className="text-[16px] lg:text-lg font-semibold tracking-tight text-gray-900 text-left">Summary</h3>
                    <Sparkles size={16} className="text-brand-pink/20" />
                </div>

                <div className="max-h-[200px] lg:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6 lg:mb-8 space-y-4 lg:space-y-6 text-left">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-gray-50 border border-gray-100 p-2 overflow-hidden flex-shrink-0">
                        <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="min-w-0 flex-1 py-0.5 text-left">
                        <h4 className="text-[12px] lg:text-[13px] font-medium text-gray-900 truncate tracking-tight">{item.name}</h4>
                        <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] text-gray-400 font-medium">Qty: {item.quantity}</p>
                            <p className="text-[11px] lg:text-[12px] font-semibold text-gray-900 tracking-tight">AED {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-[13px] lg:text-[14px] font-medium text-gray-500 mb-6 lg:mb-8 px-1 text-left">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-gray-900 font-semibold text-right">AED {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600 font-semibold text-right' : 'text-gray-900 font-semibold text-right'}>{shipping === 0 ? 'Complimentary' : `AED ${shipping.toFixed(2)}`}</span></div>
                  <div className="flex justify-between"><span>Tax (5%)</span><span className="text-gray-900 font-semibold text-right">AED {tax.toFixed(2)}</span></div>
                  <div className="pt-4 border-t border-gray-100 mt-4 flex justify-between items-baseline">
                    <span className="text-gray-900 font-semibold">Total</span>
                    <div className="text-right">
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tighter tabular-nums">AED {total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50 px-1 hidden lg:block text-left">
                    {[
                        { icon: Lock, text: "Secured Transaction", color: "text-green-600" },
                        { icon: ShieldCheck, text: "Authentic Selection", color: "text-blue-500" }
                    ].map((feat, i) => (
                        <div key={feat.text} className="flex items-center gap-3 text-[10px] font-medium text-gray-400">
                            <feat.icon size={12} className={feat.color} />
                            {feat.text}
                        </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-t border-gray-100 p-4 lg:hidden safe-area-bottom">
        <div className="flex items-center gap-4">
            <button onClick={handlePreviousStep} disabled={currentStep === 1 || isPlacingOrder} className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-0 transition-all active:bg-gray-50">
                <ArrowLeft size={18} />
            </button>
            <Button onClick={() => currentStep < 3 ? handleNextStep() : handlePlaceOrder()} className="flex-1 bg-gray-900 text-white h-14 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 disabled:opacity-50" disabled={isPlacingOrder || hasStockIssues || (currentStep === 1 && !selectedAddressId) || (currentStep === 2 && formData.paymentMethod === 'card' && !paymentAuthorized)}>
                {isPlacingOrder ? 'Processing...' : currentStep === 3 ? `Finalize · AED ${total.toFixed(2)}` : formData.paymentMethod === 'card' && currentStep === 2 ? 'Authorize Card' : 'Continue'}
            </Button>
        </div>
      </div>

      <Modal isOpen={isAddressModalOpen} onClose={closeAddressModal} title="">
        <div className="p-4">
            <AddressInputForm initialData={editingAddress} onSave={handleCheckoutAddressSave} onCancel={closeAddressModal} />
        </div>
      </Modal>
    </div>
  );
}