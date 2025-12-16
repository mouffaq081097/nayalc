'use client';
import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext';

const AddPaymentMethodForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { fetchWithAuth } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { clientSecret } = await fetchWithAuth('/api/payment-methods', {
        method: 'POST',
      }).then(res => res.json());

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (setupIntent.status === 'succeeded') {
        toast.success('Payment method added successfully!');
        onSuccess();
      }
    } catch (error) {
      toast.error('An error occurred while adding the payment method.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="mt-4">
        {isProcessing ? 'Processing...' : 'Add Card'}
      </Button>
    </form>
  );
};

export default AddPaymentMethodForm;
