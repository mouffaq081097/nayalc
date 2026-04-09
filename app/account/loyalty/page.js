'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Crown, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const tiers = [
  { name: 'Silver',   min: 0,    color: 'rgba(192,192,192,0.9)' },
  { name: 'Gold',     min: 2000, color: 'rgba(234,179,8,0.9)'   },
  { name: 'Platinum', min: 5000, color: 'rgba(196,167,254,0.9)' },
];

export default function AccountLoyaltyPage() {
  const { loyaltyData } = useAccountData();
  const points = Number(loyaltyData?.stats?.points || 0);
  const nextTierPoints = Number(loyaltyData?.stats?.nextTierPoints || 2000);
  const tier = loyaltyData?.stats?.tier || 'Silver';
  const progress = Math.min(1, points / Math.max(1, nextTierPoints));

  return (
    <>
      <AccountMobileTopBar title="Loyalty" />
      <div className="px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <AccountSectionTitle
            eyebrow="Account"
            title="Loyalty"
            subtitle="Track your points and prestige tier."
          />

          {/* Main loyalty card */}
          <div className="rounded-3xl p-7 relative overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg, #4c1d95, #7e22ce, #9333ea)', boxShadow: '0 12px 40px rgba(147,51,234,0.3)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[70px]" style={{ background: 'rgba(249,168,212,0.28)' }} />
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full blur-[50px]" style={{ background: 'rgba(196,167,254,0.2)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={14} style={{ color: 'rgba(253,224,71,0.85)' }} />
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/60">{tier} Prestige</p>
              </div>
              <div className="flex items-baseline gap-1.5 mb-5">
                <p className="text-5xl font-black text-white tabular-nums">{points.toLocaleString()}</p>
                <p className="text-white/50 text-sm font-semibold">points</p>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(249,168,212,0.9), rgba(253,224,71,0.85))' }}
                />
              </div>
              <div className="flex justify-between">
                <p className="text-[9px] text-white/40 uppercase tracking-widest">{points.toLocaleString()} pts</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">{nextTierPoints.toLocaleString()} pts</p>
              </div>
              <p className="text-xs text-white/60 mt-3 font-medium">
                {Math.max(0, nextTierPoints - points).toLocaleString()} points to reach the next tier
              </p>
            </div>
          </div>

          {/* Tier progression */}
          <div className="rounded-3xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(216,180,254,0.35)', backdropFilter: 'blur(20px)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: 'rgb(147,51,234)' }}>Tier Progression</p>
            {tiers.map((t) => (
              <div key={t.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tier === t.name ? 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' : 'rgba(196,167,254,0.15)' }}>
                  <Star size={13} strokeWidth={2} style={{ color: tier === t.name ? '#fff' : 'rgba(147,51,234,0.5)' }} fill={tier === t.name ? '#fff' : 'none'} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-[13px] font-bold" style={{ color: tier === t.name ? '#3b0764' : 'rgba(59,7,100,0.45)' }}>{t.name}</p>
                    <p className="text-[10px] font-semibold" style={{ color: 'rgba(59,7,100,0.40)' }}>{t.min.toLocaleString()}+ pts</p>
                  </div>
                </div>
                {tier === t.name && (
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' }}>
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
