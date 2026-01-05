'use client';
import React, { createContext, useContext } from 'react';
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

  const login = async (email, password) => {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      const errorMessage = 'Invalid email or password.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (result?.ok) {
      toast.success('Logged in successfully!');
      router.push('/'); // Redirect after successful login
    }
  };

  const register = async (username, email, password, firstName, lastName) => {
    const response = await fetch(`/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, firstName, lastName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.error || 'Registration failed');
      throw new Error(errorData.error || 'Registration failed');
    }

    // After successful registration, log the user in
    await login(email, password);
  };

  const logout = () => {
    signOut({ callbackUrl: '/auth' });
  };

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