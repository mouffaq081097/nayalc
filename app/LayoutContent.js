'use client';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useCart } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import SideCart from './components/SideCart'; // Import SideCart
import ChatWidget from './components/ChatWidget'; // Import ChatWidget
import GlobalLoader from './components/GlobalLoader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  useCart();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');
  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout'; // New line

  const showMobileChrome =
    !isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage;

  return (
    <>
      {/* ── Global Background Sanctuary Atmosphere (Account Page Match) ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[140px]" style={{ background: 'rgba(196,167,254,0.18)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ background: 'rgba(249,168,212,0.12)' }} />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(216,180,254,0.10)' }} />
      </div>

      <GlobalLoader isLoading={isTransitioning} />
      {showMobileChrome && <ChatWidget />}
      {showMobileChrome && <Header />}
      <SideCart /> {/* Add SideCart component here */}
      <div
        className={`flex min-h-screen flex-col ${showMobileChrome ? 'pb-[var(--mobile-main-pad-bottom)] md:pb-0' : ''}`}
      >
        <main className="min-h-0 flex-1">{children}</main>
        {showMobileChrome && <Footer />}
      </div>
      {showMobileChrome && <MobileBottomNav />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
