'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromLocalStorage = () => {
      console.log('AuthContext: Attempting to load user from local storage.');
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('AuthContext: User loaded from local storage:', parsedUser);
        } else {
          console.log('AuthContext: No user found in local storage.');
        }
      } catch (error) {
        console.error('AuthContext: Failed to load user from local storage:', error);
      } finally {
        setLoading(false);
        console.log('AuthContext: Loading finished.');
      }
    };
    loadUserFromLocalStorage();
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log('AuthContext: User logged in and saved to local storage:', data.user);
    // Assuming the backend sends a token, you might store it here as well
    // localStorage.setItem('token', data.token);
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
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log('AuthContext: User registered and saved to local storage:', data.user);
    // Assuming the backend sends a token, you might store it here as well
    // localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    console.log('AuthContext: User logged out and removed from local storage.');
    // localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading, isAuthenticated: !!user }}>
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