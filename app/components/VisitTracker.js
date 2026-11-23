'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Keep under the 10-minute "live" window in /api/admin/analytics/live
const PING_EVERY_MS = 3 * 60 * 1000;

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

      // The visit also counts as the first presence ping (one request, not two)
      sessionStorage.setItem('nlc_ping', String(Date.now()));
      beacon('/api/track/visit', { visitorId: vid, sessionId: sid, path: pathname, referrer: document.referrer || '' });
    } catch {}
  }, [pathname]);

  // Presence for the admin's "Live visitors" count. No timer: one ping per page change
  // or return to the tab, at most every PING_EVERY_MS. A once-a-minute heartbeat from
  // every open tab kept the database (Neon) awake all day and night.
  useEffect(() => {
    if (!pathname || /^\/(admin|account|auth)/.test(pathname)) return;

    const ping = () => {
      try {
        if (document.visibilityState !== 'visible') return;
        const vid = localStorage.getItem('nlc_vid');
        const sid = sessionStorage.getItem('nlc_sid');
        const lastPing = Number(sessionStorage.getItem('nlc_ping') || 0);
        if (!vid || !sid || Date.now() - lastPing < PING_EVERY_MS) return;
        sessionStorage.setItem('nlc_ping', String(Date.now()));
        beacon('/api/track/ping', { visitorId: vid, sessionId: sid, path: pathname });
      } catch {}
    };

    ping();
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [pathname]);

  return null;
}
