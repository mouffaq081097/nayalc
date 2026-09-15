'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, MessageSquare, Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { createFetchWithAuth } from '../lib/api';
import PageLoader from '@/app/components/PageLoader';
import AdminSidebar from './_components/AdminSidebar';

const SIDEBAR_W = '232px';

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
    unreadChatsDetails: [],
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
    if (isAuthenticated) poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchWithAuth]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
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
  const initials = (user?.first_name?.[0] || 'A').toUpperCase();

  if (loading) return <PageLoader />;

  return (
    <div className="sp-admin flex flex-col h-screen">

      {/* ── Top bar ── */}
      <header
        className="h-14 shrink-0 flex items-center gap-3 px-3 sm:px-4 z-30"
        style={{ background: 'var(--sp-topbar)' }}
      >
        {/* Mobile toggle */}
        <button
          onClick={() => setIsSidebarOpen(v => !v)}
          className="lg:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 shrink-0 pr-2">
          <Image
            src="/Adobe Express - file (5).png"
            alt="Naya Lumière"
            width={26}
            height={26}
            className="w-[26px] h-[26px] object-contain"
            priority
          />
          <span className="hidden sm:block text-[15px] font-semibold text-white tracking-tight">Naya Lumière</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-[640px] mx-auto">
          <div
            className="flex items-center gap-2 h-9 px-3 rounded-lg w-full"
            style={{ background: 'var(--sp-topbar-2)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Search size={16} className="text-white/55 shrink-0" />
            <input
              placeholder="Search"
              className="bg-transparent flex-1 text-[13px] text-white placeholder:text-white/45 focus:outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-0.5 text-[11px] text-white/45 font-medium">⌘K</kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(v => !v)}
              className="relative p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifications.unreadTotal > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl overflow-hidden z-50"
                  style={{ border: '1px solid var(--sp-border)', boxShadow: '0 8px 28px rgba(0,0,0,0.16)' }}
                >
                  <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--sp-border)' }}>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--sp-text)' }}>Notifications</span>
                    {notifications.unreadTotal > 0 && (
                      <span className="sp-badge sp-badge-info">{notifications.unreadTotal} new</span>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                    {notifications.unreadTotal === 0 ? (
                      <div className="p-6 text-center text-[13px]" style={{ color: 'var(--sp-text-subdued)' }}>
                        You&apos;re all caught up.
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.unreadOrdersDetails.map(order => (
                          <button
                            key={`order-${order.id}`}
                            onClick={() => handleNotifClick('order', order.id)}
                            className="flex items-start gap-3 p-3 hover:bg-[#f7f7f7] transition-colors text-left"
                            style={{ borderBottom: '1px solid #f1f1f1' }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#f1f1f1] flex items-center justify-center shrink-0">
                              <ShoppingBag size={14} style={{ color: 'var(--sp-text-secondary)' }} />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium" style={{ color: 'var(--sp-text)' }}>New order #{order.id}</p>
                              <p className="text-[12px] mt-0.5" style={{ color: 'var(--sp-text-subdued)' }}>AED {parseFloat(order.total_amount).toFixed(2)}</p>
                            </div>
                          </button>
                        ))}
                        {notifications.unreadChatsDetails.map(chat => (
                          <button
                            key={`chat-${chat.id}`}
                            onClick={() => handleNotifClick('chat', chat.id)}
                            className="flex items-start gap-3 p-3 hover:bg-[#f7f7f7] transition-colors text-left"
                            style={{ borderBottom: '1px solid #f1f1f1' }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#f1f1f1] flex items-center justify-center shrink-0">
                              <MessageSquare size={14} style={{ color: 'var(--sp-text-secondary)' }} />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium" style={{ color: 'var(--sp-text)' }}>Message from {chat.first_name}</p>
                              <p className="text-[12px] mt-0.5 truncate max-w-[180px]" style={{ color: 'var(--sp-text-subdued)' }}>{chat.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => router.push('/account')}
          >
            <span className="w-7 h-7 rounded-md bg-[#36c47b] text-white text-[12px] font-semibold flex items-center justify-center">
              {initials}
            </span>
            <span className="hidden md:flex items-center gap-1 text-[13px] font-medium text-white/90">
              {user?.first_name || 'Admin'}
              <ChevronDown size={14} className="text-white/50" />
            </span>
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile backdrop */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 top-14 z-20 bg-black/30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <aside
          className={`fixed lg:relative inset-y-0 top-14 lg:top-0 left-0 z-20 transform transition-transform duration-300 lg:translate-x-0 shrink-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: SIDEBAR_W, borderRight: '1px solid #e0e0e0' }}
        >
          <AdminSidebar
            pathname={pathname}
            onNavigate={() => setIsSidebarOpen(false)}
            notifications={notifications}
            onLogout={handleLogout}
          />
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar sp-scroll">
          <div className="w-full px-4 sm:px-6 py-5 pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
