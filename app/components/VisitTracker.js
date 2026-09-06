'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const beacon = (url, payload) => {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
  else fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
};

/**
 * Records one storefront visit per browser session.
 * - visitor_id (localStorage) → counts unique visitors across sessions
 * - session_id (sessionStorage) → ensures we record only once per session
 * Admin/account/auth areas are excluded so internal usage isn't counted.
 */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /^\/(admin|account|auth)/.test(pathname)) return;
    try {
      let vid = localStorage.getItem('nlc_vid');
      if (!vid) { vid = uid(); localStorage.setItem('nlc_vid', vid); }

      // Only the first page of a session is recorded as a visit.
      if (sessionStorage.getItem('nlc_sid')) return;
      const sid = uid();
      sessionStorage.setItem('nlc_sid', sid);

      beacon('/api/track/visit', { visitorId: vid, sessionId: sid, path: pathname, referrer: document.referrer || '' });
    } catch {}
  }, [pathname]);

  // Heartbeat → keeps the session "live" for the realtime visitor count.
  useEffect(() => {
    if (!pathname || /^\/(admin|account|auth)/.test(pathname)) return;

    const ping = () => {
      if (document.visibilityState !== 'visible') return;
      const vid = localStorage.getItem('nlc_vid');
      const sid = sessionStorage.getItem('nlc_sid');
      if (vid && sid) beacon('/api/track/ping', { visitorId: vid, sessionId: sid, path: pathname });
    };

    ping();
    const id = setInterval(ping, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [pathname]);

  return null;
}
