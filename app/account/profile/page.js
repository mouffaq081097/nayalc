'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Sparkles, Package, Heart, Star, MapPin, Settings,
  Camera, Crown, LogOut, ChevronRight,
} from 'lucide-react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { setAccountNavDirection } from '../_components/navDirection';
import { useAccountData } from '../_components/useAccountData';
import { useSession } from 'next-auth/react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';

// ── Design tokens (Cloud Luxe) ──────────────────────────────────────────────
const CL = {
  glass:       'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(216,180,254,0.35)',
  gradient:    'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
  purple:      'rgb(126,105,230)',
  purpleMid:   'rgb(147,104,236)',
  purpleLight: 'rgba(196,167,254,0.18)',
  bgPage:      'var(--cl-bg)',
  bgLav:       'var(--cl-bg-lavender)',
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

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { update } = useSession();
  const { loyaltyData } = useAccountData();

  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [fetched, setFetched] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const { fetchWithAuth } = useAppContext();

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchWithAuth(`/api/users/${user.id}/profile`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const vals = {
          first_name:   data.first_name   || '',
          last_name:    data.last_name    || '',
          phone_number: data.phone_number || '',
        };
        setForm(vals);
        setFetched(vals);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, fetchWithAuth]);

  const handleChange = field => e => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleDiscard = () => { setForm(fetched); setError(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      
      // Update session with new name
      await update({
        first_name: form.first_name,
        last_name: form.last_name,
      });

      setFetched({ ...form });
      setSaved(true);
      toast.success('Profile updated successfully!');
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/profile-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      // Update local session immediately
      await update({
        profile_image: data.imageUrl
      });
      
      toast.success('Profile photo updated!');
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const tier   = loyaltyData?.stats?.tier        || 'Silver';
  const points = loyaltyData?.stats?.points       ?? 0;
  const nextPt = loyaltyData?.stats?.nextTierPoints ?? 2000;
  const loyaltyPct = Math.min(100, Math.round((points / nextPt) * 100));

  return (
    <>
      <AccountMobileTopBar title="My Profile" />

      <div className="min-h-screen font-sans antialiased relative" style={{ background: CL.bgPage }}>

        {/* Aura background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[140px]" style={{ background: 'rgba(196,167,254,0.18)' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ background: 'rgba(249,168,212,0.12)' }} />
          <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(216,180,254,0.10)' }} />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-28 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8">

            {/* ── Sidebar ── */}
            <aside className="hidden md:block lg:col-span-3 space-y-5 self-start sticky top-24">

              {/* Profile card */}
              <div className="rounded-3xl p-7" style={glassCard}>
                <div className="flex flex-col items-center text-center gap-3 mb-7">
                  <div className="relative group/avatar">
                    <input 
                      type="file" 
                      id="profile-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg overflow-hidden relative"
                      style={{ background: CL.gradient }}
                    >
                      {user?.profile_image ? (
                        <img src={user.profile_image} alt={user.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <>{user?.first_name?.[0]}{user?.last_name?.[0]}</>
                      )}
                      
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="profile-upload"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95"
                      style={{ background: 'white', border: `1px solid ${CL.glassBorder}`, color: CL.purple }}
                    >
                      <Camera size={14} strokeWidth={2.5} />
                    </label>
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
                    const active = id === 'profile';
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
                  key="profile"
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
                      Personal Details
                    </h2>
                  </div>

                  {loading ? (
                    <div className="rounded-3xl p-16 flex items-center justify-center" style={glassCard}>
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: CL.purpleLight, borderTopColor: CL.purple }}></div>
                        <p className="text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse" style={{ color: CL.textSoft }}>Loading profile</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      {/* Personal info card */}
                      <div className="rounded-3xl p-8 mb-5" style={glassCard}>
                        <div className="flex items-center gap-2 mb-6">
                          <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
                          <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>Personal info</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          {[
                            { field: 'first_name', label: 'First name', placeholder: 'First name', type: 'text' },
                            { field: 'last_name',  label: 'Last name',  placeholder: 'Last name',  type: 'text' },
                          ].map(({ field, label, placeholder, type }) => (
                            <div key={field}>
                              <label className="block text-[9.5px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: CL.purple }}>{label}</label>
                              <input
                                type={type}
                                value={form[field]}
                                onChange={handleChange(field)}
                                placeholder={placeholder}
                                className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none focus:ring-2"
                                style={{
                                  background:  'rgba(255,255,255,0.85)',
                                  border:      `1px solid ${CL.glassBorder}`,
                                  color:       CL.textDeep,
                                  focusRingColor: CL.purple,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Contact card */}
                      <div className="rounded-3xl p-8 mb-5" style={glassCard}>
                        <div className="flex items-center gap-2 mb-6">
                          <span className="w-5 h-px" style={{ background: CL.gradient }}></span>
                          <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: CL.purple }}>Contact</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[9.5px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: CL.purple }}>Email address</label>
                            <input
                              type="email"
                              value={user?.email || ''}
                              readOnly
                              className="w-full rounded-xl px-4 py-3 text-sm font-medium cursor-not-allowed"
                              style={{
                                background: 'rgba(255,255,255,0.85)',
                                border:     `1px solid ${CL.glassBorder}`,
                                color:      CL.textDeep,
                                opacity:    0.55,
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: CL.purple }}>Phone number</label>
                            <input
                              type="tel"
                              value={form.phone_number}
                              onChange={handleChange('phone_number')}
                              placeholder="+971 50 000 0000"
                              className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                              style={{
                                background: 'rgba(255,255,255,0.85)',
                                border:     `1px solid ${CL.glassBorder}`,
                                color:      CL.textDeep,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {error && (
                        <p className="text-xs font-medium mb-4" style={{ color: 'rgba(239,68,68,0.85)' }}>{error}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-8 py-3 text-white text-[11px] font-black uppercase tracking-widest rounded-full transition-all"
                          style={{
                            background:  CL.gradient,
                            boxShadow:   '0 4px 16px rgba(147,51,234,0.3)',
                            opacity:     saving ? 0.6 : 1,
                          }}
                        >
                          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDiscard}
                          className="px-7 py-3 text-[11px] font-bold uppercase tracking-widest rounded-full border transition-all"
                          style={{
                            border:     `1px solid ${CL.glassBorder}`,
                            color:      CL.textMid,
                            background: CL.glass,
                          }}
                        >
                          Discard
                        </button>
                      </div>
                    </form>
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
