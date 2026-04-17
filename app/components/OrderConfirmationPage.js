'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, Package, Truck, Mail, ArrowRight, Calendar, MapPin, CreditCard, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { formatPrice } from '@/app/lib/utils';
import { useState } from 'react';
import { Separator } from '@/app/components/ui/separator';

export function OrderConfirmationPage({ order, onContinueShopping, onViewAccount }) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);

  const subtotal = order.subtotal;
  const shippingCost = order.shippingCost;
  const taxAmount = order.taxAmount;
  const discountAmount = order.discountAmount;
  const totalAmount = order.totalAmount;

  const deliverySteps = [
    {
      icon: CheckCircle,
      title: 'Order Confirmed',
      description: 'Your order has been placed successfully',
      completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus),
    },
    {
      icon: Package,
      title: 'Processing',
      description: "We're preparing your items",
      completed: ['processing', 'shipped', 'delivered'].includes(order.orderStatus),
    },
    {
      icon: Truck,
      title: 'Shipped',
      description: 'Your order is on its way',
      completed: ['shipped', 'delivered'].includes(order.orderStatus),
    },
    {
      icon: Mail,
      title: 'Delivered',
      description: 'Enjoy your beautiful products',
      completed: order.orderStatus === 'delivered',
    },
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
    <div className="min-h-screen bg-cl-bg relative overflow-hidden">
      {/* Background aura orbs */}
      <div className="cl-aura cl-aura-purple animate-cl-aura-float" style={{ top: '-80px', left: '-80px', width: '420px', height: '420px' }} />
      <div className="cl-aura cl-aura-rose animate-cl-aura-float-slow" style={{ top: '30%', right: '-100px', width: '360px', height: '360px' }} />
      <div className="cl-aura cl-aura-purple animate-cl-aura-float" style={{ bottom: '10%', left: '20%', width: '300px', height: '300px', animationDelay: '2s' }} />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }} />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: 'rgb(147,104,236)' }}>
                Naya Lumière Cosmetics
              </span>
              <span className="w-8 h-px" style={{ background: 'linear-gradient(270deg, rgb(196,167,254), rgb(216,180,254))' }} />
            </div>
            <h1 className="text-4xl md:text-5xl mb-3" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              <span className="italic font-light text-cl-deep">Your order is </span>
              <span
                className="font-black not-italic"
                style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                Confirmed
              </span>
            </h1>
            <p className="text-base text-cl-light mb-5 max-w-xl mx-auto">
              Thank you for your purchase! We've received your order and will begin processing it shortly.
            </p>
            <span
              className="inline-block px-5 py-1.5 rounded-full text-sm font-medium text-cl-mid border"
              style={{ background: 'rgba(216,180,254,0.18)', borderColor: 'var(--cl-glass-border)' }}
            >
              Order #{order.id}
            </span>
          </motion.div>

          {/* Animated Checkmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="flex justify-center mb-10"
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: 'rgba(196,167,254,0.35)', transform: 'scale(1.3)' }}
              />
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                className="relative w-24 h-24"
              >
                <defs>
                  <linearGradient id="clGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(216,180,254)" />
                    <stop offset="100%" stopColor="rgb(126,105,230)" />
                  </linearGradient>
                </defs>
                <motion.circle
                  cx="12" cy="12" r="10"
                  stroke="rgba(216,180,254,0.3)"
                  strokeWidth="1.5"
                  fill="rgba(248,240,255,0.6)"
                />
                <motion.circle
                  cx="12" cy="12" r="10"
                  stroke="url(#clGradient)"
                  strokeWidth="1.5"
                  fill="transparent"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: 'easeInOut', delay: 0.5 }}
                />
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75"
                  stroke="url(#clGradient)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5, ease: 'easeOut', type: 'spring', stiffness: 260, damping: 20 }}
                />
              </motion.svg>
            </div>
          </motion.div>

          {/* Expected Delivery Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="cl-glass-card rounded-2xl p-6 mb-10 text-center"
            style={{ background: 'rgba(248,240,255,0.85)' }}
          >
            <Truck className="h-7 w-7 mx-auto mb-2" style={{ color: 'var(--cl-purple)' }} />
            <h3 className="text-base font-medium text-cl-deep mb-1">Expected Delivery</h3>
            <p className="text-sm text-cl-light">
              Your order is estimated to arrive within <strong className="text-cl-mid">2–3 business days</strong>.
            </p>
            <p className="text-xs text-cl-light mt-1">
              A shipping confirmation with tracking details will be sent to your email.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Order Timeline */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="cl-glass-card rounded-2xl p-7"
              >
                <h2 className="text-lg font-semibold text-cl-deep mb-6 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--cl-purple)' }} />
                  Order timeline
                </h2>
                <div className="space-y-5">
                  {deliverySteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full"
                        style={
                          step.completed
                            ? { background: 'linear-gradient(135deg, rgb(216,180,254), rgb(126,105,230))', color: '#fff' }
                            : { background: 'rgba(216,180,254,0.18)', color: 'rgba(147,51,234,0.4)' }
                        }
                      >
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-medium ${step.completed ? 'text-cl-deep' : 'text-cl-light'}`}>
                          {step.title}
                        </p>
                        <p className={`text-xs mt-0.5 ${step.completed ? 'text-cl-light' : 'text-cl-light opacity-60'}`}>
                          {step.description}
                        </p>
                      </div>
                      {step.completed && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(147,51,234,0.1)', color: 'var(--cl-purple)' }}>
                          Done
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="cl-glass-card rounded-2xl p-7"
              >
                <h2 className="text-lg font-semibold text-cl-deep mb-5">Your items</h2>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{ background: 'rgba(248,240,255,0.6)', border: '1px solid rgba(216,180,254,0.25)' }}
                    >
                      <div
                        className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.7)' }}
                      >
                        <ImageWithFallback
                          src={item.product?.imageUrl || '/placeholder-image.jpg'}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cl-deep truncate">{item.product?.name || `Product ${item.product?.id}`}</p>
                        {item.size && <p className="text-xs text-cl-light">Size: {item.size}</p>}
                        {item.shade && <p className="text-xs text-cl-light">Shade: {item.shade}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-cl-mid">{formatPrice(item.price)}</p>
                        <p className="text-xs text-cl-light">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <button
                  onClick={onContinueShopping}
                  className="group flex-1 flex items-center justify-center gap-3 py-3.5 px-8 rounded-full text-[11px] font-black uppercase tracking-widest text-white transition-all duration-300 hover:shadow-[0_6px_24px_rgba(168,85,247,0.40)]"
                  style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))', boxShadow: '0 4px 14px rgba(168,85,247,0.28)' }}
                >
                  Continue shopping
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onViewAccount}
                  className="cl-ghost-btn flex-1 flex items-center justify-center gap-2 py-3.5 px-8 rounded-full text-[11px] font-black uppercase tracking-widest"
                >
                  View order history
                </button>
              </motion.div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-1 space-y-5">

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="cl-glass-card rounded-2xl p-6"
              >
                <h3 className="text-sm font-semibold text-cl-deep mb-4">Order summary</h3>
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between text-cl-light">
                    <span>Subtotal</span>
                    <span className="text-cl-deep">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between" style={{ color: '#db2777' }}>
                      <span>Discount</span>
                      <span>– {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cl-light">
                    <span>Shipping</span>
                    <span className="text-cl-deep">{!shippingCost || shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                  </div>
                  {order.giftWrapCost > 0 && (
                    <div className="flex justify-between text-cl-light">
                      <span>Gift wrap</span>
                      <span className="text-cl-deep">{formatPrice(order.giftWrapCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cl-light">
                    <span>Tax</span>
                    <span className="text-cl-deep">{formatPrice(taxAmount)}</span>
                  </div>
                  <Separator className="my-2" style={{ background: 'rgba(216,180,254,0.3)' }} />
                  <div className="flex justify-between font-semibold text-sm">
                    <span className="text-cl-deep">Total</span>
                    <span
                      style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                    >{formatPrice(totalAmount)}</span>
                  </div>
                </div>
                <div
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(147,51,234,0.08)', color: 'var(--cl-purple)' }}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Payment successful
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="cl-glass-card rounded-2xl p-6"
              >
                <h3 className="text-sm font-semibold text-cl-deep mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" style={{ color: 'var(--cl-purple)' }} />
                  Shipping address
                </h3>
                <div className="text-xs text-cl-light space-y-0.5">
                  <p className="text-cl-mid font-medium">{order.customerName}</p>
                  <p>{order.shippingAddressDetails.addressLine1}</p>
                  {order.shippingAddressDetails.addressLine2 && <p>{order.shippingAddressDetails.addressLine2}</p>}
                  <p>{order.shippingAddressDetails.city}, {order.shippingAddressDetails.state} {order.shippingAddressDetails.postalCode}</p>
                  <p>{order.shippingAddressDetails.country}</p>
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="cl-glass-card rounded-2xl p-6"
              >
                <h3 className="text-sm font-semibold text-cl-deep mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" style={{ color: 'var(--cl-purple)' }} />
                  Payment method
                </h3>
                <div className="text-xs text-cl-light">
                  {order?.payment_method === 'card' ? (
                    order?.cardDetails ? (
                      <div className="space-y-1">
                        <p className="text-cl-mid font-medium">
                          {order.cardDetails.brand.charAt(0).toUpperCase() + order.cardDetails.brand.slice(1)} **** {order.cardDetails.last4}
                        </p>
                        <p>
                          Status:{' '}
                          <span
                            className="ml-1 px-1.5 py-0.5 rounded text-xs font-medium"
                            style={
                              order.cardDetails.status === 'succeeded'
                                ? { background: 'rgba(147,51,234,0.1)', color: 'var(--cl-purple)' }
                                : { background: 'rgba(219,39,119,0.1)', color: '#db2777' }
                            }
                          >
                            {order.cardDetails.status}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-cl-mid">Card payment</p>
                    )
                  ) : (
                    <p className="text-cl-mid">
                      {order.payment_method
                        ? order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                        : 'N/A'}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Order Date */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="cl-glass-card rounded-2xl p-6"
              >
                <h3 className="text-sm font-semibold text-cl-deep mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: 'var(--cl-purple)' }} />
                  Order date
                </h3>
                <p className="text-xs text-cl-light">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </motion.div>

              {/* Help */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="rounded-2xl p-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(147,51,234,0.06), rgba(219,39,119,0.06))',
                  border: '1px solid rgba(216,180,254,0.3)',
                }}
              >
                <h3 className="text-sm font-semibold text-cl-deep mb-1">Need help?</h3>
                <p className="text-xs text-cl-light mb-4">
                  Questions about your order? Our team is happy to assist.
                </p>
                <button className="cl-ghost-btn w-full py-2.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Contact support
                </button>
              </motion.div>
            </div>
          </div>

          {/* Email Confirmation Notice */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-10 cl-glass-card rounded-2xl p-7 text-center"
            style={{ background: 'rgba(248,240,255,0.85)' }}
          >
            <Mail className="h-7 w-7 mx-auto mb-3" style={{ color: 'var(--cl-purple)' }} />
            <h3 className="text-base font-semibold text-cl-deep mb-2">Confirmation email sent</h3>
            <p className="text-sm text-cl-light max-w-md mx-auto">
              We've sent a detailed confirmation to{' '}
              <strong className="text-cl-mid">{order.customerEmail}</strong>. You'll receive updates as your order progresses.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest text-white transition-all duration-300 hover:shadow-[0_6px_24px_rgba(168,85,247,0.40)] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))', boxShadow: '0 4px 14px rgba(168,85,247,0.28)' }}
              >
                {isResending ? 'Resending…' : 'Resend email'}
              </button>
              {resendSuccess && (
                <p className="text-xs font-medium" style={{ color: 'var(--cl-purple)' }}>Email resent successfully!</p>
              )}
              {resendError && (
                <p className="text-xs font-medium" style={{ color: '#db2777' }}>{resendError}</p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
