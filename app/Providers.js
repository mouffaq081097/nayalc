'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import { HeaderProvider } from './context/HeaderContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <UserProvider>
          <AppProvider>
            <CartProvider>
              <HeaderProvider>
                {children}
              </HeaderProvider>
            </CartProvider>
          </AppProvider>
        </UserProvider>
      </AuthProvider>
    </SessionProvider>
  );
}