"use client";
import { useEffect, useRef } from 'react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY;
const MERCHANT_CODE = process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || 'default';
const SCRIPT_URL = 'https://checkout.tabby.ai/tabby-promo.js';

export default function TabbyPromo({ price, source = 'product', lang = 'en' }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!price || !PUBLIC_KEY) return;

    function init() {
      if (!containerRef.current || !window.TabbyPromo) return;
      // Destroy previous instance if price changed
      if (instanceRef.current?.destroy) instanceRef.current.destroy();
      instanceRef.current = new window.TabbyPromo({
        selector: `#tabby-promo-${source}`,
        currency: 'AED',
        price: parseFloat(price).toFixed(2),
        lang,
        source,
        shouldInheritBg: true,
        publicKey: PUBLIC_KEY,
        merchantCode: MERCHANT_CODE,
      });
    }

    if (window.TabbyPromo) {
      init();
      return;
    }

    // Load script only once
    if (!document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    } else {
      // Script tag exists but not yet loaded — poll briefly
      const poll = setInterval(() => {
        if (window.TabbyPromo) { clearInterval(poll); init(); }
      }, 100);
      return () => clearInterval(poll);
    }
  }, [price, source, lang]);

  return <div id={`tabby-promo-${source}`} ref={containerRef} />;
}
