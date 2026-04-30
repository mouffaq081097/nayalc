"use client";
import { useEffect, useRef } from 'react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY;
const MERCHANT_CODE = process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || 'default';
const SCRIPT_URL = 'https://checkout.tabby.ai/tabby-card.js';

export default function TabbyCard({ price, lang = 'en' }) {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!price || !PUBLIC_KEY) return;

    function init() {
      if (!window.TabbyCard) return;
      if (instanceRef.current?.destroy) instanceRef.current.destroy();
      instanceRef.current = new window.TabbyCard({
        selector: '#tabbyCard',
        currency: 'AED',
        price: parseFloat(price).toFixed(2),
        lang,
        shouldInheritBg: true,
        publicKey: PUBLIC_KEY,
        merchantCode: MERCHANT_CODE,
      });
    }

    if (window.TabbyCard) {
      init();
      return;
    }

    if (!document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    } else {
      const poll = setInterval(() => {
        if (window.TabbyCard) { clearInterval(poll); init(); }
      }, 100);
      return () => clearInterval(poll);
    }
  }, [price, lang]);

  return <div id="tabbyCard" />;
}
