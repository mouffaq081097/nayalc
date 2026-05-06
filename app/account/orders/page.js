'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Sparkles, Package, Heart, Star, MapPin, Settings,
  Camera, Crown, LogOut, ChevronRight, ArrowRight,
} from 'lucide-react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { setAccountNavDirection } from '../_components/navDirection';
import { useAccountData } from '../_components/useAccountData';
import { useAuth } from '../../context/AuthContext';

// ── Design tokens (Cloud Luxe) ──────────────────────────────────────────────
const CL = {
  glass:       'rgba(255,255,255,0.72)',
  glassBorder: 'var(--ink-200)',
  gradient:    'var(--brand-gradient)',
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

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders, loyaltyData } = useAccountData();

  const tier      = loyaltyData?.stats?.tier           || 'Silver';
  const points    = loyaltyData?.stats?.points          ?? 0;
  const nextPt    = loyaltyData?.stats?.nextTierPoints  ?? 2000;
  const loyaltyPct = Math.min(100, Math.round((points / nextPt) * 100));

  return (
    <>
      <AccountMobileTopBar title="Orders" />

      <div className="min-h-screen font-sans antialiased relative" style={{ background: CL.bgPage }}>

        <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-28 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8">

            {/* ── Sidebar ── */}
            <aside className="hidden md:block lg:col-span-3 space-y-5 self-start sticky top-24">

              {/* Profile card */}
              <div className="rounded-3xl p-7" style={glassCard}>
                <div className="flex flex-col items-center text-center gap-3 mb-7">
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg"
                      style={{ background: CL.gradient }}
                    >
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <button
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors"
                      style={{ background: CL.glass, border: `1px solid ${CL.glassBorder}`, color: CL.purple }}
                    >
                      <Camera size={12} />
                    </button>
                    <div className="absolute inset-0 rounded-full -z-10" style={{ boxShadow: CL.glowShadow, opacity: 0.3 }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight" style={{ color: CL.textDeep }}>
                      {user?.first_name} {user?.last_name}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] mt-0.5" style={{ color: CL.purple }}>
                      {tier} Member
                    </p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {NAV_ITEMS.map(({ id, label, href, Icon }) => {
                    const active = id === 'orders';
                    return (
                      <button
                        key={id}
                        onClick={() => { setAccountNavDirection(active ? 0 : 1); router.push(href); }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
                        style={active
                          ? { background: 'rgba(196,167,254,0.22)', color: 'rgb(126,105,230)', border: '1px solid rgba(196,167,254,0.45)', boxShadow: '0 2px 12px rgba(147,51,234,0.12)' }
                          : { color: 'rgba(59,7,100,0.50)' }
                        }
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
                  <button
                    onClick={() => { logout(); router.push('/'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-red-400 hover:text-red-600 hover:bg-red-50/60"
                  >
                    <LogOut size={16} strokeWidth={1.5} />
                    <span className="text-[13px] font-semibold">Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Loyalty card */}
              <div className="rounded-3xl p-7 overflow-hidden relative" style={{ background: 'var(--brand-gradient)', boxShadow: CL.glowShadow }}>
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[50px]" style={{ background: 'rgba(196,167,254,0.2)' }} />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="fill-yellow-300 text-yellow-300" />
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60">Loyalty Points</span>
                  </div>
                  <p className="text-4xl font-black text-white">{points.toLocaleString()}</p>
                  <div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${loyaltyPct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, rgba(249,168,212,0.9), rgba(253,224,71,0.9))' }}
                      />
                    </div>
                    <p className="text-[9px] text-white/40 font-medium uppercase tracking-widest mt-2">
                      {nextPt - points} pts to next tier
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Crown size={12} style={{ color: 'rgba(253,224,71,0.8)' }} />
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{tier} Prestige</span>
                  </div>
                </div>
              </div>

            </aside>

            {/* ── Main content ── */}
            <main className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="space-y-6"
                >
                  {/* Section title */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>My Account</p>
                    </div>
                    <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight" style={{ color: CL.textDeep }}>
                      Order History
                    </h2>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-28 text-center rounded-3xl border border-dashed" style={{ borderColor: CL.glassBorder, background: CL.purpleLight }}>
                      <Package size={44} strokeWidth={1} className="mx-auto mb-5" style={{ color: 'rgba(147,51,234,0.3)' }} />
                      <h3 className="text-xl font-bold mb-2" style={{ color: CL.textDeep }}>No Orders Yet</h3>
                      <p className="text-xs uppercase tracking-widest" style={{ color: CL.textSoft }}>
                        When you place an order, it will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order, i) => (
                        <Link
                          key={order.id || i}
                          href={`/account/orders/${order.id}`}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                          style={glassCard}
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: CL.purpleLight }}>
                              <Package size={22} strokeWidth={1.5} style={{ color: CL.purple }} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base font-bold" style={{ color: CL.textDeep }}>Order #{order.id}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em]">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: CL.purple }}>
                                  {String(order.status || 'Processing')}
                                </span>
                                {order.pointsEarned && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
                                    <div className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                                      <Star size={8} className="fill-purple-500 text-purple-500" />
                                      <span className="text-[9px] font-black text-purple-600 uppercase tracking-tight">+{order.pointsEarned} Points</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-8 pt-4 md:pt-0">
                            <div className="text-left md:text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">Total</p>
                              <p className="text-xl font-black" style={{ color: CL.textDeep }}>AED {Number(order.totalAmount || 0).toFixed(2)}</p>
                            </div>
                            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{ background: CL.purpleLight, color: CL.purple }}>
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

          </div>
        </div>
      </div>
    </>
  );
}
