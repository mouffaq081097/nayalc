'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { useRouter } from 'next/navigation';
import { Package, Heart, MapPin, Star, ShieldCheck, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 24px rgba(147,51,234,0.07)',
};

const StatCard = ({ label, value, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col gap-3 p-5 rounded-2xl text-left transition-all active:scale-[0.98]"
    style={glass}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
      <Icon size={18} strokeWidth={1.75} />
    </div>
    <div>
      <p className="text-2xl font-black tabular-nums" style={{ color: '#3b0764' }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(147,51,234,0.6)' }}>{label}</p>
    </div>
  </button>
);

export default function AccountDashboardPage() {
  const router = useRouter();
  const { user, orders, wishlistItems, addresses, loyaltyData } = useAccountData();
  const points = Number(loyaltyData?.stats?.points || 0);
  const nextTierPoints = Number(loyaltyData?.stats?.nextTierPoints || 2000);
  const progress = Math.min(1, points / Math.max(1, nextTierPoints));

  return (
    <>
      <AccountMobileTopBar title="Dashboard" />
      <div className="px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <AccountSectionTitle
            eyebrow="Account"
            title={`Welcome, ${user?.first_name || 'there'}.`}
            subtitle="Your personal sanctuary overview."
          />

          {/* Welcome card */}
          <div className="mb-5 rounded-3xl p-6" style={glass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                <ShieldCheck size={18} strokeWidth={1.75} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(147,51,234,0.6)' }}>Your Sanctuary</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(59,7,100,0.55)' }}>
              Manage your orders, wishlist, and delivery addresses all in one place.
            </p>
            <button
              onClick={() => router.push('/all-products')}
              className="mt-5 w-full py-3 rounded-full text-white text-[11px] font-bold uppercase tracking-widest"
              style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))', boxShadow: '0 4px 16px rgba(147,51,234,0.25)' }}
            >
              Shop Now
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatCard label="Orders" value={orders.length} icon={Package} onClick={() => router.push('/account/orders')} />
            <StatCard label="Wishlist" value={wishlistItems.length} icon={Heart} onClick={() => router.push('/account/wishlist')} />
            <StatCard label="Saved" value={addresses.length} icon={MapPin} onClick={() => router.push('/account/addresses')} />
          </div>

          {/* Loyalty card */}
          <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4c1d95, #7e22ce, #9333ea)', boxShadow: '0 8px 32px rgba(147,51,234,0.25)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px]" style={{ background: 'rgba(249,168,212,0.25)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Crown size={13} style={{ color: 'rgba(253,224,71,0.8)' }} />
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60">{loyaltyData?.stats?.tier || 'Silver'} Member</p>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <p className="text-3xl font-black text-white tabular-nums">{points.toLocaleString()}</p>
                <p className="text-white/50 text-xs font-semibold">pts</p>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden mt-3 mb-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(249,168,212,0.9), rgba(253,224,71,0.85))' }}
                />
              </div>
              <p className="text-[9px] text-white/40 uppercase tracking-widest">
                {Math.max(0, nextTierPoints - points).toLocaleString()} pts to next tier
              </p>
              <button
                onClick={() => router.push('/account/loyalty')}
                className="mt-4 w-full py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                View Loyalty Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
