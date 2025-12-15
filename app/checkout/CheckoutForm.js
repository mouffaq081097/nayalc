import React, { useState, useEffect } from 'react';
import { useStripe, useElements, ExpressCheckoutElement, CardElement } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/button';
import { toast } from 'react-toastify';
import { Label } from '../components/ui/label';

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      padding: '10px 12px',
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const CheckoutForm = ({ clientSecret, onSuccessfulPayment, total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardElementReady, setCardElementReady] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [debugInfo, setDebugInfo] = useState(''); // New state for debug info

  useEffect(() => {
    if (stripe && total > 0) {
      const currentDebug = `Stripe: ${!!stripe}, Total: ${total}`;
      setDebugInfo(currentDebug + "\nInitializing paymentRequest...");
      const pr = stripe.paymentRequest({
        country: 'AE',
        currency: 'aed',
        total: {
          label: 'iHealthCare.ae', // Use your website name
          amount: Math.round(total * 100), // Amount in cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Check the availability of the Payment Request API.
      pr.canMakePayment().then(result => {
        const canMakePaymentResult = `pr.canMakePayment() result: ${JSON.stringify(result)}`;
        setDebugInfo(prev => prev + "\n" + canMakePaymentResult);
        if (result) {
          setPaymentRequest(pr);
          setDebugInfo(prev => prev + "\nPaymentRequest set successfully.");
        } else {
          setDebugInfo(prev => prev + "\npr.canMakePayment() returned false. Apple Pay might not be available.");
        }
      }).catch(error => {
        const errorMessage = `Error checking canMakePayment(): ${error.message}`;
        setDebugInfo(prev => prev + "\n" + errorMessage);
        console.error("Error checking canMakePayment():", error);
      });
    } else {
      setDebugInfo(`Stripe: ${!!stripe}, Total: ${total} - Stripe or total not available.`);
    }
  }, [stripe, total]);

  const onConfirm = async (event) => {
    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    if (!cardElementReady) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (error) {
      toast.error(error.message);
      setIsProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccessfulPayment(paymentIntent.id);
      setIsProcessing(false);
    }
  };

  const expressCheckoutOptions = {
    buttonType: {
      applePay: 'buy',
    },
    paymentRequest: paymentRequest, // Pass the created paymentRequest object
  };

  return (
    <>
      {clientSecret && paymentRequest && ( // Conditionally render only if paymentRequest is available
        <ExpressCheckoutElement
          clientSecret={clientSecret}
          options={expressCheckoutOptions}
          onConfirm={onConfirm}
        />
      )}
      <div className="my-4 text-center text-gray-500">OR</div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="card-element" className="mb-2 block text-gray-700">Credit or debit card</Label>
          <div style={{
            border: '1px solid #E5E7EB',
            padding: '12px',
            borderRadius: '0.5rem',
            backgroundColor: '#F9FAFB',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            minHeight: '40px',
          }}>
            <CardElement
              id="card-element"
              options={cardElementOptions}
              onReady={() => setCardElementReady(true)}
              onChange={(event) => {
                if (event.error) {
                  toast.error(event.error.message);
                }
              }}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!stripe || isProcessing || !cardElementReady}
          className="w-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white hover:opacity-90"
        >
          {isProcessing ? 'Processing...' : 'Pay now'}
        </Button>
      </form>
      {/* Debug Info Display */}
      {debugInfo && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9',
          whiteSpace: 'pre-wrap',
          fontSize: '12px',
          color: '#333'
        }}>
          <strong>Debug Info:</strong><br/>{debugInfo}
        </div>
      )}
    </>
  );
};

export default CheckoutForm;
