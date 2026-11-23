'use client';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useCart } from './context/CartContext';
import { useAppContext } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import SideCart from './components/SideCart';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import GuestWishlistSync from './components/GuestWishlist';
import { ToastContainer } from 'react-toastify';
import { LocaleScope, useLocale } from './context/LocaleContext';
import 'react-toastify/dist/ReactToastify.css';

const ChatWidget = lazy(() => import('./components/ChatWidget'));
// Account pages that use AccountShell (keep in step with it); /account/addresses/[id] too
const SIDEBAR_PAGES = ['/account/profile', '/account/settings'];

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const { dir } = useLocale();
  const { isChatOpen } = useAppContext();
  // The chat opens only from Support on My account, so it loads (and connects to the
  // server, which reads the database) the first time it's opened — not on every page
  // for every signed-in shopper. It stays mounted afterwards so it can close smoothly.
  const [chatReady, setChatReady] = useState(false);
  useCart();
  // No welcome discount: the clinic partnership gives 5%, so the site must not offer more.

  useEffect(() => {
    if (isChatOpen) setChatReady(true);
  }, [isChatOpen]);

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
