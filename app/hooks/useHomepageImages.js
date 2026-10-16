'use client';

import { useEffect, useState } from 'react';
import { getSlot } from '@/lib/homepageImageSlots';

let cache = null;
let inflight = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch('/api/homepage-images')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((data) => { cache = data || {}; inflight = null; return cache; });
  }
  return inflight;
}

/**
 * The admin's photo for a homepage image slot (Admin → Homepage images), or the
 * slot's shipped default until one is set. One request per page load, shared
 * by every banner that asks.
 */
export function useHomepageImage(key) {
  const slot = getSlot(key);
  const [override, setOverride] = useState(cache?.[key] || null);

  useEffect(() => {
    let cancelled = false;
    load().then((data) => { if (!cancelled && data[key]) setOverride(data[key]); });
    return () => { cancelled = true; };
  }, [key]);

  return { src: override?.imageUrl || slot.fallbackUrl, alt: override?.altText || slot.alt };
}
