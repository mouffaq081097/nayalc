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
// Account pages that use AccountShell (keep in step with it); /account/addresses/[id] too
const SIDEBAR_PAGES = ['/account/profile', '/account/settings'];

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
  // Account pages inside AccountShell have its fixed 200px sidebar on desktop, so
  // the footer moves over by the same width. The pages redone after Pitaka (My
  // account, Addresses, Orders, Wishlist, Naya Rewards) have no sidebar and keep it full width.
  const hasAccountSidebar = SIDEBAR_PAGES.some(path => pathname === path || pathname.startsWith(`${path}/`))
    || /^\/account\/addresses\/[^/]+/.test(pathname);
  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout';
  const isOrderConfirmedPage    = pathname.startsWith('/order-confirmed');

  const showMobileChrome =
    !isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage && !isOrderConfirmedPage;

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
