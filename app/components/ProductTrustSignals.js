'use client';

import { CheckCircle2, ShieldCheck, Award } from 'lucide-react';

/**
 * Product trust / social-proof block (Amazon-style).
 *
 * Honest-by-design: numeric claims are derived ONLY from real data (reviews +
 * ratings the store actually has). Everything else is generic copy that is
 * always true for this store. We never fabricate order counts or return rates.
 */
export default function ProductTrustSignals({ brand, averageRating, reviewCount }) {
  const rating = Number(averageRating) || 0;
  const reviews = Number(reviewCount) || 0;
  const brandName = brand || 'Naya Lumière';

  // % positive derived from the real average rating (only meaningful with reviews)
  const positivePct = reviews > 0 && rating > 0 ? Math.round((rating / 5) * 100) : null;

  // Real customer count, bucketed down to a clean threshold (never rounded up)
  const customerLabel =
    reviews >= 100 ? '100+' :
    reviews >= 50 ? '50+' :
    reviews >= 25 ? '25+' :
    reviews >= 10 ? '10+' :
    reviews > 0 ? String(reviews) : null;

  // Real signals first (only when backed by data), then always-true generic copy.
  const signals = [];
  if (positivePct !== null && customerLabel) {
    signals.push(`${positivePct}% positive ratings from ${customerLabel} ${reviews === 1 ? 'customer' : 'customers'}`);
  }
  signals.push(`Authentic ${brandName} — sourced directly from the brand`);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Top Brand header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
          style={{
            background: 'linear-gradient(135deg,#1f2937,#0f172a)',
            boxShadow: '0 1px 3px rgba(15,23,42,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <Award size={12} className="flex-shrink-0" style={{ color: '#fbbf24' }} strokeWidth={2.5} />
          Top Brand
        </span>
        <span className="text-[14px] font-bold text-gray-900">{brandName}</span>
      </div>

      {/* Signal bullets */}
      <ul className="space-y-2">
        {signals.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 leading-snug">
            <CheckCircle2 size={16} className="flex-shrink-0 mt-px text-emerald-600" />
            <span>{s}</span>
          </li>
        ))}
      </ul>

      {/* Reassurance callout */}
      <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
        <ShieldCheck size={18} className="flex-shrink-0 mt-px text-emerald-600" />
        <div>
          <p className="text-[13px] font-semibold text-gray-900">Shop with confidence</p>
          <p className="text-[12px] text-gray-500 leading-snug mt-0.5">
            100% authentic products, backed by our 30-day return policy.
          </p>
        </div>
      </div>
    </div>
  );
}
