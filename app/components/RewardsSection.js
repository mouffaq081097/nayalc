'use client';

import Link from 'next/link';

const LAVENDER = 'rgb(147,104,236)';
const LAVENDER_LIGHT = 'rgb(237,233,254)';

const TIERS = [
  { pts: '500', value: 'AED 25 off' },
  { pts: '1000', value: 'AED 60 off' },
  { pts: '2000', value: 'AED 150 off' },
];

export function RewardsSection() {
  return (
    <section className="py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-10"
          style={{ borderColor: 'rgb(216,180,254)' }}
        >
          {/* Left — text */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {/* Star icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l1.545 4.755H14.09L10.09 8.49l1.545 4.755L8 10.51l-3.635 2.735L5.91 8.49 1.91 5.755H6.455L8 1z" fill={LAVENDER}/>
              </svg>
              <p
                className="text-[11px] font-bold tracking-[0.18em] uppercase"
                style={{ color: LAVENDER }}
              >
                Naya Rewards
              </p>
            </div>
            <h2 className="text-[22px] md:text-[26px] font-bold text-gray-900 leading-snug">
              Earn points. Get rewarded.
            </h2>
            <p className="text-[13px] text-gray-500 leading-relaxed max-w-sm">
              Earn 5 points for every AED spent. Redeem points as cash on your
              next order, unlock exclusive early access, and enjoy birthday perks.
            </p>
          </div>

          {/* Right — tiers + CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Tier boxes */}
            <div className="flex gap-3">
              {TIERS.map(({ pts, value }) => (
                <div
                  key={pts}
                  className="rounded-xl border px-4 py-3 text-center min-w-[80px]"
                  style={{ borderColor: 'rgb(216,180,254)' }}
                >
                  <p className="text-[20px] font-bold leading-none" style={{ color: LAVENDER }}>{pts}</p>
                  <p className="text-[10px] text-gray-500 mt-1 leading-snug">pts = {value}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold text-white uppercase tracking-wide flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: LAVENDER }}
            >
              Join Free
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
