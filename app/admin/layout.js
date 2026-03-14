'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Package, LogOut, Menu, X, LayoutDashboard, Tags, Ticket, Users, MessageSquare, ExternalLink, ShieldCheck, Bell, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { NayaLumiereLogo } from '../components/Icons';

import { createFetchWithAuth } from '../lib/api';

const AdminLayout = ({ children }) => {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const fetchWithAuth = createFetchWithAuth(logout);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth');
        } else if (!loading && user?.email !== 'mouffaq@nayalc.com') {
            router.push('/');
        }
    }, [user, loading, isAuthenticated, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = [
        { to: '/admin', text: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/products', text: 'Products', icon: Package },
        { to: '/admin/categories', text: 'Categories', icon: Tags },
        { to: '/admin/brands', text: 'Brands', icon: Heart },
        { to: '/admin/orders', text: 'Orders', icon: ShoppingBag },
        { to: '/admin/coupons', text: 'Coupons', icon: Ticket },
        { to: '/admin/users', text: 'Users', icon: Users },
        { to: '/admin/chat', text: 'Chat', icon: MessageSquare },
        { to: '/admin/seo', text: 'SEO Insights', icon: Globe },
    ];

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadAdminChatCount, setUnreadAdminChatCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!isAuthenticated) return;
            try {
                const response = await fetchWithAuth('/api/admin/chat/unread');
                if (response.ok) {
                    const data = await response.json();
                    setUnreadAdminChatCount(data.unreadCount);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchUnreadCount();
        const intervalId = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(intervalId);
    }, [isAuthenticated]);

    const currentPage = navItems.find(item => pathname === item.to || (pathname.startsWith(item.to) && item.to !== '/admin'));
    const pageTitle = currentPage ? currentPage.text : 'Admin Portal';

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white">
            <div className="p-8 border-b border-gray-50 flex items-center justify-center">
                <Link href="/admin" className="flex flex-col items-center group">
                    <NayaLumiereLogo className="h-6 md:h-8 w-auto mb-2" />
                    <span className="text-[9px] font-black tracking-[0.4em] text-gray-300 uppercase">Executive Portal</span>
                </Link>
            </div>
            
            <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto no-scrollbar">
                {navItems.map(item => {
                    const isActive = pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to));
                    return (
                        <Link
                            key={item.to}
                            href={item.to}
                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                                isActive 
                                ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
                        >
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} className={isActive ? 'text-indigo-400' : 'group-hover:text-indigo-600'} />
                            <span className={`text-sm font-bold tracking-tight ${isActive ? 'translate-x-1' : ''} transition-transform`}>{item.text}</span>
                            {item.to === '/admin/chat' && unreadAdminChatCount > 0 && (
                                <span className="ml-auto w-5 h-5 flex items-center justify-center text-[10px] font-black bg-red-500 text-white rounded-lg animate-pulse">
                                    {unreadAdminChatCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-gray-50 space-y-3">
                <Link href="/" className="flex items-center gap-4 px-5 py-4 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all group">
                    <ExternalLink size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-bold">Storefront</span>
                </Link>
                <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">Terminate Session</span>
                </button>
            </div>
        </div>
    );

    if (loading) return (
        <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verifying Authority...</p>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#FAF9F6] font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-[110] w-72 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Global Grain Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply" />

                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors group">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
                        </button>
                        
                        <div className="h-8 w-px bg-gray-100"></div>
                        
                        <div className="flex items-center gap-4 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{user?.first_name || 'Administrator'}</p>
                                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">System Level 5</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-lg shadow-gray-200">
                                <ShieldCheck size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative z-10 no-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;