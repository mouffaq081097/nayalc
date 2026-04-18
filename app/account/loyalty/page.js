'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Sparkles, Package, Heart, Star, MapPin, Settings,
  Camera, Crown, LogOut, ChevronRight,
} from 'lucide-react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { setAccountNavDirection } from '../_components/navDirection';
import { useAccountData } from '../_components/useAccountData';
import { useAuth } from '../../context/AuthContext';

const CL = {
  glass:       'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(216,180,254,0.35)',
  gradient:    'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
  purple:      'rgb(126,105,230)',
  purpleLight: 'rgba(196,167,254,0.18)',
  bgPage:      'var(--cl-bg)',
  textDeep:    'var(--cl-text-deep)',
  textMid:     'var(--cl-text-mid)',
  textSoft:    'var(--cl-text-soft)',
  cardShadow:  '0 4px 32px rgba(147,51,234,0.07), 0 1px 4px rgba(0,0,0,0.04)',
  glowShadow:  '0 8px 32px rgba(147,51,234,0.18)',
};

const glassCard = {
  background:     CL.glass,
  border:         `1px solid ${CL.glassBorder}`,
  backdropFilter: 'blur(20px)',
  boxShadow:      CL.cardShadow,
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/account',            Icon: Sparkles },
  { id: 'profile',   label: 'Profile',   href: '/account/profile',    Icon: User     },
  { id: 'orders',    label: 'Orders',    href: '/account/orders',     Icon: Package  },
  { id: 'wishlist',  label: 'Wishlist',  href: '/account/wishlist',   Icon: Heart    },
  { id: 'loyalty',   label: 'Loyalty',   href: '/account/loyalty',    Icon: Star     },
  { id: 'addresses', label: 'Addresses', href: '/account/addresses',  Icon: MapPin   },
  { id: 'settings',  label: 'Settings',  href: '/account/settings',   Icon: Settings },
];

const tiers = [
  { name: 'Silver',   min: 0,    color: 'rgba(192,192,192,0.9)' },
  { name: 'Gold',     min: 2000, color: 'rgba(234,179,8,0.9)'   },
  { name: 'Platinum', min: 5000, color: 'rgba(196,167,254,0.9)' },
];

