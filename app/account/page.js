'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Package, Heart, MapPin,
  LogOut, ChevronRight, Star, Sparkles, Plus, Settings, Bell, ShieldCheck, ShoppingBag, Crown, CreditCard, Gift, Clock, ArrowRight, Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '../components/Modal';
import AddressInputForm from '../components/AddressInputForm';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';
import Image from 'next/image';

const stripePromise = getStripe();

const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-px bg-brand-pink/30"></span>
            <p className="text-[10px] font-black text-brand-pink uppercase tracking-[0.4em]">{subtitle}</p>
        </div>
        <h2 className="text-[32px] md:text-[42px] font-serif italic text-[#1d1d1f] tracking-tight leading-tight">
            {title}
        </h2>
    </div>
);

const AccountPageContent = () => {
  const { user, logout } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState({ stats: { points: 0, tier: 'Silver', nextTierPoints: 2000 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#1d1d1f] relative overflow-hidden">
      
      {/* Background Decorative Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-pink/[0.03] rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-blue/[0.02] rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-12 pb-32 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-8">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/60 shadow-xl shadow-gray-200/20">
                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-brand-pink flex items-center justify-center text-white text-3xl font-bold shadow-2xl overflow-hidden">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-pink transition-colors shadow-lg">
                                <Camera size={14} />
                            </button>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">{user.first_name} {user.last_name}</h3>
                            <p className="text-[10px] font-black text-brand-pink uppercase tracking-widest mt-1">{loyaltyData.stats.tier} Prestige</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => router.push(`/account?tab=${item.id}`)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${
                                    activeTab === item.id 
                                    ? 'bg-black text-white shadow-xl shadow-black/10' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon size={18} strokeWidth={activeTab === item.id ? 2 : 1.5} />
                                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                </div>
                                {activeTab === item.id && <ChevronRight size={14} />}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-gray-50">
                        <button 
                            onClick={() => { logout(); router.push('/'); }}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                        >
                            <LogOut size={18} strokeWidth={1.5} />
                            <span className="text-sm font-bold tracking-tight">Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Loyalty Card Small */}
                <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink/20 blur-[60px]"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <Star size={16} className="text-brand-pink fill-brand-pink" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Ritual Points</span>
                        </div>
                        <p className="text-4xl font-black">{loyaltyData.stats.points.toLocaleString()}</p>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(loyaltyData.stats.points / loyaltyData.stats.nextTierPoints) * 100}%` }}
                                className="h-full bg-brand-pink"
                            />
                        </div>
                        <p className="text-[9px] font-medium opacity-40 uppercase tracking-widest">Next Tier: {loyaltyData.stats.nextTierPoints - loyaltyData.stats.points} points needed</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-9">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <SectionTitle title="The Sanctuary" subtitle="Personal Curation" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white/60 p-10 shadow-xl shadow-gray-200/20 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-pink/5 flex items-center justify-center text-brand-pink">
                                            <ShieldCheck size={24} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-3xl font-serif italic text-gray-900 leading-tight">Welcome home, <br/>{user.first_name}.</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm font-medium">Your clinical botanical journey continues. Here you can manage your personal protocols, track ritual acquisitions, and refine your experience.</p>
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => router.push('/all-products')} className="px-8 py-4 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-pink transition-all shadow-lg">New Discovery</button>
                                        <button onClick={() => router.push('/account?tab=settings')} className="px-8 py-4 bg-gray-50 text-gray-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all border border-gray-100">Ritual Settings</button>
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white/60 p-10 shadow-xl shadow-gray-200/20 text-center flex flex-col items-center justify-center space-y-6">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                        <Heart size={32} strokeWidth={1} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900">{wishlistItems.length}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Saved Masterpieces</p>
                                    </div>
                                    <button onClick={() => router.push('/account?tab=wishlist')} className="text-[10px] font-black text-brand-pink uppercase tracking-[0.2em] border-b border-brand-pink/20 pb-1 hover:border-brand-pink transition-all">Reveal All</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white/60 p-10 shadow-xl shadow-gray-200/20">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-lg font-bold tracking-tight">Recent Acquisitions</h4>
                                        <button onClick={() => router.push('/account?tab=orders')} className="text-[10px] font-black text-brand-pink uppercase tracking-widest">Archive</button>
                                    </div>
                                    {orders.length > 0 ? (
                                        <div className="space-y-6">
                                            {orders.slice(0, 2).map((order, index) => (
                                                <div key={order.id || `order-${index}`} className="flex items-center justify-between group cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                            <Package size={20} strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-none mb-1">Order #{order.id}</p>
                                                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-gray-900">AED {Number(order.totalAmount).toFixed(2)}</p>
                                                        <p className="text-[9px] font-black text-brand-pink uppercase tracking-widest">{order.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-gray-400 text-sm font-medium italic">No acquisitions yet.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white/60 p-10 shadow-xl shadow-gray-200/20">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-lg font-bold tracking-tight">Saved Vaults</h4>
                                        <button onClick={() => router.push('/account?tab=addresses')} className="text-[10px] font-black text-brand-pink uppercase tracking-widest">Manage</button>
                                    </div>
                                    {addresses.length > 0 ? (
                                        <div className="space-y-6">
                                            {addresses.slice(0, 1).map((addr, index) => (
                                                <div key={addr.id || `addr-${index}`} className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-pink">
                                                        <MapPin size={20} strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{addr.addressLabel}</p>
                                                        <p className="text-xs text-gray-400 leading-relaxed font-medium line-clamp-1">{addr.addressLine1}, {addr.city}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-gray-400 text-sm font-medium italic">No vaults synchronized.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <SectionTitle title="Acquisition Archive" subtitle="History of Light" />
                            <div className="space-y-4">
                                {orders.map((order, index) => (
                                    <div key={order.id || `archive-${index}`} className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-gray-200/20 transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-gray-300">
                                                <Package size={28} strokeWidth={1} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-bold tracking-tight text-gray-900">Order #{order.id}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                    <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                                                    <span className="text-[10px] font-black text-brand-pink uppercase tracking-widest">{order.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-12 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50">
                                            <div className="text-left md:text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                                <p className="text-xl font-black text-gray-900">AED {Number(order.totalAmount).toFixed(2)}</p>
                                            </div>
                                            <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {orders.length === 0 && (
                                    <div className="py-32 text-center bg-white/40 rounded-[3rem] border border-dashed border-gray-200">
                                        <Package size={48} strokeWidth={1} className="mx-auto text-gray-200 mb-6" />
                                        <h3 className="font-serif italic text-2xl text-gray-900 mb-2">No Acquisitions Found</h3>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Begin your botanical journey in our atelier</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'wishlist' && (
                        <motion.div
                            key="wishlist"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <SectionTitle title="Saved Masterpieces" subtitle="Future Protocols" />
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {wishlistItems.map((item, index) => (
                                    <div key={item.id || `wish-${index}`} className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/30 transition-all group">
                                        <div className="aspect-square relative bg-gray-50 p-8">
                                            <Image src={item.imageUrl} alt={item.name} fill className="object-contain transition-transform duration-700 group-hover:scale-110" />
                                            <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-brand-pink shadow-sm">
                                                <Heart size={18} fill="currentColor" />
                                            </button>
                                        </div>
                                        <div className="p-8 space-y-4">
                                            <div>
                                                <p className="text-[9px] font-black text-brand-pink uppercase tracking-widest mb-1">{item.brandName || 'Naya Lumière'}</p>
                                                <h4 className="text-base font-bold tracking-tight text-gray-900 line-clamp-1">{item.name}</h4>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <p className="text-lg font-black text-gray-900">AED {item.price}</p>
                                                <button className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-brand-pink transition-all">
                                                    <ShoppingBag size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {wishlistItems.length === 0 && (
                                    <div className="md:col-span-3 py-32 text-center bg-white/40 rounded-[3rem] border border-dashed border-gray-200">
                                        <Heart size={48} strokeWidth={1} className="mx-auto text-gray-200 mb-6" />
                                        <h3 className="font-serif italic text-2xl text-gray-900 mb-2">The Canvas is Empty</h3>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Save your most desired botanical arts</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'addresses' && (
                        <motion.div
                            key="addresses"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <SectionTitle title="Synchronized Vaults" subtitle="Delivery Coordinates" />
                                <button 
                                    onClick={() => setIsAddressModalOpen(true)}
                                    className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-pink transition-all shadow-xl shadow-black/10"
                                >
                                    <Plus size={16} /> New Vault
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {addresses.map((addr, index) => (
                                    <div key={addr.id || `address-${index}`} className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-10 flex flex-col justify-between group hover:border-brand-pink/30 transition-all">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-pink">
                                                    <MapPin size={24} strokeWidth={1.5} />
                                                </div>
                                                {addr.isDefault && (
                                                    <span className="text-[9px] font-black text-white bg-black px-3 py-1 rounded-full uppercase tracking-widest">Primary</span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xl font-bold tracking-tight text-gray-900">{addr.addressLabel}</h4>
                                                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                                    {addr.addressLine1}, <br/>
                                                    {addr.city}, {addr.country}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-8 pt-8 mt-8 border-t border-gray-50">
                                            <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-pink transition-all">Modify</button>
                                            <button className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-all">Dissolve</button>
                                        </div>
                                    </div>
                                ))}
                                {addresses.length === 0 && (
                                    <div className="md:col-span-2 py-32 text-center bg-white/40 rounded-[3rem] border border-dashed border-gray-200">
                                        <MapPin size={48} strokeWidth={1} className="mx-auto text-gray-200 mb-6" />
                                        <h3 className="font-serif italic text-2xl text-gray-900 mb-2">No Vaults Synchronized</h3>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Establish your botanical reception points</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <SectionTitle title="Sanctuary Settings" subtitle="Ritual Preferences" />
                            <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white/60 overflow-hidden shadow-xl shadow-gray-200/20">
                                <div className="divide-y divide-gray-50">
                                    {[
                                        { label: 'Correspondence Preferences', Icon: Bell, desc: 'Manage your clinical newsletter and ritual alerts.' },
                                        { label: 'Security & Access', Icon: Lock, desc: 'Update your secret access code and verification methods.' },
                                        { label: 'Privacy Protocols', Icon: ShieldCheck, desc: 'Review how we preserve your clinical data sanctuary.' },
                                        { label: 'Payment Instruments', Icon: CreditCard, desc: 'Securely manage your preferred acquisition methods.' },
                                    ].map((item) => (
                                        <button key={item.label} className="w-full p-8 flex items-center justify-between group hover:bg-gray-50/50 transition-all text-left">
                                            <div className="flex items-center gap-8">
                                                <div className="w-14 h-14 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-brand-pink transition-all">
                                                    <item.Icon size={24} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold tracking-tight text-gray-900 mb-1">{item.label}</p>
                                                    <p className="text-xs text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-200 group-hover:text-brand-pink group-hover:translate-x-2 transition-all" />
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
