'use client';

import React from 'react';
import { Star } from 'lucide-react';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';

const TIERS = [
  { name: 'Silver',   min: 0    },
  { name: 'Gold',     min: 1500 },
  { name: 'Platinum', min: 3000 },
  { name: 'Diamond',  min: 5000 },
];

const PERKS = [
  { label: '2× Points Weekends', icon: '⚡' },
  { label: 'Free Shipping',      icon: '📦' },
  { label: 'Birthday Gift',      icon: '🎁' },
  { label: 'Early Access',       icon: '🔓' },
  { label: 'Exclusive Samples',  icon: '✨' },
  { label: 'Priority Support',   icon: '💬' },
];

function Card({ children, className = '' }) {
  return (
    <div className={`w-full bg-white border border-[#eaeaea] rounded-lg overflow-hidden mb-5 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title }) {
  return (
    <div className="px-6 py-4 border-b border-[#eaeaea]">
      <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

export default function AccountLoyaltyPage() {
  const { loyaltyData, wishlistItems } = useAccountData();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const points    = Number(loyaltyData?.stats?.points        || 0);
  const nextPt    = Number(loyaltyData?.stats?.nextTierPoints || 2000);
  const tier      = loyaltyData?.stats?.tier || 'Silver';
  const ptsToNext = Math.max(0, nextPt - points);
  const progress  = Math.min(100, Math.round((points / nextPt) * 100));
  const nextTier  = TIERS.find(t => t.min > points)?.name || 'Diamond';
  const history   = loyaltyData?.transactions || [];

  return (
    <AccountShell wishCount={wishCount}>

      {/* Points hero */}
      <Card>
        <div className="relative overflow-hidden px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg,#c087fc,#9869f7)' }}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Star size={12} className="fill-white" />
                <span className="text-[11px] font-semibold uppercase tracking-widest opacity-80">{tier} Member</span>
              </div>
              <div className="text-4xl font-bold tracking-tight">{points.toLocaleString()}</div>
              <div className="text-[12px] opacity-70 mt-0.5">Loyalty Points</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] opacity-70">{ptsToNext.toLocaleString()} to {nextTier}</div>
            </div>
          </div>
          <div className="mt-4 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Card>

      {/* Tier progress */}
      <Card>
        <CardHeader title="Tier Progress" />
        <div className="px-6 py-5">
          <div className="flex items-center gap-1">
            {TIERS.map((t, i) => (
              <React.Fragment key={t.name}>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                    t.name === tier
                      ? 'border-purple-500 text-white'
                      : points >= t.min
                      ? 'border-purple-200 bg-purple-50 text-purple-500'
                      : 'border-[#eaeaea] text-gray-300 bg-white'
                  }`} style={t.name === tier ? { background: 'linear-gradient(135deg,#c087fc,#9869f7)', borderColor: 'transparent' } : {}}>
                    {i + 1}
                  </div>
                  <span className={`text-[10px] font-medium ${t.name === tier ? 'text-purple-600' : 'text-gray-400'}`}>{t.name}</span>
                  <span className="text-[9px] text-gray-300">{t.min.toLocaleString()}+</span>
                </div>
                {i < TIERS.length - 1 && (
                  <div className={`h-px flex-1 -mt-6 ${points >= TIERS[i + 1].min ? 'bg-purple-300' : 'bg-[#eaeaea]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      {/* Perks */}
      <Card>
        <CardHeader title={`${tier} Perks`} />
        <div className="px-6 py-4 grid grid-cols-2 gap-2">
          {PERKS.map((p) => (
            <div key={p.label} className="flex items-center gap-2.5 px-3 py-2.5 border border-[#eaeaea] rounded-md bg-[#fafafa]">
              <span className="text-base leading-none">{p.icon}</span>
              <span className="text-[12px] font-medium text-gray-700">{p.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* History */}
      <Card>
        <CardHeader title="Points History" />
        {history.length === 0 ? (
          <p className="px-6 py-8 text-[13px] text-gray-400 text-center">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-[#eaeaea]">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3">
                <div>
                  <div className="text-[13px] font-medium text-gray-900">{h.description || h.desc}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {h.created_at ? new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : h.date}
                  </div>
                </div>
                <span className={`text-[13px] font-semibold ${h.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

    </AccountShell>
  );
}
