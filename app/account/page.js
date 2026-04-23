'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AccountMenuList } from './_components/AccountMenuList';
import { setAccountNavDirection } from './_components/navDirection';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Package, Heart, MapPin,
  LogOut, ChevronRight, Star, Sparkles, Plus, Settings, Bell, Lock, ShieldCheck, ShoppingBag, CreditCard, ArrowRight, Camera, Crown, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useUser } from '../context/UserContext';
import { User, Phone, AtSign } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Modal from '../components/Modal';
import AddressInputForm from '../components/AddressInputForm';
import Image from 'next/image';
import { toast } from 'react-toastify';

const stripePromise = getStripe();

// ── Design tokens (Cloud Luxe) ──────────────────────────────────────────────
const CL = {
  glass:      'rgba(255,255,255,0.72)',
  glassBorder:'rgba(216,180,254,0.35)',
  gradient:   'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
  gradientSoft:'linear-gradient(135deg,rgba(196,167,254,0.25),rgba(167,139,250,0.18))',
  purple:     'rgb(126,105,230)',
  purpleMid:  'rgb(147,104,236)',
  purpleLight:'rgba(196,167,254,0.18)',
  bgPage:     'var(--cl-bg)',
  bgLav:      'var(--cl-bg-lavender)',
  bgRose:     'var(--cl-bg-rose)',
  textDeep:   'var(--cl-text-deep)',
  textMid:    'var(--cl-text-mid)',
  textSoft:   'var(--cl-text-soft)',
  cardShadow: '0 4px 32px rgba(147,51,234,0.07), 0 1px 4px rgba(0,0,0,0.04)',
  glowShadow: '0 8px 32px rgba(147,51,234,0.18)',
};

const glassCard = {
  background: CL.glass,
  border: `1px solid ${CL.glassBorder}`,
  backdropFilter: 'blur(20px)',
  boxShadow: CL.cardShadow,
};

// ── Section title ────────────────────────────────────────────────────────────
const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
      <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>{subtitle}</p>
    </div>
    <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight" style={{ color: CL.textDeep }}>
      {title}
    </h2>
  </div>
);

// ── Stat badge ───────────────────────────────────────────────────────────────
const StatBadge = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center gap-1 px-5 py-4 rounded-2xl" style={{ background: CL.purpleLight, border: `1px solid ${CL.glassBorder}` }}>
    <Icon size={16} style={{ color: CL.purple }} strokeWidth={1.5} />
    <p className="text-xl font-black" style={{ color: CL.textDeep }}>{value}</p>
    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: CL.textSoft }}>{label}</p>
  </div>
);

