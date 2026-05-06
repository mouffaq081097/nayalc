'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStripe } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function OrderConfirmation() {
  const stripe = useStripe();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // verifying | creating | success | error
  const [message, setMessage] = useState('Verifying your payment…');
  const calledRef = useRef(false); // prevent double-fire in StrictMode

  const paymentIntentId = searchParams.get('payment_intent');
  const clientSecret = searchParams.get('payment_intent_client_secret');

  useEffect(() => {
    if (!stripe || !clientSecret || calledRef.current) return;
    calledRef.current = true;

    (async () => {
      // 1. Verify the payment intent status
      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);

      if (error || !paymentIntent) {
        setStatus('error');
        setMessage(error?.message || 'Could not verify payment. Please contact support.');
        return;
      }

      if (paymentIntent.status === 'processing') {
        setStatus('error');
        setMessage('Your payment is still processing. You will receive a confirmation email once it completes.');
        return;
      }

      if (paymentIntent.status !== 'succeeded') {
        setStatus('error');
        setMessage('Payment was not completed. Please return to checkout and try again.');
        return;
      }

      // 2. Payment succeeded — try to create the order from sessionStorage payload
      const raw = sessionStorage.getItem('pendingCardOrder');
      if (!raw) {
        // Payment succeeded but no pending order data — order may have already been created
        // via the non-redirect path. Redirect to account orders.
        setStatus('success');
        setMessage('Payment confirmed! Redirecting to your orders…');
        setTimeout(() => router.push('/account/orders'), 2000);
        return;
      }

      let pendingOrder;
      try {
        pendingOrder = JSON.parse(raw);
      } catch {
        setStatus('error');
        setMessage('Order data was corrupted. Please contact support with your payment reference.');
        return;
      }

      setStatus('creating');
      setMessage('Payment confirmed! Creating your order…');

      // 3. POST to create the order
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ...pendingOrder, stripe_payment_intent_id: paymentIntentId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Order creation failed (${res.status})`);
        }

        const { orderId } = await res.json();

        // 4. Clear the pending order and the cart
        sessionStorage.removeItem('pendingCardOrder');
        if (pendingOrder.user_id && token) {
          fetch(`/api/users/${pendingOrder.user_id}/cart`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }

        // 5. Redirect to the order confirmation page
        router.push(`/order-confirmed/${orderId}`);
      } catch (err) {
        setStatus('error');
        setMessage(`Payment succeeded but order creation failed: ${err.message}. Please contact support with payment ID: ${paymentIntentId}`);
      }
    })();
  }, [stripe, clientSecret, paymentIntentId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden w-full max-w-[100vw]" style={{ background: '#ffffff' }}>
      <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(196,167,254,0.2)' }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(216,180,254,0.15)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center px-8 py-12 rounded-3xl w-[calc(100%-2rem)] max-w-md mx-auto"
        style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(216,180,254,0.35)', boxShadow: '0 8px 32px rgba(147,51,234,0.10)' }}
      >
        {(status === 'verifying' || status === 'creating') && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'rgb(147,104,236)' }} />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: 'rgb(147,104,236)' }}>
              {status === 'creating' ? 'Creating order' : 'Verifying payment'}
            </p>
            <p className="text-sm" style={{ color: 'rgba(59,7,100,0.55)' }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgb(126,105,230)' }} />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: 'rgb(147,104,236)' }}>Payment confirmed</p>
            <p className="text-sm" style={{ color: 'rgba(59,7,100,0.55)' }}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-red-400">Something went wrong</p>
            <p className="text-sm mb-6" style={{ color: 'rgba(59,7,100,0.55)' }}>{message}</p>
            <button
              onClick={() => router.push('/account/orders')}
              className="cl-gradient-btn px-8 py-3 rounded-full text-[14px] font-semibold text-white"
            >
              View my orders
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
