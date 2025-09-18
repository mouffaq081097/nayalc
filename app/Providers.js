'use client';

import React from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext'; // Import CartProvider
import { enableApiMocking } from './lib/api';

// Enable the mock API before the app renders to intercept API calls
enableApiMocking();

export function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <UserProvider>
            <CartProvider> {/* Wrap with CartProvider */}
              {children}
            </CartProvider>
          </UserProvider>
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
