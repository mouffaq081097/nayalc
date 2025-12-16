'use client';

import { Suspense, useMemo } from 'react';
import OrderConfirmation from './OrderConfirmation.js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// This is the component that uses useSearchParams
function OrderConfirmationWrapper() {
  const searchParams = useSearchParams();
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

  const options = useMemo(() => {
    if (!paymentIntentClientSecret) return null;
    return { clientSecret: paymentIntentClientSecret };
  }, [paymentIntentClientSecret]);

  if (!paymentIntentClientSecret || !options) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-lg">Payment intent client secret not found.</p>
        <Link href="/" className="mt-6 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <OrderConfirmation />
    </Elements>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationWrapper />
    </Suspense>
  );
}