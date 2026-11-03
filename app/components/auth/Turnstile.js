'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Cloudflare Turnstile ("are you human?") for the sign-in code form.
 * Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; the server
 * checks the token only when TURNSTILE_SECRET_KEY is set (lib/emailCodeGuard.js).
 * A token works once: call ref.reset() after each request.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

let scriptPromise = null;
function loadScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => { scriptPromise = null; reject(new Error('Turnstile failed to load')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const Turnstile = forwardRef(function Turnstile({ onToken, language }, ref) {
  const box = useRef(null);
  const widget = useRef(null);
  const latest = useRef(onToken);
  useEffect(() => { latest.current = onToken; });

  useImperativeHandle(ref, () => ({
    reset() {
      latest.current?.('');
      if (widget.current != null) window.turnstile?.reset(widget.current);
    },
  }), []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    let cancelled = false;
    loadScript().then((turnstile) => {
      if (cancelled || !box.current) return;
      widget.current = turnstile.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: 'interaction-only',
        language: language || 'auto',
        callback: (token) => latest.current?.(token),
        'expired-callback': () => latest.current?.(''),
        'error-callback': () => latest.current?.(''),
      });
    }).catch((error) => console.error(error));
    return () => {
      cancelled = true;
      if (widget.current != null) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [language]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} className="flex justify-center empty:hidden" />;
});

export default Turnstile;
