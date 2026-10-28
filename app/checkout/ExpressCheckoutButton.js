'use client';

import { useEffect, useRef, useState } from 'react';
import { Elements, useStripe, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';

/**
 * Standalone Apple Pay / Google Pay ("express checkout") button.
 *
 * Unlike the card form, this renders on its own — it does NOT require the
 * shopper to first select "Card". It only appears when the device/browser
 * actually supports a wallet (canMakePayment), so on unsupported setups it
 * renders nothing at all. On tap it creates a PaymentIntent for the current
 * total, confirms it with the wallet, then hands the PI id back to the parent
 * to place the order in one step.
 *
 * @param amount       total in the smallest AED unit (fils), i.e. Math.round(total * 100)
 * @param onBeforePay  guard (may be async); return false to abort (e.g. no address selected)
 * @param onSuccess    async(piId) called after the wallet payment succeeds
 */
function ExpressButtonInner({ amount, disabled, onBeforePay, onSuccess, onAvailable, show = true }) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  // Keep the latest callbacks/amount without re-creating the paymentRequest on every render
  const onBeforePayRef = useRef(onBeforePay);
  const onSuccessRef = useRef(onSuccess);
  const onAvailableRef = useRef(onAvailable);
  const amountRef = useRef(amount);
  useEffect(() => {
    onBeforePayRef.current = onBeforePay;
    onSuccessRef.current = onSuccess;
    onAvailableRef.current = onAvailable;
    amountRef.current = amount;
  });

  useEffect(() => {
    if (!stripe || !amount || amount <= 0) { setPaymentRequest(null); return; }

    const pr = stripe.paymentRequest({
      country: 'AE',
      currency: 'aed',
      total: { label: 'Naya Lumière Cosmetics', amount },
      requestPayerName: true,
      requestPayerEmail: true,
      // Apple Pay / Google Pay only — Stripe Link here confused the payment step
      disableWallets: ['link'],
    });

    let active = true;
    pr.canMakePayment().then((result) => {
      if (!active) return;
      setPaymentRequest(result ? pr : null);
      // Lets checkout list "Apple Pay" / "Google Pay" as a payment option only when it exists
      onAvailableRef.current?.(result ? { applePay: !!result.applePay, googlePay: !!result.googlePay } : null);
    });

    pr.on('paymentmethod', async (ev) => {
      if (onBeforePayRef.current && !(await onBeforePayRef.current())) { ev.complete('fail'); return; }
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amountRef.current, currency: 'aed' }),
        });
        const { clientSecret } = await res.json();
        if (!clientSecret) { ev.complete('fail'); toast.error('Could not start the payment. Please try again.'); return; }

        const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) { ev.complete('fail'); toast.error(confirmError.message); return; }
        ev.complete('success');

        if (paymentIntent.status === 'requires_action') {
          const { error: actionError, paymentIntent: confirmedPI } = await stripe.confirmCardPayment(clientSecret);
          if (actionError) { toast.error(actionError.message); return; }
          await onSuccessRef.current(confirmedPI.id);
        } else {
          await onSuccessRef.current(paymentIntent.id);
        }
      } catch {
        ev.complete('fail');
        toast.error('Payment could not be completed. Please try again.');
      }
    });

    return () => { active = false; };
  }, [stripe, amount]);

  if (!paymentRequest || !show) return null;

  return (
    <div>
      {/* Stripe draws the wallet button in an iframe and only lets us set its height,
          so the wrapper clips it to the same 12px corners as the other checkout buttons */}
      <div className={`overflow-hidden rounded-xl ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: { paymentRequestButton: { type: 'buy', theme: 'dark', height: '52px' } },
          }}
        />
      </div>
    </div>
  );
}

export default function ExpressCheckoutButton({ stripePromise, amount, disabled, onBeforePay, onSuccess, onAvailable, show }) {
  if (!stripePromise) return null;
  return (
    <Elements stripe={stripePromise}>
      <ExpressButtonInner amount={amount} disabled={disabled} onBeforePay={onBeforePay} onSuccess={onSuccess} onAvailable={onAvailable} show={show} />
    </Elements>
  );
}
