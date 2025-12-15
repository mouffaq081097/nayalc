import { motion } from 'framer-motion'; // Assuming 'motion/react' is framer-motion
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, Package, Truck, Mail, ArrowRight, Calendar, MapPin, CreditCard } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { formatPrice } from '@/app/lib/utils';
import { useState } from 'react';
import { useUser } from '@/app/context/UserContext';
import { Separator } from '@/app/components/ui/separator'; // Import Separator

/**
 * @typedef {object} OrderConfirmationPageProps
 * @property {any} order - The order data.
 * @property {() => void} onContinueShopping - Callback for continue shopping action.
 * @property {() => void} onViewAccount - Callback for view account action.
 */

/**
 * @param {OrderConfirmationPageProps} props
 */
export function OrderConfirmationPage({ order, onContinueShopping, onViewAccount }) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);

  // Use values directly from order object
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
      completed: order.orderStatus === 'confirmed' || order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered',
    },
    {
      icon: Package,
      title: 'Processing',
      description: "We're preparing your items",
      completed: order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered',
    },
    {
      icon: Truck,
      title: 'Shipped',
      description: 'Your order is on its way',
      completed: order.orderStatus === 'shipped' || order.orderStatus === 'delivered',
    },
    {
      icon: Mail,
      title: 'Delivered',
      description: 'Enjoy your beautiful products',
      completed: order.orderStatus === 'delivered',
    }
  ];

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/resend-email`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to resend email.');
      }
      setResendSuccess(true);
    } catch (error) {
      setResendError(error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl mb-4">
              <span className="text-gray-900">Your </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Order is Confirmed
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-4">
              Thank you for your purchase! We've received your order and will begin processing it shortly.
            </p>

            <Badge className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent text-lg px-4 py-2">
              Order {order.id}
            </Badge>
          </motion.div>

          {/* Checkmark Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              className="w-24 h-24"
            >
              <defs>
                <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--brand-blue)" />
                  <stop offset="100%" stopColor="var(--brand-pink)" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="12"
                cy="12"
                r="10"
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="1.5"
                fill="transparent"
              />
              <motion.circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#brandGradient)"
                strokeWidth="1.5"
                fill="transparent"
                initial={{ strokeDashoffset: 1, pathLength: 0 }}
                animate={{ strokeDashoffset: 0, pathLength: 1 }}
                transition={{
                  duration: 1,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75"
                stroke="url(#brandGradient)"
                initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
                animate={{ pathLength: 1, opacity: 1, scale: 1 }}
                transition={{
                  delay: 1,
                  duration: 0.5,
                  ease: "easeOut",
                  type: "spring", // Add a spring effect for a "pop"
                  stiffness: 260,
                  damping: 20
                }}
              />
            </motion.svg>
          </motion.div>

          {/* Expected Delivery Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-6 text-center p-6 bg-green-50 rounded-2xl mb-12"
          >
            <Truck className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg mb-2">Expected Delivery</h3>
            <p className="text-gray-700">
              Your order is estimated to arrive within <strong>2-3 business days</strong>.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You will receive a shipping confirmation email with tracking details once your order has been dispatched.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Timeline */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl p-8"
              >
                <h2 className="text-2xl mb-6">Order Timeline</h2>
                <div className="space-y-6">
                  {deliverySteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                        step.completed 
                          ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                              {step.title}
                            </h3>
                            <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-2xl p-8"
              >
                <h2 className="text-2xl mb-6">Your Items</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <ImageWithFallback
                        src={item.product?.imageUrl || '/placeholder-image.jpg'} // Access item.product.imageUrl
                        alt={item.product?.name || 'Product Image'} // Access item.product.name
                        className="w-16 h-16 object-contain rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product?.name || `Product ${item.product?.id}`}</h3>
                        {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                        {item.shade && <p className="text-sm text-gray-500">Shade: {item.shade}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price)}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button 
                  onClick={onContinueShopping}
                  className="flex-1 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                >
                  Continue Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onViewAccount}
                  className="flex-1"
                >
                  View Order History
                </Button>
              </motion.div>
            </div>

            {/* Order Summary & Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl p-6"
              >
                <h3 className="text-xl mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount</span>
                      <span>- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{!shippingCost || shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                  </div>
                  {order.giftWrapCost > 0 && (
                    <div className="flex justify-between">
                      <span>Gift Wrap</span>
                      <span>{formatPrice(order.giftWrapCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Order Total</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>
                <Badge className="w-full justify-center bg-green-100 text-green-800">
                  Payment Successful
                </Badge>
              </motion.div>

              {/* Shipping Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-2xl p-6"
              >
                <h3 className="text-lg mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[var(--brand-blue)]" />
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600">
                  <p>{order.customerName}</p>
                  <p>{order.shippingAddressDetails.addressLine1}</p>
                  {order.shippingAddressDetails.addressLine2 && <p>{order.shippingAddressDetails.addressLine2}</p>}
                  <p>{order.shippingAddressDetails.city}, {order.shippingAddressDetails.state} {order.shippingAddressDetails.postalCode}</p>
                  <p>{order.shippingAddressDetails.country}</p>
                </div>
              </motion.div>

              {/* Payment Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white rounded-2xl p-6"
              >
                <h3 className="text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[var(--brand-blue)]" />
                  Payment Method
                </h3>
                <div className="text-sm text-gray-600">
                  {order?.payment_method === 'card' ? (
                    order?.cardDetails ? (
                      <div className="space-y-1">
                        <p className="font-medium">{order.cardDetails.brand.charAt(0).toUpperCase() + order.cardDetails.brand.slice(1)} **** {order.cardDetails.last4}</p>
                        <p>Status: <Badge className="ml-1" variant={order.cardDetails.status === 'succeeded' ? 'default' : 'destructive'}>{order.cardDetails.status}</Badge></p>
                      </div>
                    ) : (
                      <p>Card Payment</p> // Fallback to just "Card Payment" if details are not available
                    )
                  ) : (
                    <p>{order.payment_method ? order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'N/A'}</p>
                  )}
                </div>
              </motion.div>

              {/* Order Date */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white rounded-2xl p-6"
              >
                <h3 className="text-lg mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[var(--brand-blue)]" />
                  Order Date
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </motion.div>

              {/* Help */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="bg-gradient-to-br from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5 rounded-2xl p-6"
              >
                <h3 className="text-lg mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Questions about your order? Our customer service team is here to help.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Email Confirmation Notice */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-center p-6 bg-blue-50 rounded-2xl"
          >
            <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg mb-2">Confirmation Email Sent</h3>
            <p className="text-gray-600">
              We&apos;ve sent a detailed order confirmation to <strong>your email address ({order.customerEmail})</strong>. 
              You&apos;ll also receive updates as your order progresses.
            </p>
            <div className="mt-4">
              <Button onClick={handleResendEmail} disabled={isResending}>
                {isResending ? 'Resending...' : 'Resend Email'}
              </Button>
              {resendSuccess && <p className="text-green-600 mt-2">Email resent successfully!</p>}
              {resendError && <p className="text-red-600 mt-2">{resendError}</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}