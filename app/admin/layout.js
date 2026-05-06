'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
 ShoppingBag, Heart, Package, LogOut, Menu, X,
 LayoutDashboard, Tags, Ticket, Users, MessageSquare,
 ExternalLink, ShieldCheck, Bell, Globe, Instagram,
 Layout,
 Banknote,
 Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createFetchWithAuth } from '../lib/api';
import PageLoader from '@/app/components/PageLoader';

const SIDEBAR_W = '256px';

const navItems = [
 { to: '/admin', text: 'Dashboard', icon: LayoutDashboard },
 { to: '/admin/hero', text: 'Hero Banner', icon: Layout },
 { to: '/admin/payments', text: 'Payments', icon: Banknote },
 { to: '/admin/products', text: 'Products', icon: Package },
 { to: '/admin/categories', text: 'Categories', icon: Tags },
 { to: '/admin/brands', text: 'Brands', icon: Heart },
 { to: '/admin/orders', text: 'Orders', icon: ShoppingBag },
 { to: '/admin/coupons', text: 'Coupons', icon: Ticket },
 { to: '/admin/users', text: 'Users', icon: Users },
 { to: '/admin/chat', text: 'Chat', icon: MessageSquare },
 { to: '/admin/marketing', text: 'Marketing', icon: Send },
 { to: '/admin/seo', text: 'SEO', icon: Globe },
 { to: '/admin/social', text: 'Social', icon: Instagram },
];

