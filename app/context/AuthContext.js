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
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      // Check whether the failure is due to an unverified email
      try {
        const statusRes = await fetch('/api/auth/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const statusData = await statusRes.json();
        if (statusData.needsVerification) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }
      } catch (e) {
        if (e.message === 'EMAIL_NOT_VERIFIED') throw e;
      }
      throw new Error('Invalid email or password.');
    }

    if (result?.ok) {
      router.push(callbackUrl);
    }
  }, [router]);

  const register = useCallback(async (username, email, password, firstName, lastName) => {
    const response = await fetch(`/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, firstName, lastName }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error || 'Registration failed');
      throw new Error(data.error || 'Registration failed');
    }

    // Registration successful — do NOT auto-login; email verification is required.
    // Return the flag so the UI can show the "check your email" screen.
    return { requiresEmailVerification: data.requiresEmailVerification === true };
  }, []);

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/auth' });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading, isAuthenticated }}>
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
