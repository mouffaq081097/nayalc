import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/button';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, CreditCard, Sparkles, Loader2 } from 'lucide-react';

const CheckoutForm = ({ onSuccessfulPayment, buttonLabel = "Pay now" }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'AE',
        currency: 'aed',
        total: {
          label: 'Naya Lumière Acquisition',
          amount: 1000,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      pr.on('paymentmethod', async (ev) => {
        const {paymentIntent, error: confirmError} = await stripe.confirmCardPayment(
            // clientSecret from parent
        );

        if (confirmError) {
          ev.complete('fail');
        } else {
          ev.complete('success');
          onSuccessfulPayment(paymentIntent.id);
        }
      });
    }
  }, [stripe]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      toast.error(submitError.message);
      setErrorMessage(submitError.message);
      setIsProcessing(false);
    } else {
      toast.success('Payment authorized!');
      onSuccessfulPayment();
    }
    setIsProcessing(false);
  };

  const cardStyle = {
    style: {
      base: {
        color: "#1d1d1f",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#86868b"
        },
        iconColor: "#000000"
      },
      invalid: {
        color: "#ff3b30",
        iconColor: "#ff3b30"
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Wallet Payments (Apple Pay / Google Pay) */}
      {paymentRequest && (
        <div className="space-y-6">
            <PaymentRequestButtonElement 
                options={{ 
                    paymentRequest,
                    style: {
                        paymentRequestButton: {
                            type: 'buy',
                            theme: 'dark', 
                            height: '56px',
                        },
                    },
                }} 
            />
            <div className="flex items-center gap-4">
                <div className="h-[0.5px] flex-1 bg-gray-300"></div>
                <span className="text-[11px] font-medium text-gray-400 tracking-tight uppercase">or card selection</span>
                <div className="h-[0.5px] flex-1 bg-gray-300"></div>
            </div>
        </div>
      )}

      {/* Physical Card Visual - Fully Responsive Apple Style */}
      <div className="relative w-full max-w-md mx-auto rounded-[1.5rem] bg-white p-6 lg:p-10 shadow-lg overflow-hidden border border-gray-200 group transition-all duration-1000">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-10 lg:mb-12">
            <div className="w-12 h-8 lg:w-14 lg:h-10 rounded-lg bg-[#f2f2f2] relative overflow-hidden border border-gray-200/50 shadow-inner">
                <motion.div 
                    animate={{ 
                        background: [
                            "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #e0e0e0 100%)",
                            "linear-gradient(135deg, #f5f5f7 0%, #e0e0e0 50%, #f5f5f7 100%)",
                            "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #e0e0e0 100%)"
                        ]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 opacity-60"
                />
            </div>
            <div className="text-right">
                <p className="text-[14px] lg:text-[17px] font-medium tracking-tight text-[#1d1d1f] leading-none mb-1">Naya Lumière</p>
                <div className="flex justify-end items-center gap-1.5 opacity-40">
                    <Sparkles size={10} className="text-brand-pink animate-pulse" />
                    <span className="text-[9px] font-medium text-gray-500 tracking-tight">Boutique Selection</span>
                </div>
            </div>
        </div>

        <div className="space-y-6 lg:space-y-8 relative z-10">
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-medium text-[#86868b] tracking-tight uppercase">Secure Credentials</label>
                    <div className="flex items-center gap-1.5 opacity-40">
                        <ShieldCheck size={10} className="text-[#34c759]" />
                        <span className="text-[8px] font-semibold text-gray-400">Encrypted</span>
                    </div>
                </div>
                <div className="bg-gray-50/50 backdrop-blur-sm border border-gray-200 p-4 rounded-xl transition-all focus-within:border-gray-900 focus-within:bg-white shadow-inner">
                    <CardElement options={cardStyle} />
                </div>
            </div>
            
            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-medium text-[#86868b] tracking-tight mb-0.5 uppercase">Card Holder</span>
                    <span className="text-[13px] lg:text-[15px] font-medium text-[#1d1d1f] tracking-tight">Valued Client</span>
                </div>
                <div className="flex gap-2 items-center opacity-30">
                    <CreditCard size={16} />
                    <div className="w-8 h-5 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-[8px]">VISA</div>
                </div>
            </div>
        </div>
      </div>      

      <div className="space-y-6 pt-4 max-w-md mx-auto">
        <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-gray-900 text-white hover:bg-brand-pink h-14 rounded-full text-[14px] font-semibold tracking-tight shadow-xl transition-all active:scale-[0.98]"
        >
            {isProcessing ? (
                <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                    Securing selection...
                </div>
            ) : buttonLabel}
        </Button>
        
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
            <Lock size={12} strokeWidth={2.5} className="text-brand-pink/40" />
            <span className="tracking-tight uppercase tracking-[0.1em]">Verified Boutique Security</span>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;