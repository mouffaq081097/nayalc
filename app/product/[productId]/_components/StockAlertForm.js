'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { BUTTON } from './theme';
import { useLocale } from '@/app/context/LocaleContext';

/**
 * Sold out, no pre-orders: the shopper leaves an email and gets one message when
 * the product is back (POST /api/stock-alerts → lib/stockAlerts.js).
 */
export default function StockAlertForm({ productId, defaultEmail = '' }) {
  const { t, rich } = useLocale();
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setMessage(t(err.message));
    }
  };

  if (status === 'done') {
    return (
      <p className="flex items-start gap-2 bg-[#f6f5f2] px-4 py-3.5 text-[13.5px] text-[#111114]" role="status">
        <Check size={16} className="mt-0.5 shrink-0" />
        <span>{rich('Done. We’ll email {email} once, when it’s back in stock.', { email: <b className="font-semibold latin" dir="ltr">{email}</b> })}</span>
      </p>
    );
  }

  return (
    <form id="stock-alert" onSubmit={submit} className="grid gap-2">
      <p className="text-[13.5px] text-[#111114]">{t('Get one email the moment it’s back.')}</p>
      <div className="flex items-stretch gap-2.5">
        <label htmlFor="stock-alert-email" className="sr-only">{t('Email')}</label>
        <input
          id="stock-alert-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('Your email')}
          className="min-w-0 flex-1 h-[52px] border border-[#dcdcdc] px-4 text-[14px] text-[#111114] outline-none focus:border-[#111114]"
        />
        <button type="submit" disabled={status === 'sending'} className={`h-[52px] shrink-0 px-6 text-[13px] font-semibold uppercase tracking-[0.05em] disabled:opacity-60 ${BUTTON}`}>
          {status === 'sending' ? t('Sending…') : t('Notify me')}
        </button>
      </div>
      {status === 'error'
        ? <p className="text-[12.5px] text-[#b91c1c]">{message}</p>
        : <p className="text-[12px] text-[#6b6b73]">{t('We only use it for this alert.')}</p>}
    </form>
  );
}
