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
  // Stable unique DOM id for this instance
  const idRef = useRef(`TabbyPromo_${++counter}`);
  const divRef = useRef(null);

  useEffect(() => {
    if (!price || !PUBLIC_KEY) return;

    const formattedPrice = Number(price).toFixed(2);
    const selector       = `#${idRef.current}`;

    loadTabbyScript()
      .then(() => {
        if (!divRef.current || !window.TabbyPromo) return;
        divRef.current.innerHTML = ''; // clear previous render
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
      if (divRef.current) divRef.current.innerHTML = '';
    };
  }, [price, lang, source]);

  return <div id={idRef.current} ref={divRef} />;
}
