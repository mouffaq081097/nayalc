'use client';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useCart } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { Newsletter } from './components/Newsletter';
import MobileBottomNav from './components/MobileBottomNav';
import { AdminButton } from './components/AdminButton';
import SideCart from './components/SideCart'; // Import SideCart

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  useCart();

  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');
  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout'; // New line

  return (
    <>
      <AdminButton />
      {!isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage && (
        <Header />
      )}
      <SideCart /> {/* Add SideCart component here */}
      <main>
        {children}
      </main>
      {!isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage && <Newsletter />}
      {!isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage && <Footer />}
      {!isAuthPage && !isAdminPage && !isCartPage && !isCheckoutPage && <MobileBottomNav />}
    </>
  );
}
