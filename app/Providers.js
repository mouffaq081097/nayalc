'use client';

import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <UserProvider>
        <AppProvider>
          <CartProvider>
            <Elements stripe={stripePromise}>
              {children}
            </Elements>
          </CartProvider>
        </AppProvider>
      </UserProvider>
    </AuthProvider>
  );
}