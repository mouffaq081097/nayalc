'use client';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useCart } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { Newsletter } from './components/Newsletter';
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
      <GlobalLoader isLoading={isTransitioning} />
      {showMobileChrome && <ChatWidget />}
      {showMobileChrome && <Header />}
      <SideCart /> {/* Add SideCart component here */}
      <div
        className={`flex min-h-screen flex-col ${showMobileChrome ? 'pb-[var(--mobile-main-pad-bottom)] md:pb-0' : ''}`}
      >
        <main className="min-h-0 flex-1">{children}</main>
        {showMobileChrome && <Newsletter />}
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
