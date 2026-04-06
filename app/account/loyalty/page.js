'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';

export default function AccountLoyaltyPage() {
  const { loyaltyData } = useAccountData();
  const points = Number(loyaltyData?.stats?.points || 0);
  const nextTierPoints = Number(loyaltyData?.stats?.nextTierPoints || 2000);
  const progress = Math.max(0, Math.min(1, points / Math.max(1, nextTierPoints)));

  return (
    <>
      <AccountMobileTopBar title="Loyalty" />
      <div className="px-4 pb-28 pt-6 md:px-6 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-2xl md:max-w-[1400px]">
          <AccountSectionTitle
            eyebrow="Account"
            title="Loyalty"
            subtitle="Track your points and prestige tier."
          />

          <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-gray-900 p-8 text-white shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              {String(loyaltyData?.stats?.tier || 'Silver')} tier
            </p>
            <p className="mt-3 text-4xl font-black tabular-nums">{points.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
              points
            </p>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-brand-pink"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-white/60">
              {Math.max(0, nextTierPoints - points).toLocaleString()} points to next tier.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

