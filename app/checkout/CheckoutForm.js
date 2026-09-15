'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { Lock, Loader2 } from 'lucide-react';

const CARD_STYLE = {
  style: {
    base: {
      color: '#111114',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSmoothing: 'antialiased',
      // 16px keeps iOS Safari from zooming the page when the card field is focused
      fontSize: '16px',
      '::placeholder': { color: '#a1a1aa' },
      iconColor: '#9869f7',
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

const CheckoutForm = ({ onSuccessfulPayment, buttonLabel = 'Pay now', clientSecret = null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);
    const { error: submitError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (submitError) {
      toast.error(submitError.message);
      setErrorMessage(submitError.message);
      setIsProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccessfulPayment(paymentIntent.id);
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure — let Stripe handle the redirect
      const { error: actionError, paymentIntent: confirmedPI } = await stripe.handleCardAction(clientSecret);
      if (actionError) {
        toast.error(actionError.message);
        setErrorMessage(actionError.message);
      } else {
        onSuccessfulPayment(confirmedPI.id);
      }
      setIsProcessing(false);
    } else {
      toast.error('Payment could not be completed. Please try again.');
      setIsProcessing(false);
    }
  };

  let fieldState = 'border-[#e5e5ea]';
  if (errorMessage) fieldState = 'border-red-300 ring-2 ring-red-100';
  else if (isFocused) fieldState = 'border-[#9869f7] ring-2 ring-[#9869f7]/15';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-[12px] font-medium text-[#5a5a64]">Card details</p>
        <div className={`mt-1.5 rounded-xl border bg-white px-3.5 py-[15px] transition-[border-color,box-shadow] duration-150 ${fieldState}`}>
          <CardElement
            options={CARD_STYLE}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              setIsComplete(e.complete);
              setErrorMessage(e.error ? e.error.message : null);
            }}
          />
        </div>
        {errorMessage && (
          <p role="alert" className="mt-2 text-[12px] font-medium text-red-600">{errorMessage}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !isComplete}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7] focus-visible:ring-offset-2"
        style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)', boxShadow: '0 6px 22px rgba(152,105,247,.32)' }}
      >
        {isProcessing ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Processing payment…
          </>
        ) : (
          buttonLabel
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-[#8a8a93]">
        <Lock size={12} />
        Encrypted and processed securely by Stripe
      </p>
    </form>
  );
};

export default CheckoutForm;
