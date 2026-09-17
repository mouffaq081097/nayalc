'use client';
import React, { createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user || null;
  const loading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const login = useCallback(async (email, password, callbackUrl = '/') => {
    const result = await signIn('credentials', { redirect: false, email, password });

    if (result?.error) {
      if (result.error === 'ACCOUNT_SUSPENDED') {
        throw new Error('This account has been suspended. Please contact support.');
      }
      throw new Error('Invalid email or password.');
    }

    if (result?.ok) router.push(callbackUrl);
  }, [router]);

  const register = useCallback(async (fullName, email, password, callbackUrl = '/') => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, callbackUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error || 'Registration failed');
      throw new Error(data.error || 'Registration failed');
    }

    // Soft verification: the account is live immediately, so sign in right here
    // rather than parking the user on a "check your email" dead end. The
    // verification nudge is handled by VerifyEmailBanner.
    const result = await signIn('credentials', { redirect: false, email, password });

    if (result?.error) {
      // Account exists but auto-login failed — send them to the form rather
      // than leaving them stranded on a spinner.
      throw new Error('Account created. Please sign in to continue.');
    }

    router.push(callbackUrl);
    return { emailVerified: false };
  }, [router]);

  // Google / Apple. NextAuth owns the redirect dance from here.
  const loginWithProvider = useCallback((provider, callbackUrl = '/') => {
    return signIn(provider, { callbackUrl });
  }, []);

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/auth' });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, loginWithProvider, loading, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
