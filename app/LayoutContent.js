'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './context/CartContext';
import { Header } from './components/Header';
import Footer from './components/Footer';
import { Newsletter } from './components/Newsletter';
import MobileBottomNav from './components/MobileBottomNav';
import { AdminButton } from './components/AdminButton';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');
  const isCartPage = pathname === '/cart';

  return (
    <>
      <AdminButton />
      {!isAuthPage && !isAdminPage && !isCartPage && (
        <Header />
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
