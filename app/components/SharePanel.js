'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Share2, X, Copy, Check, Mail, Facebook, Twitter, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LAVENDER = 'rgb(147,104,236)';

function WhatsAppIcon(props) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.6Z" />
      <path d="M9.2 9.6c.4 2.3 2.3 4.1 4.6 4.6l1-1.4 1.8.8" />
    </svg>
  );
}

/**
 * Real share utility — copies the actual site URL, opens the real Facebook /
 * WhatsApp / X share intents and a real public QR-code image (no invented
 * "earn rewards for sharing" mechanic, since there's no referral/credit
 * system behind it — logged-out visitors are pointed at the real sign-in /
 * Naya Rewards flow instead).
 */
export function SharePanel() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [siteUrl, setSiteUrl] = useState('https://nayalc.com');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setSiteUrl(window.location.origin);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — no-op, the URL is still visible/selectable in the input
    }
  };

  const shareText = encodeURIComponent('Discover luxury skincare and fragrance at Naya Lumière Cosmetics');
  const encodedUrl = encodeURIComponent(siteUrl);

  const shareLinks = [
    { label: 'Email', icon: Mail, href: `mailto:?subject=${shareText}&body=${encodedUrl}`, bg: '#6b7280' },
    { label: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, bg: '#1877f2' },
    { label: 'WhatsApp', icon: WhatsAppIcon, href: `https://wa.me/?text=${shareText}%20${encodedUrl}`, bg: '#25d366' },
    { label: 'X', icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`, bg: '#000000' },
  ];

  return (
    <div className="relative flex-shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Share"
        aria-expanded={open}
        className="flex items-center justify-center w-7 h-7 rounded-full text-white hover:bg-white/15 transition-colors cursor-pointer"
      >
        <Share2 size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] w-[290px] rounded-2xl bg-white overflow-hidden text-left z-[200]"
          style={{ boxShadow: '0 20px 45px -12px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ background: LAVENDER }}>
            <span className="text-[13px] font-bold text-white">Share Naya Lumière</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-white/80 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="p-4">
            {!isAuthenticated && (
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-[12px] text-gray-500 mb-2.5">Sign in to track your Naya Rewards points.</p>
                <Link
                  href="/auth"
                  onClick={() => setOpen(false)}
                  className="block text-center w-full py-2.5 rounded-full text-white text-[12px] font-bold cursor-pointer"
                  style={{ background: LAVENDER }}
                >
                  Sign in
                </Link>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly
                value={siteUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 border border-gray-200 rounded-full px-3 py-2 text-[11.5px] text-gray-600 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: LAVENDER }}
                aria-label="Copy link"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Show QR code"
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <QrCode size={16} />
              </a>
              {shareLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Share on ${s.label}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ background: s.bg }}
                >
                  <s.icon size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
