'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Loader2 } from 'lucide-react';
import { useLocale, useT } from '../context/LocaleContext';

const LAVENDER = 'rgb(147,104,236)';

/**
 * Welcome offer modal — real email capture (POSTs to /api/subscribe, the same
 * endpoint that sends the confirmation email) and a real, working coupon code
 * (WELCOME10, 10% off, created in the coupons table) rather than an invented
 * discount that wouldn't actually apply at checkout.
 *
 * Controlled by the parent (see LayoutContent.js), which decides when to
 * auto-show it on first visit and also opens it when WelcomeCornerBadge is
 * clicked, so both entry points share one implementation.
 */
export default function WelcomePopup({ isOpen, onClose }) {
  const { t, rich } = useLocale();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

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
    } catch (err) {
      setStatus('error');
      setErrorMsg(t(err.message || 'Something went wrong. Please try again.'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center md:p-4" role="dialog" aria-modal="true" aria-label={t('Welcome offer')}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Phones: a sheet from the bottom edge; desktop: a centred card with the photo */}
      <div className="relative w-full max-w-3xl bg-white rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 pb-[env(safe-area-inset-bottom,0px)] md:pb-0">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Close')}
          className="absolute top-3 end-3 z-10 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <X size={17} />
        </button>

        {/* Image side — hidden on mobile to keep the popup compact */}
        <div className="relative hidden md:block min-h-[440px]">
          <Image
            src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
            alt={t('A guest receiving a facial treatment')}
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Content side */}
        <div className="flex flex-col justify-center p-8 sm:p-10 text-center">
          <p className="latin text-[11px] font-bold tracking-[0.32em] uppercase text-gray-900 mb-6">Naya Lumière</p>

          {status === 'success' ? (
            <>
              <h2 className="text-[22px] font-bold text-gray-900 mb-2">{t('You’re on the list!')}</h2>
              <p className="text-[13.5px] text-[#6b6b73] mb-5">{t('Use this code at checkout for 10% off your first order.')}</p>
              <div
                className="mx-auto mb-6 inline-flex items-center gap-2 border-2 border-dashed rounded-xl px-6 py-3"
                style={{ borderColor: LAVENDER }}
              >
                <span className="latin text-[18px] font-bold tracking-[0.1em]" style={{ color: LAVENDER }}>
                  WELCOME10
                </span>
              </div>
              <button type="button" onClick={onClose} className="text-[12.5px] font-semibold cursor-pointer" style={{ color: LAVENDER }}>
                {t('Continue shopping →')}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-[24px] sm:text-[28px] font-bold text-gray-900 leading-tight mb-2">
                {t('Get 10% off your first order')}
              </h2>
              <p className="text-[13.5px] text-[#6b6b73] mb-6 max-w-xs mx-auto">
                {t('Join our journal for early access to new arrivals and skincare guidance — plus 10% off to start.')}
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Email address')}
                  className="w-full border border-gray-200 rounded-full px-5 py-3.5 text-[13.5px] text-gray-900 outline-none focus:border-[rgb(147,104,236)] transition-colors mb-3"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full h-12 rounded-full text-white text-[13px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: LAVENDER }}
                >
                  {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                  {t('Activate offer')}
                </button>
              </form>

              {status === 'error' && <p className="text-[12px] text-red-500 mt-3">{errorMsg}</p>}

              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-[12.5px] font-medium text-[#6b6b73] hover:text-[#111114] transition-colors cursor-pointer"
              >
                {t('No thanks')}
              </button>

              <p className="mt-6 text-[10.5px] text-[#6b6b73] leading-relaxed">
                {rich('By entering your email, you consent to receive marketing communications. See our {privacy} for more information.', {
                  privacy: <Link href="/privacy" onClick={onClose} className="underline hover:text-[#111114]">{t('Privacy Policy')}</Link>,
                })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Phones: the welcome offer as a slim bar along the bottom instead of a card over
 * the page. "Get code" opens the full form; ✕ dismisses it for good. It rises
 * above the product page's sticky buy bar while that bar is showing.
 */
export function WelcomeBar({ onOpen, onClose }) {
  const t = useT();
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    const onBar = (e) => setLifted(!!e.detail?.visible);
    window.addEventListener('nayalc:sticky-buy-bar', onBar);
    return () => window.removeEventListener('nayalc:sticky-buy-bar', onBar);
  }, []);

  return (
    <div
      role="region"
      aria-label={t('Welcome offer')}
      className="md:hidden fixed inset-x-3 z-[145] flex items-center gap-2 rounded-xl bg-[#111114] py-2 ps-4 pe-1.5 text-white shadow-[0_8px_24px_rgba(17,17,20,0.25)] transition-[bottom] duration-200"
      style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${lifted ? 76 : 12}px)` }}
    >
      <p className="min-w-0 text-[13px] leading-snug">{t('10% off your first order')}</p>
      <button type="button" onClick={onOpen} className="ms-auto shrink-0 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-[#111114]">
        {t('Get code')}
      </button>
      <button type="button" onClick={onClose} aria-label={t('No thanks')} className="shrink-0 flex h-10 w-10 items-center justify-center text-white/80 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}
