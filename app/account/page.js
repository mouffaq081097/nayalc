'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  User, Package, Heart, MapPin,
  LogOut, ChevronRight, Star, Sparkles, Plus, Settings, Bell, ShieldCheck, ShoppingBag, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';import Modal from '../components/Modal';
import AddressInputForm from '../components/AddressInputForm';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';

const stripePromise = getStripe();

const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-10">
        <h2 className="text-[32px] md:text-[42px] font-serif italic text-[#1d1d1f] tracking-tight leading-none mb-2">
            {title}
        </h2>
        <p className="text-[11px] font-black text-brand-pink uppercase tracking-[0.4em]">{subtitle}</p>
    </div>
);

const InfoTile = ({ label, value, icon: Icon, onClick, accentColor = "bg-brand-pink/5 text-brand-pink" }) => (
    <motion.button 
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={onClick}
        className="w-full bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 flex flex-col items-start gap-6 group shadow-sm hover:shadow-2xl transition-all duration-500"
    >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${accentColor}`}>
            {Icon && <Icon size={24} strokeWidth={1.5} />}
        </div>
        <div className="text-left w-full">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <div className="flex items-center justify-between">
                <p className="text-[22px] font-bold text-[#1d1d1f] tracking-tight">{value}</p>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-pink transition-all transform group-hover:translate-x-1" />
            </div>
        </div>
    </motion.button>
);

const AccountPageContent = () => {
  const { user, logout } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState({ stats: { points: 0, tier: 'Silver', nextTierPoints: 2000 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, wishlistRes, addressesRes, loyaltyRes] = await Promise.all([
          fetchWithAuth(`/api/orders?userId=${user.id}`).then(res => res.json()).catch(() => ({ orders: [] })),
          fetchWithAuth(`/api/wishlist?userId=${user.id}`).then(res => res.json()).catch(() => ({ wishlist: [] })),
          fetchWithAuth(`/api/users/${user.id}/addresses`).then(res => res.json()).catch(() => ([])),
          fetchWithAuth(`/api/users/${user.id}/loyalty`).then(res => res.json()).catch(() => ({ stats: { points: 1250, tier: 'Silver', nextTierPoints: 2000 } }))
        ]);

        setOrders(ordersRes.orders || []);
        setWishlistItems(wishlistRes.wishlist || []);
        setAddresses(Array.isArray(addressesRes) ? addressesRes : []);
        setLoyaltyData(loyaltyRes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, router, fetchWithAuth]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Synchronizing Sanctuary</p>
        </div>
    </div>
  );

  const progress = (loyaltyData.stats.points / loyaltyData.stats.nextTierPoints) * 100;
  const displayedAddresses = showAllAddresses ? addresses : addresses.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#1d1d1f] pb-32 relative overflow-hidden">
      
      {/* Global Decorative Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-pink/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-blue/[0.03] rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply" />
      </div>

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -100, 0], opacity: [0, 0.3, 0] }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, delay: i }}
            className="absolute bg-brand-pink/20 rounded-full w-1 h-1 pointer-events-none"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
      ))}

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <header className="pt-24 pb-20 flex flex-col md:flex-row md:items-center justify-between gap-12">
            <div className="flex items-center gap-10">
                {/* Loyalty Progress Ring */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                        <motion.circle 
                            cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" 
                            className="text-brand-pink"
                            strokeDasharray="283"
                            initial={{ strokeDashoffset: 283 }}
                            animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-brand-pink flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-2xl overflow-hidden group">
                            <motion.span whileHover={{ scale: 1.1 }}>
                                {user.first_name?.[0]}{user.last_name?.[0]}
                            </motion.span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <span className="px-4 py-1.5 rounded-full bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-pink-200">
                            <Crown size={12} fill="currentColor" /> {loyaltyData.stats.tier} Prestige
                        </span>
                        <span className="px-4 py-1.5 rounded-full bg-white border border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            Naya ID: {user.id}
                        </span>
                    </div>
                    <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-[#1d1d1f] leading-none">
                        {user.first_name} <br className="hidden md:block" /> {user.last_name}
                    </h1>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => { logout(); router.push('/'); }}
                    className="group flex items-center gap-4 px-10 py-5 bg-white border border-gray-100 rounded-full text-[12px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all shadow-sm"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </header>

        {/* Overview Dashboard */}
        <section className="mb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Ritual Points", value: loyaltyData.stats.points.toLocaleString(), icon: Star, accent: "bg-amber-50 text-amber-500" },
                    { label: "My Deliveries", value: `${orders.length} Orders`, icon: Package, accent: "bg-blue-50 text-blue-500", click: () => router.push('/orders') },
                    { label: "Saved Art", value: `${wishlistItems.length} Items`, icon: Heart, accent: "bg-rose-50 text-brand-pink" },
                    { label: "Shopping Bag", value: "Reveal Bag", icon: ShoppingBag, accent: "bg-gray-100 text-gray-900", click: () => router.push('/cart') }
                ].map((tile, idx) => (
                    <motion.div 
                        key={tile.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <InfoTile {...tile} onClick={tile.click} accentColor={tile.accent} />
                    </motion.div>
                ))}
            </div>
        </section>

        {/* Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
            
            {/* Left Col: Personal Narrative */}
            <div className="lg:col-span-2 space-y-20">
                <section>
                    <SectionTitle title="Personal Narrative" subtitle="Identity Synchronization" />
                    <div className="bg-white/80 backdrop-blur-xl rounded-[3.5rem] border border-white/60 overflow-hidden shadow-xl shadow-gray-200/20">
                        <div className="divide-y divide-gray-50">
                            {[
                                { label: 'Client Identity', value: `${user.first_name} ${user.last_name}`, icon: User },
                                { label: 'Correspondence', value: user.email, icon: Bell },
                                { label: 'Contact Frequency', value: user.phone_number || 'Link Phone', icon: Star, action: true },
                                { label: 'Biological Celebration', value: user.birthday || 'Add Birthday', icon: Sparkles, action: true },
                            ].map((item) => (
                                <div key={item.label} className="p-10 flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-brand-pink group-hover:bg-brand-pink/5 transition-all">
                                            <item.icon size={20} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                                            <p className={`text-[20px] font-bold tracking-tight ${item.action && !user[item.label.toLowerCase()] ? 'text-brand-pink' : 'text-[#1d1d1f]'}`}>
                                                {item.value}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-200 group-hover:text-brand-pink group-hover:translate-x-2 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative">
                    <div className="relative bg-gray-900 rounded-[3rem] p-10 md:p-12 text-white overflow-hidden border border-white/5 shadow-2xl">
                        <div className="absolute -right-6 -top-6 opacity-10">
                            <ShieldCheck size={160} className="text-brand-pink" />
                        </div>
                        <div className="relative z-10 space-y-6 max-w-lg">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                                <ShieldCheck size={14} className="text-brand-pink" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-pink">Security Vault</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-serif italic leading-tight">Your data is secured with biological precision.</h3>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">Multi-factor authentication and high-level encryption are active. Your sanctuary remains private.</p>
                            <button className="px-10 py-4 bg-white text-gray-900 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-brand-pink hover:text-white transition-all">
                                Update Security
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Right Col: Vaults & Settings */}
            <div className="space-y-20">
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <SectionTitle title="Saved Vaults" subtitle="Delivery Locations" />
                        <motion.button 
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            onClick={() => setIsAddressModalOpen(true)}
                            className="w-12 h-12 rounded-full bg-brand-pink text-white flex items-center justify-center shadow-xl shadow-pink-200 transition-all"
                        >
                            <Plus size={24} />
                        </motion.button>
                    </div>
                    
                    <div className="space-y-6">
                        {displayedAddresses.map(addr => (
                            <motion.div 
                                key={addr.id}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white border border-gray-100 rounded-[3rem] p-10 flex flex-col gap-8 group hover:border-brand-pink transition-all shadow-sm hover:shadow-2xl hover:shadow-gray-200/40"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-brand-pink" />
                                            <p className="text-[10px] font-black text-brand-pink uppercase tracking-widest">{addr.addressLabel}</p>
                                        </div>
                                        <p className="text-[20px] font-bold text-[#1d1d1f] tracking-tight leading-snug">
                                            {addr.addressLine1},<br/>
                                            {addr.city}, {addr.country}
                                        </p>
                                    </div>
                                    {addr.isDefault && (
                                        <span className="bg-gray-100 text-[9px] font-black px-3 py-1 rounded-full uppercase">Default</span>
                                    )}
                                </div>
                                <div className="flex gap-8 pt-6 border-t border-gray-50">
                                    <button className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-pink transition-colors">Edit</button>
                                    <button className="text-[11px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors">Dissolve</button>
                                </div>
                            </motion.div>
                        ))}
                        
                        {addresses.length > 3 && (
                            <button 
                                onClick={() => setShowAllAddresses(!showAllAddresses)}
                                className="w-full py-4 rounded-full border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                            >
                                {showAllAddresses ? 'View Less' : `View ${addresses.length - 3} more vaults`}
                            </button>
                        )}

                        {addresses.length === 0 && (
                            <div className="py-24 text-center bg-white/40 border border-dashed border-gray-200 rounded-[4rem]">
                                <MapPin size={40} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-serif italic text-xl">No vaults synchronized.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    {[
                        { label: 'Alert Preferences', icon: Bell },
                        { label: 'Ritual Settings', icon: Settings },
                        { label: 'Privacy Protocol', icon: ShieldCheck },
                    ].map(item => (
                        <button key={item.label} className="w-full p-8 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-between group hover:bg-brand-pink hover:text-white transition-all duration-500 shadow-sm">
                            <div className="flex items-center gap-6">
                                <item.icon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                <span className="text-[16px] font-bold tracking-tight">{item.label}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-white/20 flex items-center justify-center text-gray-300 group-hover:text-white transition-all">
                                <ChevronRight size={16} />
                            </div>
                        </button>
                    ))}
                </section>
            </div>
        </div>

      </div>

      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title="Synchronize New Vault">
        <AddressInputForm
          onSave={() => setIsAddressModalOpen(false)}
          onCancel={() => setIsAddressModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-brand-pink font-black uppercase tracking-[0.5em]">Synchronizing...</div>}>
      <Elements stripe={stripePromise}>
        <AccountPageContent />
      </Elements>
    </Suspense>
  );
}