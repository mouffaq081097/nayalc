'use client';

import { useEffect, useState } from 'react';

let cache = null;
let inflight = null;

function fetchArticles() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch('/api/journal')
    .then((r) => (r.ok ? r.json() : []))
    .then((data) => {
      cache = Array.isArray(data) ? data : [];
      inflight = null;
      return cache;
    })
    .catch(() => {
      inflight = null;
      return [];
    });
  return inflight;
}

/** Real journal articles from the DB (see /api/journal), shared/cached across every component that renders them on one page load. */
export function useJournalArticles() {
  const [articles, setArticles] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    fetchArticles().then((data) => {
      if (!cancelled) {
        setArticles(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { articles, loading };
}
