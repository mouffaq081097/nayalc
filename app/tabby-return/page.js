"use client";
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createFetchWithAuth } from '../lib/api';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 24px rgba(147,51,234,0.07)',
};

function TabbyReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const { logout } = useAuth();
  const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);

  const [phase, setPhase] = useState('verifying'); // verifying | placing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    if (status === 'cancel') { setPhase('error'); setErrorMsg('Payment cancelled. Your cart is still saved.'); return; }
    if (status === 'failure') { setPhase('error'); setErrorMsg('Payment failed. Please try a different payment method.'); return; }
    if (status !== 'success' || !paymentId) { setPhase('error'); setErrorMsg('Invalid return state.'); return; }

    async function completeOrder() {
      try {
        // 1. Verify payment with Tabby
        setPhase('verifying');
        const verifyRes = await fetch(`/api/tabby/verify?paymentId=${paymentId}`);
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || (verifyData.status !== 'authorized' && verifyData.status !== 'closed')) {
          throw new Error(`Payment not authorized (status: ${verifyData.status || 'unknown'})`);
        }

        // 2. Read pending order from sessionStorage
        const raw = sessionStorage.getItem('pendingTabbyOrder');
        if (!raw) throw new Error('Order data not found. Please restart checkout.');
        const orderData = JSON.parse(raw);

        // 3. Place the order
        setPhase('placing');
        const orderRes = await fetchWithAuth('/api/orders', {
          method: 'POST',
          body: JSON.stringify({ ...orderData, payment_method: 'tabby', tabby_payment_id: paymentId }),
        });
        const result = await orderRes.json();
        if (!orderRes.ok) throw new Error(result.message || 'Order creation failed');

        // 4. Cleanup and redirect
        sessionStorage.removeItem('pendingTabbyOrder');
        clearCart();
        setPhase('success');
        setTimeout(() => router.push(`/orders/${result.orderId}`), 1500);
      } catch (err) {
        console.error('Tabby return error:', err);
        setPhase('error');
        setErrorMsg(err.message || 'Something went wrong. Please contact support.');
      }
    }

    completeOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentId]);

  const phaseConfig = {
    verifying: { Icon: Loader2,     spin: true,  color: '#7e69e6', title: 'Verifying Payment', msg: 'Confirming your Tabby authorization…' },
    placing:   { Icon: Loader2,     spin: true,  color: '#7e69e6', title: 'Placing Order',      msg: 'Creating your order…' },
    success:   { Icon: CheckCircle, spin: false, color: '#16a34a', title: 'Order Placed!',      msg: 'Redirecting to your order…' },
    error:     { Icon: XCircle,     spin: false, color: '#dc2626', title: 'Payment Issue',      msg: errorMsg },
  };

  const cfg = phaseConfig[phase];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#fdf8ff' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: 'rgba(196,167,254,0.15)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full blur-[90px]"  style={{ background: 'rgba(216,180,254,0.1)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-6 rounded-3xl p-10" style={glass}>
        <div className="flex justify-center mb-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
            Tabby
          </span>
        </div>

        <cfg.Icon
          size={52}
          strokeWidth={1.5}
          style={{ color: cfg.color, margin: '0 auto' }}
          className={cfg.spin ? 'animate-spin' : ''}
        />

        <div>
          <h1 className="text-xl font-bold" style={{ color: '#3b0764' }}>{cfg.title}</h1>
          <p className="text-[13px] mt-2" style={{ color: 'rgba(59,7,100,0.55)' }}>{cfg.msg}</p>
        </div>

        {phase === 'error' && (
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => router.push('/checkout')}
              className="cl-gradient-btn w-full py-3.5 rounded-full text-[14px] font-semibold"
            >
              Return to Checkout
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="w-full py-3 rounded-full text-[12px] font-semibold flex items-center justify-center gap-2"
              style={{ border: '1px solid rgba(216,180,254,0.45)', color: 'rgb(126,105,230)' }}
            >
              <ArrowLeft size={13} /> Back to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TabbyReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8ff' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'rgb(126,105,230)' }} />
      </div>
    }>
      <TabbyReturn />
    </Suspense>
  );
}