const AccountPageContent = () => {
  const { user, logout } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const { shippingAddresses, addShippingAddress, updateShippingAddress, deleteShippingAddress, contactInfo } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState({ stats: { points: 0, tier: 'Silver', nextTierPoints: 2000 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, wishlistRes, loyaltyRes] = await Promise.all([
          fetchWithAuth(`/api/orders?userId=${user.id}`).then(r => r.json()).catch(() => ({ orders: [] })),
          fetchWithAuth(`/api/wishlist?userId=${user.id}`).then(r => r.json()).catch(() => ({ wishlist: [] })),
          fetchWithAuth(`/api/users/${user.id}/loyalty`).then(r => r.json()).catch(() => ({ stats: { points: 1250, tier: 'Silver', nextTierPoints: 2000 } })),
        ]);
        setOrders(ordersRes.orders || []);
        setWishlistItems(wishlistRes.wishlist || []);
        setLoyaltyData(loyaltyRes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, router, fetchWithAuth]);

  const handleAddressSave = async (addressData) => {
    try {
      if (editingAddress) {
        await updateShippingAddress({ ...addressData, id: editingAddress.id });
        toast.success('Address updated.');
      } else {
        await addShippingAddress(addressData);
        toast.success('Address added.');
      }
      setIsAddressModalOpen(false);
      setEditingAddress(null);
    } catch (err) {
      toast.error('Failed to save address.');
      console.error(err);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Remove this address?')) {
      try {
        await deleteShippingAddress(addressId);
        toast.success('Address removed.');
      } catch (err) {
        toast.error('Failed to remove address.');
      }
    }
  };

  const openAddressModal = (address = null) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: CL.bgPage }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: CL.purpleLight, borderTopColor: CL.purple }}></div>
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse" style={{ color: CL.textSoft }}>Loading your sanctuary</p>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',  icon: Sparkles },
    { id: 'profile',   label: 'Profile',    icon: User,    href: '/account/profile' },
    { id: 'orders',    label: 'Orders',     icon: Package  },
    { id: 'wishlist',  label: 'Wishlist',   icon: Heart    },
    { id: 'addresses', label: 'Addresses',  icon: MapPin   },
    { id: 'settings',  label: 'Settings',   icon: Settings },
  ];

  const loyaltyPct = Math.min(100, Math.round((loyaltyData.stats.points / loyaltyData.stats.nextTierPoints) * 100));

  return (
    <div className="min-h-screen font-sans antialiased relative" style={{ background: CL.bgPage }}>

      {/* Aura background (Now handled globally in LayoutContent.js) */}


      <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-28 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-3 space-y-5 self-start sticky top-24">

            {/* Profile card */}
            <div className="rounded-3xl p-7" style={glassCard}>
              {/* Avatar */}
              <div className="flex flex-col items-center text-center gap-3 mb-7">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ background: CL.gradient }}>
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors"
                    style={{ background: CL.glass, border: `1px solid ${CL.glassBorder}`, color: CL.purple }}>
                    <Camera size={12} />
                  </button>
                  <div className="absolute inset-0 rounded-full -z-10" style={{ boxShadow: CL.glowShadow, opacity: 0.3 }} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight" style={{ color: CL.textDeep }}>{user.first_name} {user.last_name}</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] mt-0.5" style={{ color: CL.purple }}>{loyaltyData.stats.tier} Member</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.href ?? `/account?tab=${item.id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
                      style={active
                        ? { background: 'rgba(196,167,254,0.22)', color: 'rgb(126,105,230)', border: '1px solid rgba(196,167,254,0.45)', boxShadow: '0 2px 12px rgba(147,51,234,0.12)' }
                        : { color: 'rgba(59,7,100,0.50)' }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={16} strokeWidth={active ? 2 : 1.5} />
                        <span className="text-[13px] font-semibold tracking-tight">{item.label}</span>
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
            <div className="rounded-3xl p-7 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #4c1d95, #7e22ce, #9333ea)', boxShadow: CL.glowShadow }}>
              {/* Decorative aura */}
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full blur-[60px]" style={{ background: 'rgba(249,168,212,0.25)' }} />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[50px]" style={{ background: 'rgba(196,167,254,0.2)' }} />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <Star size={14} className="fill-yellow-300 text-yellow-300" />
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60">Loyalty Points</span>
                </div>
                <p className="text-4xl font-black text-white">{loyaltyData.stats.points.toLocaleString()}</p>
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
                    {loyaltyData.stats.nextTierPoints - loyaltyData.stats.points} pts to next tier
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Crown size={12} style={{ color: 'rgba(253,224,71,0.8)' }} />
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{loyaltyData.stats.tier} Prestige</span>
                </div>
              </div>
            </div>

          </aside>

          {/* ── Main content ── */}
          <main className="lg:col-span-9">
            <AnimatePresence mode="wait">

              {/* ── Dashboard ── */}
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                  <SectionTitle title="My Sanctuary" subtitle="Personal Dashboard" />

                  {/* Welcome + stats row */}
                  <div className="grid md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 rounded-3xl p-8 flex flex-col justify-between" style={glassCard}>
                      <div className="space-y-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: CL.purpleLight }}>
                          <ShieldCheck size={20} strokeWidth={1.5} style={{ color: CL.purple }} />
                        </div>
                        <h3 className="text-2xl font-bold leading-snug" style={{ color: CL.textDeep }}>
                          Welcome back,<br />{user.first_name}.
                        </h3>
                        <p className="text-sm leading-relaxed font-normal" style={{ color: 'rgba(59,7,100,0.55)' }}>
                          Manage your orders, wishlist, and addresses all in one place.
                        </p>
                      </div>
                      <div className="flex gap-3 mt-7 flex-wrap">
                        <button
                          onClick={() => router.push('/all-products')}
                          className="px-7 py-3 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all"
                          style={{ background: CL.gradient, boxShadow: '0 4px 16px rgba(147,51,234,0.3)' }}
                        >
                          Shop Now
                        </button>
                        <button
                          onClick={() => router.push('/account?tab=settings')}
                          className="px-7 py-3 text-[11px] font-bold uppercase tracking-widest rounded-full border transition-all"
                          style={{ border: `1px solid ${CL.glassBorder}`, color: CL.textMid, background: CL.glass }}
                        >
                          Settings
                        </button>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex flex-col gap-3">
                      <StatBadge label="Orders" value={orders.length} icon={Package} />
                      <StatBadge label="Wishlist" value={wishlistItems.length} icon={Heart} />
                      <StatBadge label="Addresses" value={shippingAddresses.length} icon={MapPin} />
                    </div>
                  </div>

                  {/* Recent orders + addresses */}
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Recent orders */}
                    <div className="rounded-3xl p-7" style={glassCard}>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-bold tracking-tight" style={{ color: CL.textDeep }}>Recent Orders</h4>
                        <button onClick={() => router.push('/account?tab=orders')} className="text-[10px] font-black uppercase tracking-widest" style={{ color: CL.purple }}>View All</button>
                      </div>
                      {orders.length > 0 ? (
                        <div className="space-y-4">
                          {orders.slice(0, 3).map((order, i) => (
                            <div key={order.id || i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: CL.purpleLight }}>
                                  <Package size={16} strokeWidth={1.5} style={{ color: CL.purple }} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold leading-none mb-0.5" style={{ color: CL.textDeep }}>#{order.id}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: CL.textDeep }}>AED {Number(order.totalAmount).toFixed(2)}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: CL.purple }}>{order.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm italic" style={{ color: 'rgba(59,7,100,0.35)' }}>No orders yet</p>
                        </div>
                      )}
                    </div>

                    {/* Saved addresses */}
                    <div className="rounded-3xl p-7" style={glassCard}>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-bold tracking-tight" style={{ color: CL.textDeep }}>Saved Addresses</h4>
                        <button onClick={() => router.push('/account?tab=addresses')} className="text-[10px] font-black uppercase tracking-widest" style={{ color: CL.purple }}>Manage</button>
                      </div>
                      {shippingAddresses.length > 0 ? (
                        <div className="space-y-4">
                          {shippingAddresses.slice(0, 2).map((addr, i) => (
                            <div key={addr.id || i} className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CL.purpleLight }}>
                                <MapPin size={16} strokeWidth={1.5} style={{ color: CL.purple }} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold leading-none mb-0.5" style={{ color: CL.textDeep }}>{addr.addressLabel || 'Home'}</p>
                                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(59,7,100,0.45)' }}>{addr.addressLine1}, {addr.city}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm italic" style={{ color: 'rgba(59,7,100,0.35)' }}>No addresses saved</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Orders ── */}
              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                  <SectionTitle title="Order History" subtitle="Your Acquisitions" />
                  <div className="space-y-3">
                    {orders.map((order, i) => (
                      <Link key={order.id || i} href={`/account/orders/${order.id}`} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl p-6 transition-all hover:-translate-y-0.5" style={glassCard}>
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: CL.purpleLight }}>
                            <Package size={22} strokeWidth={1.5} style={{ color: CL.purple }} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-bold" style={{ color: CL.textDeep }}>Order #{order.id}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em]">{new Date(order.createdAt).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
                              <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: CL.purple }}>{order.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-8 pt-4 md:pt-0" style={{ borderTop: '1px solid transparent' }}>
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">Total</p>
                            <p className="text-xl font-black" style={{ color: CL.textDeep }}>AED {Number(order.totalAmount).toFixed(2)}</p>
                          </div>
                          <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{ background: CL.purpleLight, color: CL.purple }}>
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </Link>
                    ))}
                    {orders.length === 0 && (
                      <div className="py-28 text-center rounded-3xl border border-dashed" style={{ borderColor: CL.glassBorder, background: CL.purpleLight }}>
                        <Package size={44} strokeWidth={1} className="mx-auto mb-5" style={{ color: 'rgba(147,51,234,0.3)' }} />
                        <h3 className="text-xl font-bold mb-2" style={{ color: CL.textDeep }}>No Orders Yet</h3>
                        <p className="text-xs uppercase tracking-widest" style={{ color: CL.textSoft }}>Start shopping to see your orders here</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Wishlist ── */}
              {activeTab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                  <SectionTitle title="My Wishlist" subtitle="Saved for Later" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {wishlistItems.map((item, i) => (
                      <div key={item.id || i} className="rounded-3xl overflow-hidden transition-all group hover:-translate-y-1" style={{ ...glassCard, boxShadow: CL.cardShadow }}>
                        <div className="aspect-square relative p-6" style={{ background: CL.bgLav }}>
                          <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-4 transition-transform duration-700 group-hover:scale-105" />
                          <button className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-md" style={{ background: CL.glass, color: CL.purple }}>
                            <Heart size={15} fill="currentColor" />
                          </button>
                        </div>
                        <div className="p-6 space-y-3">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: CL.purple }}>{item.brandName || 'Naya Lumière'}</p>
                            <h4 className="text-sm font-bold tracking-tight line-clamp-1" style={{ color: CL.textDeep }}>{item.name}</h4>
                          </div>
                          <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${CL.glassBorder}` }}>
                            <p className="text-base font-black" style={{ color: CL.textDeep }}>AED {item.price}</p>
                            <button className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all" style={{ background: CL.gradient }}>
                              <ShoppingBag size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {wishlistItems.length === 0 && (
                      <div className="md:col-span-3 py-28 text-center rounded-3xl border border-dashed" style={{ borderColor: CL.glassBorder, background: CL.purpleLight }}>
                        <Heart size={44} strokeWidth={1} className="mx-auto mb-5" style={{ color: 'rgba(147,51,234,0.3)' }} />
                        <h3 className="text-xl font-bold mb-2" style={{ color: CL.textDeep }}>Wishlist is Empty</h3>
                        <p className="text-xs uppercase tracking-widest" style={{ color: CL.textSoft }}>Save products you love to find them here</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Addresses ── */}
              {activeTab === 'addresses' && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <SectionTitle title="My Addresses" subtitle="Delivery Locations" />
                    <button
                      onClick={() => openAddressModal()}
                      className="flex items-center gap-2 px-6 py-3 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all flex-shrink-0 mt-1"
                      style={{ background: CL.gradient, boxShadow: '0 4px 16px rgba(147,51,234,0.3)' }}
                    >
                      <Plus size={14} /> Add Address
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    {shippingAddresses.map((addr, i) => (
                      <div 
                        key={addr.id || i} 
                        onClick={() => openAddressModal(addr)}
                        className="rounded-3xl p-7 flex flex-col justify-between transition-all hover:-translate-y-0.5 cursor-pointer group/card" 
                        style={glassCard}
                      >
                        <div className="space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: CL.purpleLight }}>
                              <MapPin size={20} strokeWidth={1.5} style={{ color: CL.purple }} />
                            </div>
                            <div className="flex items-center gap-2">
                              {addr.isDefault && (
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full text-white" style={{ background: CL.gradient }}>
                                  Primary
                                </span>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }} 
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-gray-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold tracking-tight" style={{ color: CL.textDeep }}>{addr.addressLabel || 'Address'}</h4>
                            <p className="text-sm leading-relaxed" style={{ color: 'rgba(59,7,100,0.50)' }}>
                              {addr.addressLine1}<br />{addr.city}, {addr.country}
                            </p>
                          </div>
                        </div>
                        <div className="pt-4 mt-4 opacity-0 group-hover/card:opacity-100 transition-opacity" style={{ borderTop: `1px solid ${CL.glassBorder}` }}>
                          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: CL.purple }}>Click to edit address</p>
                        </div>
                      </div>
                    ))}
                    {shippingAddresses.length === 0 && (
                      <div className="md:col-span-2 py-28 text-center rounded-3xl border border-dashed" style={{ borderColor: CL.glassBorder, background: CL.purpleLight }}>
                        <MapPin size={44} strokeWidth={1} className="mx-auto mb-5" style={{ color: 'rgba(147,51,234,0.3)' }} />
                        <h3 className="text-xl font-bold mb-2" style={{ color: CL.textDeep }}>No Addresses Saved</h3>
                        <p className="text-xs uppercase tracking-widest" style={{ color: CL.textSoft }}>Add your first delivery address above</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Settings ── */}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                  <SectionTitle title="Account Settings" subtitle="Preferences" />

                  {/* Profile info card */}
                  <div className="rounded-3xl p-7" style={glassCard}>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>Profile Information</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { label: 'Username',      icon: AtSign, value: user.username || '—' },
                        { label: 'Email Address', icon: User,   value: user.email    || '—' },
                        { label: 'Phone Number',  icon: Phone,  value: contactInfo?.phone || '—' },
                      ].map(({ label, icon: Icon, value }) => (
                        <div key={label} className="flex items-center gap-4 rounded-2xl px-5 py-4" style={{ background: CL.purpleLight, border: `1px solid ${CL.glassBorder}` }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CL.glass, color: CL.purple }}>
                            <Icon size={16} strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: CL.textSoft }}>{label}</p>
                            <p className="text-sm font-semibold truncate" style={{ color: CL.textDeep }}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl overflow-hidden" style={glassCard}>
                    <div>
                      {[
                        { label: 'Notification Preferences', Icon: Bell, desc: 'Manage email and push notification settings.' },
                        { label: 'Security & Password', Icon: Lock, desc: 'Update your password and security settings.' },
                        { label: 'Privacy Settings', Icon: ShieldCheck, desc: 'Control how your data is used and stored.' },
                        { label: 'Payment Methods', Icon: CreditCard, desc: 'Manage your saved payment instruments.' },
                      ].map((item, i, arr) => (
                        <button
                          key={item.label}
                          className="w-full p-7 flex items-center justify-between group transition-all text-left hover:bg-white/40"
                          style={{ borderBottom: i < arr.length - 1 ? `1px solid ${CL.glassBorder}` : 'none' }}
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all" style={{ background: CL.purpleLight, color: CL.purple }}>
                              <item.Icon size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-base font-bold mb-0.5" style={{ color: CL.textDeep }}>{item.label}</p>
                              <p className="text-xs leading-relaxed" style={{ color: 'rgba(59,7,100,0.45)' }}>{item.desc}</p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" style={{ color: CL.textSoft }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>

        </div>
      </div>

      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => { setIsAddressModalOpen(false); setEditingAddress(null); }}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
        size="max-w-3xl"
      >
        <AddressInputForm
          initialData={editingAddress}
          onSave={handleAddressSave}
          onCancel={() => { setIsAddressModalOpen(false); setEditingAddress(null); }}
        />
      </Modal>
    </div>
  );
};

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    setAccountNavDirection(-1);
  }, []);

  return (
    <>
      <AccountMenuList />

      <div className="hidden md:block">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cl-bg)' }}>
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(196,167,254,0.3)', borderTopColor: 'rgb(147,51,234)' }} />
            </div>
          }
        >
          <Elements stripe={stripePromise}>
            <AccountPageContent />
          </Elements>
        </Suspense>
      </div>
    </>
  );
}
