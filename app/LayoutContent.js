'use client';
import { usePathname } from 'next/navigation';
import React, { useRef, useEffect, useState } from 'react';
import { useCart } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { Newsletter } from './components/Newsletter';
import MobileBottomNav from './components/MobileBottomNav';
import { AdminButton } from './components/AdminButton';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const [middleBarHeight, setMiddleBarHeight] = useState(0);

  useCart();

  const handleMiddleBarHeightChange = (height) => {
    setMiddleBarHeight(height);
  };

  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');
  const isCartPage = pathname === '/cart';

  return (
    <>
      <AdminButton />
      {!isAuthPage && !isAdminPage && !isCartPage && (
        <Header onMiddleBarHeightChange={handleMiddleBarHeightChange} />
      )}
      <main>
        {children}
      </main>
      {!isAuthPage && !isAdminPage && !isCartPage && <Newsletter />}
      {!isAuthPage && !isAdminPage && !isCartPage && <Footer />}
      {!isAuthPage && !isAdminPage && !isCartPage && <MobileBottomNav />}
    </>
  );
}
