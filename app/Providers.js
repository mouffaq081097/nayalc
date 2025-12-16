'use client';

import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <UserProvider>
        <AppProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AppProvider>
      </UserProvider>
    </AuthProvider>
  );
}