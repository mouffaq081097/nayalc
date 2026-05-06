'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Mail, ArrowRight, MapPin, CreditCard, Calendar, Sparkles, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { formatPrice } from '@/app/lib/utils';
import { useState } from 'react';

// --- Premium Reusable Components ---

function LuxeSectionTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] md:text-[11px] font-black capitalize tracking-wide text-[rgb(147,104,236)] mb-1">
        {subtitle}
      </h3>
      <h2 className="text-2xl md:text-3xl font-serif text-[#3b0764] leading-tight">
        {title}
      </h2>
    </div>
  );
}

function DossierRow({ label, value, isTotal = false }) {
  return (
    <div className={`flex justify-between items-end gap-4 py-2.5 ${isTotal ? 'border-t border-[rgba(147,51,234,0.15)] mt-2 pt-4' : ''}`}>
      <span className={`text-sm ${isTotal ? 'font-bold text-[#3b0764]' : 'text-[#6b21a8]/70'}`}>
        {label}
      </span>
      <span className={`text-sm text-right break-words min-w-0 ${isTotal ? 'font-black text-[#3b0764]' : 'text-[#3b0764] font-medium'}`}>
        {value}
      </span>
    </div>
  );
}

// --- Main Page Component ---

export function OrderConfirmationPage({ order, onContinueShopping, onViewAccount }) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);

  const subtotal = order.subtotal;
  const shippingCost = order.shippingCost;
  const taxAmount = order.taxAmount;
  const discountAmount = order.discountAmount;
  const totalAmount = order.totalAmount;

  const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
  const currentStatusIndex = statuses.indexOf(order.orderStatus?.toLowerCase() || 'confirmed');

  const deliverySteps = [
    { id: 'confirmed', icon: CheckCircle, label: 'Confirmed', desc: 'Order received' },
    { id: 'processing', icon: Package, label: 'Preparing', desc: 'Curating items' },
    { id: 'shipped', icon: Truck, label: 'Dispatched', desc: 'On the way' },
    { id: 'delivered', icon: Mail, label: 'Delivered', desc: 'Ritual ready' },
  ];

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/resend-email`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to resend email.');
      setResendSuccess(true);
    } catch (error) {
      setResendError(error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] w-full max-w-[100vw] overflow-x-hidden font-sans selection:bg-[rgba(216,180,254,0.3)]">
      

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 flex flex-col min-h-screen">
        
        {/* --- Hero Section --- */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
        >
          <div className="inline-flex items-center justify-center gap-3 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[rgba(216,180,254,0.4)] shadow-[0_4px_20px_rgba(147,51,234,0.05)] mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[rgb(147,104,236)]" />
            <span className="text-[9px] md:text-[10px] font-black tracking-wide capitalize text-[#3b0764]">
              Naya Lumière Cosmetics
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#3b0764] leading-[1.1] mb-6">
            <span className="italic font-light">Order </span>
            <span 
              className="font-sans font-black not-italic"
              style={{ backgroundImage: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Confirmed
            </span>
          </h1>

          <p className="text-sm md:text-base text-[#6b21a8]/70 max-w-lg mx-auto mb-8 font-medium leading-relaxed px-4">
            Thank you, {order.customerName?.split(' ')[0] || 'beautiful'}. Your ritual has been secured. We will notify you the moment it begins its journey to you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="px-6 py-2.5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] capitalize tracking-wide text-[#6b21a8]/70 font-bold mb-0.5">Order No.</span>
              <span className="text-sm font-black text-[#3b0764] truncate max-w-full">#{order.id}</span>
            </div>
            <div className="px-6 py-2.5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] capitalize tracking-wide text-[#6b21a8]/70 font-bold mb-0.5">Estimated</span>
              <span className="text-sm font-black text-[#3b0764] truncate max-w-full">2–3 Days</span>
            </div>
          </div>
        </motion.div>

        {/* --- Unified Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full flex-1 min-w-0">
          
          {/* LEFT COLUMN: Journey & Selection */}
          <div className="lg:col-span-7 flex flex-col gap-8 md:gap-12 min-w-0 w-full">
            
            {/* The Journey (Horizontal Timeline Desktop / Vertical Mobile) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 border border-white shadow-[0_8px_32px_rgba(147,51,234,0.04)]"
            >
              <LuxeSectionTitle subtitle="Status" title="The Journey" />
              
              <div className="relative mt-8">
                {/* Desktop Line */}
                <div className="hidden md:block absolute top-6 left-6 right-6 h-[2px] bg-[rgba(216,180,254,0.2)] rounded-full" />
                <div 
                  className="hidden md:block absolute top-6 left-6 h-[2px] bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(147,104,236)] rounded-full transition-all duration-1000"
                  style={{ width: `calc(${(currentStatusIndex / (statuses.length - 1)) * 100}% - 3rem)` }}
                />

                <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 relative z-10">
                  {deliverySteps.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isActive = index === currentStatusIndex;
                    
                    return (
                      <div key={step.id} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 flex-1 min-w-0">
                        {/* Mobile vertical line connector */}
                        {index !== deliverySteps.length - 1 && (
                          <div className="md:hidden absolute left-[1.1rem] mt-10 w-[2px] h-10 bg-[rgba(216,180,254,0.2)]" />
                        )}
                        {index !== deliverySteps.length - 1 && isCompleted && (
                          <div className="md:hidden absolute left-[1.1rem] mt-10 w-[2px] h-10 bg-gradient-to-b from-[rgb(216,180,254)] to-[rgb(147,104,236)]" />
                        )}

                        <div 
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 relative ${
                            isActive ? 'bg-gradient-to-br from-[rgb(216,180,254)] to-[rgb(147,104,236)] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-110' :
                            isCompleted ? 'bg-[rgb(147,104,236)] text-white' : 'bg-white border-2 border-[rgba(216,180,254,0.3)] text-[rgba(147,104,236,0.4)]'
                          }`}
                        >
                          <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[13px] md:text-sm font-bold break-words ${isActive ? 'text-[#3b0764]' : isCompleted ? 'text-[#3b0764]/80' : 'text-[#6b21a8]/40'}`}>
                            {step.label}
                          </p>
                          <p className={`text-[11px] md:text-xs break-words mt-0.5 ${isActive ? 'text-[#6b21a8]' : 'text-[#6b21a8]/40'}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* The Selection (Items) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 border border-white shadow-[0_8px_32px_rgba(147,51,234,0.04)]"
            >
              <LuxeSectionTitle subtitle="Curated For You" title="The Selection" />
              
              <div className="space-y-6 mt-6">
                {order.items.map((item, index) => (
                  <div key={index} className="group flex gap-5 items-center pb-6 border-b border-[rgba(216,180,254,0.15)] last:border-0 last:pb-0 min-w-0">
                    <div className="w-20 h-24 md:w-24 md:h-28 rounded-xl bg-[#ffffff] border border-[rgba(216,180,254,0.2)] flex items-center justify-center p-2 shrink-0 overflow-hidden relative">
                      <ImageWithFallback
                        src={item.product?.imageUrl || '/placeholder-image.jpg'}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-between h-full">
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-[#3b0764] leading-snug line-clamp-2 break-words mb-1">
                          {item.product?.name || `Product ${item.product?.id}`}
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] md:text-xs text-[#6b21a8]/70 font-medium capitalize tracking-wide">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.shade && <span>Shade: {item.shade}</span>}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-xs font-semibold text-[#6b21a8]/50 bg-[rgba(216,180,254,0.15)] px-2 py-1 rounded-md">Qty {item.quantity}</span>
                        <span className="text-sm md:text-base font-black text-[#3b0764]">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: The Dossier (Sticky) */}
          <div className="lg:col-span-5 min-w-0 w-full relative">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="sticky top-8 bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 border border-white shadow-[0_12px_40px_rgba(147,51,234,0.06)] flex flex-col gap-8"
            >
              
              {/* Summary */}
              <div>
                <LuxeSectionTitle subtitle="Invoice" title="Order Dossier" />
                <div className="space-y-1 mt-4">
                  <DossierRow label="Subtotal" value={formatPrice(subtotal)} />
                  {discountAmount > 0 && <DossierRow label="Discount" value={`– ${formatPrice(discountAmount)}`} />}
                  <DossierRow label="Shipping" value={!shippingCost || shippingCost === 0 ? 'Complimentary' : formatPrice(shippingCost)} />
                  {order.giftWrapCost > 0 && <DossierRow label="Gift Wrap" value={formatPrice(order.giftWrapCost)} />}
                  <DossierRow label="Tax (Included)" value={formatPrice(taxAmount)} />
                  <DossierRow label="Total" value={formatPrice(totalAmount)} isTotal />
                </div>
              </div>

              {/* Address */}
              <div className="pt-6 border-t border-[rgba(216,180,254,0.15)]">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-[rgb(147,104,236)]" />
                  <h4 className="text-[11px] font-bold capitalize tracking-wide text-[#3b0764]">Destination</h4>
                </div>
                <div className="text-sm text-[#6b21a8]/70 leading-relaxed pl-6 break-words">
                  <p className="font-bold text-[#3b0764] mb-0.5">{order.customerName}</p>
                  <p>{order.shippingAddressDetails.addressLine1}</p>
                  {order.shippingAddressDetails.addressLine2 && <p>{order.shippingAddressDetails.addressLine2}</p>}
                  <p>{order.shippingAddressDetails.city}, {order.shippingAddressDetails.postalCode}</p>
                  <p>{order.shippingAddressDetails.country}</p>
                </div>
              </div>

              {/* Payment & Date */}
              <div className="pt-6 border-t border-[rgba(216,180,254,0.15)] grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-[rgb(147,104,236)]" />
                    <h4 className="text-[11px] font-bold capitalize tracking-wide text-[#3b0764]">Payment</h4>
                  </div>
                  <p className="text-xs text-[#6b21a8]/70 pl-6 break-words font-medium">
                    {order?.payment_method === 'card' && order?.cardDetails 
                      ? `${order.cardDetails.brand} •••• ${order.cardDetails.last4}`
                      : (order?.payment_method || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    }
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[rgb(147,104,236)]" />
                    <h4 className="text-[11px] font-bold capitalize tracking-wide text-[#3b0764]">Date</h4>
                  </div>
                  <p className="text-xs text-[#6b21a8]/70 pl-6 break-words font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Resend Email Block */}
              <div className="pt-6 border-t border-[rgba(216,180,254,0.15)] bg-gradient-to-b from-transparent to-[rgba(255,255,255,0.5)] -mx-8 -mb-8 p-8 rounded-b-[2rem]">
                <p className="text-xs text-[#6b21a8]/70 text-center mb-4 break-words">
                  Receipt dispatched to <strong className="text-[#3b0764] break-all">{order.customerEmail}</strong>.
                </p>
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="cl-gradient-btn w-full max-w-[200px] py-2.5 text-[11px] font-bold capitalize tracking-wide transition-colors disabled:opacity-50 text-center"
                  >
                    {isResending ? 'Sending...' : 'Resend Receipt'}
                  </button>
                  {resendSuccess && <p className="text-[11px] mt-2 font-bold text-[rgb(147,104,236)] capitalize tracking-wide">Dispatched.</p>}
                  {resendError && <p className="text-[11px] mt-2 font-bold text-red-400 capitalize tracking-wide">Error sending.</p>}
                </div>
              </div>

            </motion.div>
          </div>
        </div>

        {/* --- Bottom Actions --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 md:mt-16 flex flex-col sm:flex-row justify-center gap-4 w-full"
        >
          <button
            onClick={onContinueShopping}
            className="cl-gradient-btn group px-8 py-4 rounded-full text-white text-[12px] font-bold capitalize tracking-wide transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
          >
            Return To Boutique
            <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 group-hover:text-white transition-all" />
          </button>
          <button
            onClick={onViewAccount}
            className="cl-gradient-btn px-8 py-4 rounded-full text-white text-[12px] font-bold capitalize tracking-wide transition-all duration-300 flex items-center justify-center w-full sm:w-auto"
          >
            View Archive
          </button>
        </motion.div>

      </div>
    </div>
  );
}