export default function AccountLoyaltyPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { loyaltyData } = useAccountData();

  const points     = Number(loyaltyData?.stats?.points        || 0);
  const nextPt     = Number(loyaltyData?.stats?.nextTierPoints || 2000);
  const tier       = loyaltyData?.stats?.tier || 'Silver';
  const loyaltyPct = Math.min(100, Math.round((points / nextPt) * 100));

  return (
    <>
      <AccountMobileTopBar title="Loyalty" />

      <div className="min-h-screen font-sans antialiased relative" style={{ background: CL.bgPage }}>
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[140px]" style={{ background: 'rgba(196,167,254,0.18)' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ background: 'rgba(249,168,212,0.12)' }} />
          <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(216,180,254,0.10)' }} />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-28 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8">

            <aside className="hidden md:block lg:col-span-3 space-y-5 self-start sticky top-24">
              <div className="rounded-3xl p-7" style={glassCard}>
                <div className="flex flex-col items-center text-center gap-3 mb-7">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ background: CL.gradient }}>
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md" style={{ background: CL.glass, border: `1px solid ${CL.glassBorder}`, color: CL.purple }}>
                      <Camera size={12} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight" style={{ color: CL.textDeep }}>{user?.first_name} {user?.last_name}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] mt-0.5" style={{ color: CL.purple }}>{tier} Member</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {NAV_ITEMS.map(({ id, label, href, Icon }) => {
                    const active = id === 'loyalty';
                    return (
                      <button key={id} onClick={() => { setAccountNavDirection(active ? 0 : 1); router.push(href); }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
                        style={active ? { background: 'rgba(196,167,254,0.22)', color: 'rgb(126,105,230)', border: '1px solid rgba(196,167,254,0.45)', boxShadow: '0 2px 12px rgba(147,51,234,0.12)' } : { color: 'rgba(59,7,100,0.50)' }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                          <span className="text-[13px] font-semibold tracking-tight">{label}</span>
                        </div>
                        {active && <ChevronRight size={13} />}
                      </button>
                    );
                  })}
                </nav>
                <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${CL.glassBorder}` }}>
                  <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-red-400 hover:text-red-600 hover:bg-red-50/60">
                    <LogOut size={16} strokeWidth={1.5} />
                    <span className="text-[13px] font-semibold">Sign Out</span>
                  </button>
                </div>
              </div>

              <div className="rounded-3xl p-7 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #4c1d95, #7e22ce, #9333ea)', boxShadow: CL.glowShadow }}>
                <div className="absolute top-0 right-0 w-36 h-36 rounded-full blur-[60px]" style={{ background: 'rgba(249,168,212,0.25)' }} />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[50px]" style={{ background: 'rgba(196,167,254,0.2)' }} />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="fill-yellow-300 text-yellow-300" />
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60">Loyalty Points</span>
                  </div>
                  <p className="text-4xl font-black text-white">{points.toLocaleString()}</p>
                  <div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${loyaltyPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, rgba(249,168,212,0.9), rgba(253,224,71,0.9))' }} />
                    </div>
                    <p className="text-[9px] text-white/40 font-medium uppercase tracking-widest mt-2">{nextPt - points} pts to next tier</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Crown size={12} style={{ color: 'rgba(253,224,71,0.8)' }} />
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{tier} Prestige</span>
                  </div>
                </div>
              </div>
            </aside>

            <main className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div key="loyalty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">

                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>My Account</p>
                    </div>
                    <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight" style={{ color: CL.textDeep }}>Loyalty</h2>
                  </div>

                  {/* Main loyalty card */}
                  <div className="rounded-3xl p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4c1d95, #7e22ce, #9333ea)', boxShadow: CL.glowShadow }}>
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px]" style={{ background: 'rgba(249,168,212,0.28)' }} />
                    <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full blur-[60px]" style={{ background: 'rgba(196,167,254,0.2)' }} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Crown size={14} style={{ color: 'rgba(253,224,71,0.85)' }} />
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/60">{tier} Prestige</p>
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-5">
                        <p className="text-6xl font-black text-white tabular-nums">{points.toLocaleString()}</p>
                        <p className="text-white/50 text-sm font-semibold">points</p>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${loyaltyPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, rgba(249,168,212,0.9), rgba(253,224,71,0.85))' }} />
                      </div>
                      <div className="flex justify-between mt-2">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest">{points.toLocaleString()} pts</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest">{nextPt.toLocaleString()} pts</p>
                      </div>
                      <p className="text-xs text-white/60 mt-3 font-medium">{Math.max(0, nextPt - points).toLocaleString()} points to reach the next tier</p>
                    </div>
                  </div>

                  {/* Tier progression */}
                  <div className="rounded-3xl p-8" style={glassCard}>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>Tier Progression</p>
                    </div>
                    <div className="space-y-5">
                      {tiers.map((t) => (
                        <div key={t.name} className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tier === t.name ? CL.gradient : CL.purpleLight }}>
                            <Star size={14} strokeWidth={2} style={{ color: tier === t.name ? '#fff' : 'rgba(147,51,234,0.5)' }} fill={tier === t.name ? '#fff' : 'none'} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                              <p className="text-[14px] font-bold" style={{ color: tier === t.name ? CL.textDeep : 'rgba(59,7,100,0.45)' }}>{t.name}</p>
                              <p className="text-[10px] font-semibold" style={{ color: 'rgba(59,7,100,0.40)' }}>{t.min.toLocaleString()}+ pts</p>
                            </div>
                          </div>
                          {tier === t.name && (
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full text-white" style={{ background: CL.gradient }}>
                              Current
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              </AnimatePresence>
            </main>

          </div>
        </div>
      </div>
    </>
  );
}
