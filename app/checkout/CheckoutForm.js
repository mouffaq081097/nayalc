import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
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

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'AE',
        currency: 'aed',
        total: {
          label: 'Total',
          amount: Math.round(total * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestShipping: true, // Ask for shipping address
      });

      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
        }
      });
    }
  }, [stripe, total]);

  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.on('paymentmethod', async (ev) => {
        if (clientSecret) {
          const { error, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (error) {
            ev.complete('fail');
            toast.error(error.message);
          } else if (paymentIntent.status === 'succeeded') {
            ev.complete('success');
            onSuccessfulPayment(paymentIntent.id);
          } else {
            ev.complete('fail');
            toast.error('Payment failed.');
          }
        }
      });
    }
  }, [paymentRequest, clientSecret, stripe, onSuccessfulPayment]);


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

  const paymentRequestOptions = {
    paymentRequest,
  };

  if (paymentRequest) {
    // For debugging, force the button to appear
    const expressCheckoutOptions = {
      paymentMethods: {
        applePay: 'always'
      }
    };
    return <PaymentRequestButtonElement options={{...paymentRequestOptions, ...expressCheckoutOptions}} />;
  }

  return (
    <>
      {!paymentRequest && (
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
      )}
    </>
  );
};

export default CheckoutForm;
