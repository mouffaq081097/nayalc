'use client';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useCart } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import SideCart from './components/SideCart';
import WelcomePopup from './components/WelcomePopup';
import { WelcomeCornerBadge } from './components/WelcomeCornerBadge';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatWidget = lazy(() => import('./components/ChatWidget'));
const WELCOME_POPUP_SEEN_KEY = 'naya_welcome_popup_seen';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const [chatReady, setChatReady] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  useCart();

  // Auto-show the welcome popup once per visitor; WelcomeCornerBadge can also
  // reopen it later (e.g. someone who dismissed it without taking the code).
  useEffect(() => {
    try {
      if (localStorage.getItem(WELCOME_POPUP_SEEN_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setWelcomeOpen(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const closeWelcome = () => {
    setWelcomeOpen(false);
    try {
      localStorage.setItem(WELCOME_POPUP_SEEN_KEY, '1');
    } catch {}
  };

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
  // Account sub-pages have AccountShell's fixed 200px sidebar on desktop; the
  // My account overview (/account itself) doesn't, so its footer stays full width
  const hasAccountSidebar = pathname.startsWith('/account/');
  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout';
  const isNeedAnythingElsePage  = pathname === '/need-anything-else';
  const isOrderConfirmedPage    = pathname.startsWith('/order-confirmed');

  const showMobileChrome =
    !isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage && !isNeedAnythingElsePage && !isOrderConfirmedPage;

  return (
    <>
      {showMobileChrome && <WelcomePopup isOpen={welcomeOpen} onClose={closeWelcome} />}
      {showMobileChrome && !welcomeOpen && <WelcomeCornerBadge onOpen={() => setWelcomeOpen(true)} />}
      {showMobileChrome && chatReady && <Suspense fallback={null}><ChatWidget /></Suspense>}
      <VerifyEmailBanner />
      {showMobileChrome && <Header />}
      <SideCart /> {/* Add SideCart component here */}
      <div
        className="flex min-h-screen flex-col"
      >
        <main className="min-h-0 flex-1">{children}</main>
        {showMobileChrome && (
          <div className={hasAccountSidebar ? 'md:pl-[200px]' : ''}>
            <Footer />
          </div>
        )}
      </div>
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
