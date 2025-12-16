import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/button';
import { toast } from 'react-toastify';

const CheckoutForm = ({ onSuccessfulPayment }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Use this to prevent automatic redirection
    });

    if (error) {
      // This will catch any error that occurs during the payment confirmation.
      // Show error to your customer (e.g., incomplete payment details, card declined).
      toast.error(error.message);
      setErrorMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // The payment has been processed!
      // Show a success message to your customer
      toast.success('Payment successful!');
      onSuccessfulPayment(paymentIntent.id); // Callback to parent component to place the order
    } else {
      // Handle other payment statuses if needed
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        options={{
          layout: "tabs", // or 'accordion', 'spaced'
        }}
      />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white hover:opacity-90"
      >
        {isProcessing ? 'Processing...' : 'Pay now'}
      </Button>
      {errorMessage && <div className="text-red-500 text-sm mt-2">{errorMessage}</div>}
    </form>
  );
};

export default CheckoutForm;