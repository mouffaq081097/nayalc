'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Loader2 } from 'lucide-react';

const LAVENDER = 'rgb(147,104,236)';
const STORAGE_KEY = 'naya_welcome_popup_seen';

/**
 * First-visit welcome popup — real email capture (POSTs to /api/subscribe,
 * the same endpoint that sends the confirmation email) and a real, working
 * coupon code (WELCOME10, 10% off, created in the coupons table) rather than
 * an invented discount that wouldn't actually apply at checkout.
 */
export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage unavailable — don't nag on every load, just skip.
      return;
    }
    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
      setStatus('success');
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {}
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Welcome offer">
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <X size={17} />
        </button>

        {/* Image side — hidden on mobile to keep the popup compact */}
        <div className="relative hidden md:block min-h-[440px]">
          <Image
            src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
            alt="A guest receiving a facial treatment"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Content side */}
        <div className="flex flex-col justify-center p-8 sm:p-10 text-center">
          <p className="text-[11px] font-bold tracking-[0.32em] uppercase text-gray-900 mb-6">Naya Lumière</p>

          {status === 'success' ? (
            <>
              <h2 className="text-[22px] font-bold text-gray-900 mb-2">You&rsquo;re on the list!</h2>
              <p className="text-[13.5px] text-gray-500 mb-5">Use this code at checkout for 10% off your first order.</p>
              <div
                className="mx-auto mb-6 inline-flex items-center gap-2 border-2 border-dashed rounded-xl px-6 py-3"
                style={{ borderColor: LAVENDER }}
              >
                <span className="text-[18px] font-bold tracking-[0.1em]" style={{ color: LAVENDER }}>
                  WELCOME10
                </span>
              </div>
              <button type="button" onClick={dismiss} className="text-[12.5px] font-semibold cursor-pointer" style={{ color: LAVENDER }}>
                Continue shopping →
              </button>
            </>
          ) : (
            <>
              <h2 className="text-[24px] sm:text-[28px] font-bold text-gray-900 leading-tight mb-2">
                Get 10% off your first order
              </h2>
              <p className="text-[13.5px] text-gray-500 mb-6 max-w-xs mx-auto">
                Join our journal for early access to new arrivals and skincare guidance — plus 10% off to start.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full border border-gray-200 rounded-full px-5 py-3.5 text-[13.5px] text-gray-900 outline-none focus:border-[rgb(147,104,236)] transition-colors mb-3"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full h-12 rounded-full text-white text-[13px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: LAVENDER }}
                >
                  {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                  Activate offer
                </button>
              </form>

              {status === 'error' && <p className="text-[12px] text-red-500 mt-3">{errorMsg}</p>}

              <button
                type="button"
                onClick={dismiss}
                className="mt-4 text-[12.5px] font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                No thanks
              </button>

              <p className="mt-6 text-[10.5px] text-gray-400 leading-relaxed">
                By entering your email, you consent to receive marketing communications. See our{' '}
                <a href="#" className="underline hover:text-gray-600">Privacy Policy</a> for more information.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
