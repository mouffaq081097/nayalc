'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStripe } from '@stripe/react-stripe-js';

import Link from 'next/link';

export default function OrderConfirmationPage() {
  const stripe = useStripe();
  const searchParams = useSearchParams();
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const [paymentStatus, setPaymentStatus] = useState('Verifying payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!stripe || !paymentIntentClientSecret) {
        return;
      }

      const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);

      if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            setPaymentStatus('Payment succeeded! Your order is confirmed.');
            break;
          case 'processing':
            setPaymentStatus('Payment is processing. We will notify you once it is complete.');
            break;
          case 'requires_payment_method':
            setPaymentStatus('Payment failed. Please try again with a different payment method.');
            break;
          default:
            setPaymentStatus('Something went wrong.');
            break;
        }
      } else {
        setPaymentStatus('Payment intent not found.');
      }
    };

    verifyPayment();
  }, [stripe, paymentIntentClientSecret]);

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Status</h1>
      <p className="text-lg">{paymentStatus}</p>
      <Link href="/" className="mt-6 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
        Continue Shopping
      </Link>
    </div>
  );
}