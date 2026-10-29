'use client';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useCart } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import SideCart from './components/SideCart';
import WelcomePopup, { WelcomeBar } from './components/WelcomePopup';
import { WelcomeCornerBadge } from './components/WelcomeCornerBadge';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import GuestWishlistSync from './components/GuestWishlist';
import { ToastContainer } from 'react-toastify';
import { LocaleScope, useLocale } from './context/LocaleContext';
import 'react-toastify/dist/ReactToastify.css';

const ChatWidget = lazy(() => import('./components/ChatWidget'));
const WELCOME_POPUP_SEEN_KEY = 'naya_welcome_popup_seen';
const PAGES_VIEWED_KEY = 'naya_pages_viewed';
// The welcome offer waits for some interest: a second page, or this long on the first
const WELCOME_DELAY_MS = 30000;

const welcomeSeen = () => {
  try { return !!localStorage.getItem(WELCOME_POPUP_SEEN_KEY); } catch { return true; }
};
// Account pages that use AccountShell (keep in step with it); /account/addresses/[id] too
const SIDEBAR_PAGES = ['/account/profile', '/account/settings'];

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const { dir } = useLocale();
  const [chatReady, setChatReady] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeBar, setWelcomeBar] = useState(false);
  const [offerDue, setOfferDue] = useState(false);
  useCart();

  // The welcome offer shows once per visitor, after a second page or 30 seconds,
  // never straight away over the page someone landed on. WelcomeCornerBadge can
  // open it any time (e.g. for someone who dismissed it without taking the code).
  useEffect(() => {
    if (welcomeSeen()) return;
    const timer = setTimeout(() => setOfferDue(true), WELCOME_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (welcomeSeen()) return;
    let views = 1;
    try {
      views = Number(sessionStorage.getItem(PAGES_VIEWED_KEY) || 0) + 1;
      sessionStorage.setItem(PAGES_VIEWED_KEY, String(views));
    } catch {}
    if (views >= 2) setOfferDue(true);
  }, [pathname]);

  const closeWelcome = () => {
    setWelcomeOpen(false);
    setWelcomeBar(false);
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

  // Desktop gets the card; phones get the slim bar, which opens the card on request
  useEffect(() => {
    if (!offerDue || !showMobileChrome || welcomeSeen()) return;
    if (window.matchMedia('(min-width: 768px)').matches) setWelcomeOpen(true);
    else setWelcomeBar(true);
  }, [offerDue, showMobileChrome]);

  return (
    <>
      {showMobileChrome && <WelcomePopup isOpen={welcomeOpen} onClose={closeWelcome} />}
      {showMobileChrome && welcomeBar && !welcomeOpen && (
        <WelcomeBar onOpen={() => { setWelcomeBar(false); setWelcomeOpen(true); }} onClose={closeWelcome} />
      )}
      {showMobileChrome && !welcomeOpen && !welcomeBar && <WelcomeCornerBadge onOpen={() => setWelcomeOpen(true)} />}
      {showMobileChrome && chatReady && <Suspense fallback={null}><ChatWidget /></Suspense>}
      <VerifyEmailBanner />
      <GuestWishlistSync />
      {showMobileChrome && <Header />}
      <SideCart /> {/* Add SideCart component here */}
      <div
        className="flex min-h-screen flex-col"
      >
        <main className="min-h-0 flex-1"><LocaleScope pathname={pathname}>{children}</LocaleScope></main>
        {showMobileChrome && (
          <div className={hasAccountSidebar ? 'md:ps-[200px]' : ''}>
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
        rtl={dir === 'rtl'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
