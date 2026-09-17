// Minimal in-memory sliding-window rate limiter.
//
// Scope: one serverless instance. It stops casual abuse and accidental
// double-submits, not a distributed attack — swap the Map for Redis/Upstash
// if you ever need limits that hold across instances.

const buckets = new Map();
const MAX_BUCKETS = 10_000;

function sweep(now) {
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || hits[hits.length - 1] < now - 3_600_000) buckets.delete(key);
  }
}

/**
 * @returns {{ ok: boolean, retryAfter: number }} retryAfter is in seconds.
 */
export function rateLimit(key, { limit = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) sweep(now);

  const hits = (buckets.get(key) || []).filter((t) => t > now - windowMs);

  if (hits.length >= limit) {
    const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000);
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
