'use client';
import { useEffect, useRef } from 'react';

/**
 * Runs `fn` now and every `ms` while the tab is on screen, and once more when the
 * tab comes back (`immediate: false` skips the first call when the page loads the
 * data itself). Hidden tabs never call it: the database (Neon) only sleeps after
 * a few minutes without requests, and a forgotten tab polling in the background
 * kept it awake (and billed) around the clock.
 */
export default function usePolling(fn, ms, { enabled = true, immediate = true } = {}) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    let last = 0;
    const run = () => {
      if (document.visibilityState !== 'visible') return;
      last = Date.now();
      fnRef.current();
    };
    if (immediate) run(); else last = Date.now();
    const id = setInterval(run, ms);
    // Back on screen: refresh at once if the last call is older than the interval
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last >= ms) run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [ms, enabled, immediate]);
}

// Admin alerts, the order list and the live-visitor count refresh this often
export const ADMIN_POLL_MS = 2 * 60 * 1000;