const SidebarContent = ({ pathname, isSidebarOpen, setIsSidebarOpen, notifications, onLogout }) => (
 <div className="flex flex-col h-full" style={{ background: '#ffffff', borderRight: '1px solid rgba(216,180,254,0.45)' }}>

 {/* Logo */}
 <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(216,180,254,0.35)' }}>
 <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-[14px]">
 <Image
 src="/Adobe Express - file (5).png"
 alt="Naya Lumière Cosmetics"
 width={44}
 height={44}
 className="h-9 w-auto object-contain shrink-0"
 priority
 />
 <div style={{ textAlign: 'left', lineHeight: '1.25' }}>
     <div
     style={{
         fontSize: '18px',
         fontWeight: '600',
         letterSpacing: '0.05em',
         color: '#3b0764',
         textTransform: 'uppercase',
         fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
     }}
     >
     NAYA
     </div>
     <div
     style={{
         fontSize: '12px',
         fontStyle: 'italic',
         fontFamily: "Georgia, 'Times New Roman', serif",
         color: '#6b21a8',
         marginTop: '0px'
     }}
     >
     Lumière Cosmetics
     </div>
 </div> </Link>
 <p className="text-[11px] font-bold text-purple-600 mt-2 ml-0.5"> Admin Portal
 </p>
 </div>

 {/* Nav */}
 <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto no-scrollbar">
 {navItems.map(item => {
 const isActive = pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to));
 return (
 <Link
 key={item.to}
 href={item.to}
 onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${!isActive ? 'hover:bg-purple-100/60' : ''}`}
 style={isActive ? {
 background: 'rgba(216,180,254,0.28)',
 border: '1px solid rgba(167,139,250,0.45)',
 color: '#6b21a8',
 } : {
 color: 'rgba(107,33,168,0.55)',
 border: '1px solid transparent',
 }}
 >
 <item.icon
 size={17}
 strokeWidth={isActive ? 2.5 : 1.75}
 className="shrink-0"
 style={{ color: isActive ? '#9333ea' : undefined }}
 />
 <span className="text-[13px] font-semibold">{item.text}</span>
 {item.to === '/admin/chat' && notifications.unreadChatsCount > 0 && (
 <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] font-black bg-red-500 text-white rounded-full">
 {notifications.unreadChatsCount}
 </span>
 )}
 </Link>
 );
 })}
 </nav>

 {/* Footer actions */}
 <div className="px-3 py-4 space-y-0.5" style={{ borderTop: '1px solid rgba(216,180,254,0.35)' }}>
 <Link
 href="/"
 className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-purple-50"
 style={{ color: 'rgba(107,33,168,0.5)' }}
 >
 <ExternalLink size={16} strokeWidth={1.75} />
 <span className="text-[13px] font-semibold">Go to Store</span>
 </Link>
 <button
 onClick={onLogout}
 className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-red-50 hover:text-red-500"
 style={{ color: 'rgba(107,33,168,0.5)' }}
 >
 <LogOut size={16} strokeWidth={1.75} />
 <span className="text-[13px] font-semibold">Sign Out</span>
 </button>
 </div>
 </div>
);

const AdminLayout = ({ children }) => {
 const { user, loading, logout, isAuthenticated } = useAuth();
 const router = useRouter();
 const pathname = usePathname();
 const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);

 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [notifications, setNotifications] = useState({
 unreadTotal: 0,
 unreadChatsCount: 0,
 unreadOrdersCount: 0,
 unreadOrdersDetails: [],
 unreadChatsDetails: []
 });
 const [isNotifOpen, setIsNotifOpen] = useState(false);
 const notifRef = React.useRef(null);

 useEffect(() => {
 if (!loading && !isAuthenticated) router.push('/auth');
 else if (!loading && user?.role !== 'admin') router.push('/');
 }, [user, loading, isAuthenticated, router]);

 useEffect(() => {
 const poll = async () => {
 if (!isAuthenticated) return;
 try {
 const r = await fetchWithAuth('/api/admin/notifications');
 if (r.ok) setNotifications(await r.json());
 } catch {}
 };
 // Initial fetch, but only if we are truly authenticated and not just mounting
 if (isAuthenticated) {
     poll();
 }
 const id = setInterval(poll, 30000);
 return () => clearInterval(id);
 }, [isAuthenticated, fetchWithAuth]);

 useEffect(() => {
 const handleClickOutside = (e) => {
 if (notifRef.current && !notifRef.current.contains(e.target)) {
 setIsNotifOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handleNotifClick = (type, id) => {
 setIsNotifOpen(false);
 if (type === 'order') router.push(`/admin/orders/${id}`);
 else if (type === 'chat') router.push(`/admin/chat/${id}`);
 };

 const handleLogout = () => { logout(); router.push('/'); };

 const current = navItems.find(n => pathname === n.to || (n.to !== '/admin' && pathname.startsWith(n.to)));
 const pageTitle = current?.text ?? 'Admin';

 /* ── Loading state ── */
 if (loading) return <PageLoader />;

 return (
 <div className="flex h-screen" style={{ background: 'var(--cl-bg)' }}>

 {/* Mobile backdrop */}
 <AnimatePresence>
 {isSidebarOpen && (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
 onClick={() => setIsSidebarOpen(false)}
 />
 )}
 </AnimatePresence>

 {/* Sidebar */}
 <aside
 className={`fixed inset-y-0 left-0 z-[110] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shrink-0 ${
 isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
 }`}
 style={{ width: SIDEBAR_W }}
 >
 <SidebarContent
 pathname={pathname}
 isSidebarOpen={isSidebarOpen}
 setIsSidebarOpen={setIsSidebarOpen}
 notifications={notifications}
 onLogout={handleLogout}
 />
 </aside>

 {/* Main */}
 <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

 {/* Header */}
 <header
 className="h-16 bg-white shrink-0 flex items-center justify-between px-6 z-10"
 style={{ borderBottom: '1px solid rgba(216,180,254,0.35)' }}
 >
 <div className="flex items-center gap-3">
 <button
 onClick={() => setIsSidebarOpen(v => !v)}
 className="lg:hidden p-2 rounded-lg hover:bg-purple-50 text-gray-500 transition-colors"
 >
 {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
 </button>
 <div className="flex items-center gap-2.5">
 <span className="w-2 h-2 rounded-full bg-[#9333ea] shadow-[0_0_8px_rgba(147,51,234,0.55)]" />
 <h1 className="text-[15px] font-bold" style={{ color: '#3b0764' }}>{pageTitle}</h1>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="relative" ref={notifRef}>
 <button
 onClick={() => setIsNotifOpen(v => !v)}
 className={`relative p-2 rounded-lg transition-all ${isNotifOpen ? 'text-[#9333ea] bg-purple-50' : 'text-gray-400 hover:text-[#9333ea] hover:bg-purple-50'}`}
 >
 <Bell size={18} />
 {notifications.unreadTotal > 0 && (
 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
 )}
 </button>

 <AnimatePresence>
 {isNotifOpen && (
 <motion.div
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 transition={{ duration: 0.15 }}
 className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden z-50"
 >
 <div className="p-3 bg-purple-50/50 border-b border-purple-100 flex justify-between items-center">
 <span className="text-[13px] font-bold text-[#3b0764]">Notifications</span>
 {notifications.unreadTotal > 0 && (
 <span className="text-[10px] bg-purple-200 text-[#3b0764] px-2 py-0.5 rounded-full font-bold">
 {notifications.unreadTotal} new
 </span>
 )}
 </div>
 <div className="max-h-[320px] overflow-y-auto no-scrollbar">
 {notifications.unreadTotal === 0 ? (
 <div className="p-6 text-center text-gray-400 text-[13px]">
 You're all caught up!
 </div>
 ) : (
 <div className="flex flex-col">
 {notifications.unreadOrdersDetails.map(order => (
 <button
 key={`order-${order.id}`}
 onClick={() => handleNotifClick('order', order.id)}
 className="flex items-start gap-3 p-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0"
 >
 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
 <ShoppingBag size={14} />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-gray-900 leading-tight">New Order #{order.id}</p>
 <p className="text-[11px] text-gray-500 mt-0.5">AED {parseFloat(order.total_amount).toFixed(2)}</p>
 </div>
 <div className="w-2 h-2 rounded-full bg-blue-500 ml-auto mt-2" />
 </button>
 ))}
 {notifications.unreadChatsDetails.map(chat => (
 <button
 key={`chat-${chat.id}`}
 onClick={() => handleNotifClick('chat', chat.id)}
 className="flex items-start gap-3 p-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0"
 >
 <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
 <MessageSquare size={14} />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-gray-900 leading-tight">New message from {chat.first_name}</p>
 <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[180px]">{chat.email}</p>
 </div>
 <div className="w-2 h-2 rounded-full bg-purple-500 ml-auto mt-2" />
 </button>
 ))}
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <div className="h-6 w-px" style={{ background: 'rgba(216,180,254,0.4)' }} />

 <div className="flex items-center gap-3">
 <div className="hidden sm:block text-right">
 <p className="text-xs font-bold text-gray-900">{user?.first_name || 'Admin'}</p>
 <p className="text-[10px] font-semibold" style={{ color: '#9333ea' }}>Administrator</p>
 </div>
 <div
 className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg"
 style={{ background: '#9333ea', boxShadow: '0 4px 14px rgba(147,51,234,0.35)' }}
 >
 <ShieldCheck size={17} className="text-white" />
 </div>
 </div>
 </div>
 </header>

 {/* Page content */}
 <div className="flex-1 overflow-y-auto no-scrollbar">
 <div className="max-w-7xl mx-auto p-6 lg:p-8 pb-16">
 {children}
 </div>
 </div>
 </main>
 </div>
 );
};

export default AdminLayout;
