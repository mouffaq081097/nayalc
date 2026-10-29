'use client';

import { useEffect, useRef } from 'react';

const PUBLIC_KEY    = process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY    || '';
const MERCHANT_CODE = process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || 'default';
const SCRIPT_URL    = 'https://checkout.tabby.ai/tabby-promo.js';

// Singleton script loader — only appends the <script> tag once
let scriptPromise = null;
function loadTabbyScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('SSR')); return; }
    if (window.TabbyPromo)             { resolve(); return; }
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script    = document.createElement('script');
    script.src      = SCRIPT_URL;
    script.async    = true;
    script.onload   = resolve;
    script.onerror  = reject;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let counter = 0;

/**
 * Renders the Tabby promotional split-payment widget.
 * Re-initialises whenever `price` changes (supports variant selectors).
 *
 * Props:
 *   price   {number|string}  Product price — formatted to 2 decimal places for AED
 *   source  {string}         'product' | 'cart'   (default: 'product')
 *   lang    {string}         'en' | 'ar'           (default: 'en')
 */
export default function TabbyPromo({ price, source = 'product', lang = 'en' }) {
  const divRef = useRef(null);

  useEffect(() => {
    const box = divRef.current;
    if (!price || !PUBLIC_KEY || !box) return;

    // The id is given here, in the browser. A counter read while rendering also
    // runs on the server, where it keeps counting across visits: the page kept
    // the server's id and Tabby was told to fill the browser's, so on a direct
    // visit it found nothing to fill.
    if (!box.id) box.id = `TabbyPromo_${++counter}`;
    const formattedPrice = Number(price).toFixed(2);
    const selector       = `#${box.id}`;

    loadTabbyScript()
      .then(() => {
        if (!box.isConnected || !window.TabbyPromo) return;
        box.innerHTML = ''; // clear previous render
        new window.TabbyPromo({
          selector,
          currency:        'AED',
          price:           formattedPrice,
          lang,
          source,
          shouldInheritBg: false,
          publicKey:       PUBLIC_KEY,
          merchantCode:    MERCHANT_CODE,
        });
      })
      .catch(() => { /* script blocked / network error — degrade silently */ });

    return () => {
      box.innerHTML = '';
    };
  }, [price, lang, source]);

  return <div ref={divRef} />;
}
