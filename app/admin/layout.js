'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    ShoppingBag, Heart, Package, LogOut, Menu, X,
    LayoutDashboard, Tags, Ticket, Users, MessageSquare,
    ExternalLink, ShieldCheck, Bell, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createFetchWithAuth } from '../lib/api';

const SIDEBAR_W = '256px';

const navItems = [
    { to: '/admin',            text: 'Dashboard',   icon: LayoutDashboard },
    { to: '/admin/products',   text: 'Products',    icon: Package         },
    { to: '/admin/categories', text: 'Categories',  icon: Tags            },
    { to: '/admin/brands',     text: 'Brands',      icon: Heart           },
    { to: '/admin/orders',     text: 'Orders',      icon: ShoppingBag     },
    { to: '/admin/coupons',    text: 'Coupons',     icon: Ticket          },
    { to: '/admin/users',      text: 'Users',       icon: Users           },
    { to: '/admin/chat',       text: 'Chat',        icon: MessageSquare   },
    { to: '/admin/seo',        text: 'SEO',         icon: Globe           },
];

const AdminLayout = ({ children }) => {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router   = useRouter();
    const pathname = usePathname();
    const fetchWithAuth = createFetchWithAuth(logout);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount]     = useState(0);

    useEffect(() => {
        if (!loading && !isAuthenticated)                       router.push('/auth');
        else if (!loading && user?.email !== 'mouffaq@nayalc.com') router.push('/');
    }, [user, loading, isAuthenticated, router]);

    useEffect(() => {
        const poll = async () => {
            if (!isAuthenticated) return;
            try {
                const r = await fetchWithAuth('/api/admin/chat/unread');
                if (r.ok) setUnreadCount((await r.json()).unreadCount);
            } catch {}
        };
        poll();
        const id = setInterval(poll, 30000);
        return () => clearInterval(id);
    }, [isAuthenticated]);

    const handleLogout = () => { logout(); router.push('/'); };

    const current   = navItems.find(n => pathname === n.to || (n.to !== '/admin' && pathname.startsWith(n.to)));
    const pageTitle = current?.text ?? 'Admin';

    /* ── Sidebar ── */
    const SidebarContent = () => (
        <div className="flex flex-col h-full" style={{ background: '#fdf8ff', borderRight: '1px solid rgba(216,180,254,0.45)' }}>

            {/* Logo */}
            <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(216,180,254,0.35)' }}>
                <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2.5">
                    <Image
                        src="/Adobe Express - file (5).png"
                        alt="Naya Lumière Cosmetics"
                        width={44}
                        height={44}
                        className="h-9 w-auto object-contain shrink-0"
                        priority
                    />
                    <div className="flex flex-col justify-center leading-none">
                        <span className="text-[13px] font-black tracking-normal uppercase" style={{ color: '#3b0764' }}>
                            NAYA
                        </span>
                        <span className="text-[9px] font-medium tracking-normal font-serif italic" style={{ color: '#6b21a8' }}>
                            Lumière Cosmetics
                        </span>
                    </div>
                </Link>
                <p className="text-[9px] font-black tracking-[0.25em] uppercase mt-3 ml-0.5" style={{ color: 'rgba(147,51,234,0.45)' }}>
                    Admin Portal
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
                            {item.to === '/admin/chat' && unreadCount > 0 && (
                                <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] font-black bg-red-500 text-white rounded-full">
                                    {unreadCount}
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
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-red-50 hover:text-red-500"
                    style={{ color: 'rgba(107,33,168,0.5)' }}
                >
                    <LogOut size={16} strokeWidth={1.75} />
                    <span className="text-[13px] font-semibold">Sign Out</span>
                </button>
            </div>
        </div>
    );

    /* ── Loading state ── */
    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#fdf8ff' }}>
            <div className="w-10 h-10 border-4 border-purple-200 border-t-[#9333ea] rounded-full animate-spin" />
            <p className="text-[11px] font-semibold text-purple-300 tracking-widest uppercase">Verifying access…</p>
        </div>
    );

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
                <SidebarContent />
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
                        <button className="relative p-2 rounded-lg text-gray-400 hover:text-[#9333ea] hover:bg-purple-50 transition-all">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#9333ea] rounded-full" />
                        </button>

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
