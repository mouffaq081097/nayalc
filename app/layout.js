'use client';
import "./globals.css";
import { Providers } from './Providers'; // Import the Providers component
import Header from './components/Header'; // Import the Header component
import Footer from './components/Footer'; // Import the Footer component
import MobileBottomNav from './components/MobileBottomNav'; // Import the MobileBottomNav component
import { usePathname } from 'next/navigation';



export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="en">
      <body className="antialiased"> {/* Removed bg-red-500 class */}
        <Providers> {/* Wrap children with Providers */}
          {!isAuthPage && !isAdminPage && <Header />} {/* Conditionally render Header */}
          <main>
            {children}
          </main>
          {!isAuthPage && !isAdminPage && <Footer />} {/* Conditionally render Footer */}
          {!isAuthPage && !isAdminPage && <MobileBottomNav />} {/* Conditionally render MobileBottomNav */}
        </Providers>
      </body>
    </html>
  );
}
