'use client';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useCart } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import SideCart from './components/SideCart';
import GlobalLoader from './components/GlobalLoader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatWidget = lazy(() => import('./components/ChatWidget'));

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  useCart();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setChatReady(true));
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(() => setChatReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const isAuthPage    = pathname === '/auth';
  const isAdminPage   = pathname.startsWith('/admin');
  const isAccountPage = pathname.startsWith('/account');
  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout';
  const isNeedAnythingElsePage  = pathname === '/need-anything-else';
  const isOrderConfirmedPage    = pathname.startsWith('/order-confirmed');

  const showMobileChrome =
    !isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage && !isNeedAnythingElsePage && !isOrderConfirmedPage;

  return (
    <>
      <GlobalLoader isLoading={isTransitioning} />
      {showMobileChrome && chatReady && <Suspense fallback={null}><ChatWidget /></Suspense>}
      {showMobileChrome && <Header />}
      <SideCart /> {/* Add SideCart component here */}
      <div
        className={`flex min-h-screen flex-col ${showMobileChrome ? 'pb-[var(--mobile-main-pad-bottom)] md:pb-0' : ''}`}
      >
        <main className="min-h-0 flex-1">{children}</main>
        {showMobileChrome && (
          <div className={isAccountPage ? 'md:pl-[200px]' : ''}>
            <Footer />
          </div>
        )}
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
