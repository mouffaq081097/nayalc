'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Sparkles, Package, Heart, Star, MapPin, Settings,
  Camera, Crown, LogOut, ChevronRight, Plus, Trash2,
} from 'lucide-react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { setAccountNavDirection } from '../_components/navDirection';
import { useAccountData } from '../_components/useAccountData';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal';
import AddressInputForm from '../../components/AddressInputForm';

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

export default function AccountAddressesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { loyaltyData } = useAccountData();
  const { shippingAddresses, addShippingAddress, updateShippingAddress, deleteShippingAddress } = useUser();

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const tier       = loyaltyData?.stats?.tier           || 'Silver';
  const points     = loyaltyData?.stats?.points          ?? 0;
  const nextPt     = loyaltyData?.stats?.nextTierPoints  ?? 2000;
  const loyaltyPct = Math.min(100, Math.round((points / nextPt) * 100));

  const openModal = (address = null) => { setEditingAddress(address); setIsModalOpen(true); };

  const handleSave = async (formData) => {
    if (editingAddress) {
      await updateShippingAddress({ ...formData, id: editingAddress.id });
    } else {
      await addShippingAddress(formData);
    }
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    try {
      await deleteShippingAddress(id);
      toast.success('Address removed');
    } catch {
      toast.error('Error removing address');
    }
  };

  return (
    <>
      <AccountMobileTopBar title="Addresses" />

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
                    const active = id === 'addresses';
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
                <motion.div key="addresses" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">

                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>My Account</p>
                      </div>
                      <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight" style={{ color: CL.textDeep }}>My Addresses</h2>
                    </div>
                    <button
                      onClick={() => openModal()}
                      className="flex items-center gap-2 px-6 py-3 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all flex-shrink-0 mt-1"
                      style={{ background: CL.gradient, boxShadow: '0 4px 16px rgba(147,51,234,0.3)' }}
                    >
                      <Plus size={14} /> Add Address
                    </button>
                  </div>

                  {shippingAddresses.length === 0 ? (
                    <div className="py-28 text-center rounded-3xl border border-dashed" style={{ borderColor: CL.glassBorder, background: CL.purpleLight }}>
                      <MapPin size={44} strokeWidth={1} className="mx-auto mb-5" style={{ color: 'rgba(147,51,234,0.3)' }} />
                      <h3 className="text-xl font-bold mb-2" style={{ color: CL.textDeep }}>No Addresses Saved</h3>
                      <p className="text-xs uppercase tracking-widest mb-6" style={{ color: CL.textSoft }}>Add your first delivery address above</p>
                      <button onClick={() => openModal()} className="px-8 py-3 text-white text-[11px] font-black uppercase tracking-widest rounded-full" style={{ background: CL.gradient, boxShadow: '0 4px 16px rgba(147,51,234,0.3)' }}>
                        Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-5">
                      {shippingAddresses.map((addr, i) => (
                        <div key={addr.id || i} onClick={() => openModal(addr)}
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
                                  <span className="text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full text-white" style={{ background: CL.gradient }}>Primary</span>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                                  onBlur={() => setConfirmDeleteId(null)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 ${confirmDeleteId === addr.id ? 'text-white' : 'text-red-400'}`}
                                  style={confirmDeleteId === addr.id ? { background: 'rgb(220,38,38)', border: '1px solid rgb(220,38,38)' } : { background: 'rgba(254,226,226,0.6)', border: '1px solid rgba(252,165,165,0.4)' }}
                                >
                                  <Trash2 size={12} />
                                  {confirmDeleteId === addr.id ? 'Confirm?' : 'Delete'}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold tracking-tight" style={{ color: CL.textDeep }}>{addr.addressLabel || 'Address'}</h4>
                              <p className="text-sm leading-relaxed" style={{ color: 'rgba(59,7,100,0.50)' }}>
                                {[addr.addressLine1, addr.addressLine2, addr.city, addr.country].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${CL.glassBorder}` }}>
                            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: CL.purple }}>Tap to edit</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </main>

          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAddress(null); }} title={editingAddress ? 'Edit Address' : 'New Address'} size="max-w-3xl">
        <AddressInputForm initialData={editingAddress} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingAddress(null); }} />
      </Modal>
    </>
  );
}
