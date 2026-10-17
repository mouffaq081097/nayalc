'use client';

import { useEffect, useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';

const CARD_STYLE = {
  // No Stripe Link badge inside the field — one less thing to explain at checkout
  disableLink: true,
  style: {
    base: {
      color: '#111114',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSmoothing: 'antialiased',
      // 16px keeps iOS Safari from zooming the page when the card field is focused
      fontSize: '16px',
      '::placeholder': { color: '#a1a1aa' },
      iconColor: '#111114',
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

/**
 * The card number field only. The checkout page's main button submits it
 * (`<button type="submit" form={formId}>`), and `onStatusChange` tells the page
 * when the card is complete and while a payment is processing.
 */
const CheckoutForm = ({ onSuccessfulPayment, clientSecret = null, formId = 'card-payment-form', onStatusChange }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    onStatusChange?.({ ready: !!stripe && isComplete, processing: isProcessing });
  }, [stripe, isComplete, isProcessing, onStatusChange]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || isProcessing) return;

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

  let fieldState = 'border-[#d9d9de]';
  if (errorMessage) fieldState = 'border-red-300 ring-2 ring-red-100';
  else if (isFocused) fieldState = 'border-[#111114] ring-2 ring-[#111114]/10';

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div>
        <div className={`rounded-xl border bg-white px-4 py-[15px] transition-[border-color,box-shadow] duration-150 ${fieldState}`}>
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
    </form>
  );
};

export default CheckoutForm;
