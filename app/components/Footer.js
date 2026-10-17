'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { headingFont } from './home/SectionHeading';
import { INSTAGRAM_URL } from '@/lib/seo';
import { TRANSIT_LABEL } from '../../lib/shipping';

const COLUMNS = [
  { title: 'Boutique', links: [['All products', '/all-products'], ['Skincare', '/SkinCare'], ['Fragrance', '/fragrance'], ['New arrivals', '/new-arrivals'], ['Gift sets', '/gift-sets']] },
  { title: 'House', links: [['Brands', '/brands'], ['Journal', '/journal'], ['Skin quiz', '/skin-quiz'], ['Naya Rewards', '/loyalty']] },
  { title: 'Help', links: [['My account', '/account'], ['My orders', '/account/orders'], ['Privacy policy', '/privacy'], ['Terms of service', '/terms']] },
];

/** Email sign-up: the same /api/subscribe as the welcome popup, and the same real WELCOME10 code on success. */
function SignUp() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'done') {
    return (
      <p className="text-[13.5px] text-white/85 max-w-[320px]">
        You&apos;re subscribed. Use code <b className="text-white tracking-wide">WELCOME10</b> for 10% off your first order.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-[320px]">
      <div className="flex items-center gap-3 border-b border-white pb-2">
        <label htmlFor="footer-email" className="sr-only">Email</label>
        <input
          id="footer-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 min-w-0 bg-transparent text-[13.5px] text-white placeholder:text-[#8a8a92] outline-none"
        />
        <button type="submit" disabled={status === 'loading'} className="text-[13.5px] font-semibold text-white disabled:opacity-60">
          {status === 'loading' ? 'Sending…' : 'Subscribe'}
        </button>
      </div>
      <p className={`mt-2 text-[11.5px] ${status === 'error' ? 'text-[#fca5a5]' : 'text-[#a1a1aa]'}`}>
        {status === 'error' ? message : 'Subscribe and get 10% off your first order.'}
      </p>
    </form>
  );
}

/** Black footer on every storefront page, opened by the big closing line. */
export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className={`${headingFont} pt-14 pb-10 md:pt-20 md:pb-14 text-center text-[40px] md:text-[84px] font-normal uppercase leading-[1.05] tracking-[-0.01em]`}>
          <span className="text-[#b79cff]">Glow</span> with<br />Naya Lumière
        </p>

        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_repeat(3,1fr)] gap-x-8 gap-y-10">
          <div className="col-span-2 md:col-span-1 grid gap-6 content-start">
            <SignUp />
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Naya Lumière on Instagram" className="w-fit text-white/90 hover:text-white">
              <Instagram size={20} strokeWidth={1.6} />
            </a>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3.5 text-[13.5px] font-semibold">{col.title}</h3>
              <ul className="grid gap-2.5 text-[13px] text-[#d4d4d8]">
                {col.links.map(([label, href]) => (
                  <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 md:mt-20 py-5 border-t border-[#2a2a2e] flex flex-wrap justify-between gap-2.5 text-[12px] text-[#a1a1aa]">
          <span>© {new Date().getFullYear()} Naya Lumière Cosmetics</span>
          <span>Delivery across the UAE in {TRANSIT_LABEL}</span>
        </div>
      </div>
    </footer>
  );
}
