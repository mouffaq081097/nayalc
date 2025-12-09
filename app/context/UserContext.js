'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.js'; // Import useAuth
import { createFetchWithAuth } from '../lib/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth(); // Get user and isAuthenticated from AuthContext
  const fetchWithAuth = createFetchWithAuth(logout);
  const [userData, setUserData] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [shippingAddresses, setShippingAddresses] = useState([]);

  // Function to fetch contact info from the backend
  const fetchContactInfo = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setContactInfo({ name: '', email: '', phone: '' });
      return;
    }
    try {
      const data = await fetchWithAuth(`/api/users/${user.id}/contact-info`);

      setContactInfo({
        name: data.customer_name || '',
        email: user.email, // Email always from AuthContext user
        phone: data.customer_phone || '',
      });
    } catch (error) {
      console.error('Error fetching contact info:', error);
      setContactInfo({ name: '', email: user.email, phone: '' }); // Fallback
    }
  }, [isAuthenticated, user]);

  // Function to fetch shipping addresses from the backend
  const fetchShippingAddresses = useCallback(async () => {

    if (!isAuthenticated || !user?.id) {

      setShippingAddresses([]);
      return;
    }

    try {
      const data = await fetchWithAuth(`/api/users/${user.id}/addresses`);

      setShippingAddresses(data);
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
      setShippingAddresses([]);
    }
  }, [isAuthenticated, user]);

  // Fetch addresses on component mount or when user changes
  useEffect(() => {
    fetchShippingAddresses();
    fetchContactInfo(); // Fetch contact info as well
  }, [user, isAuthenticated, fetchContactInfo, fetchShippingAddresses]); // Re-fetch when user or auth status changes

  // Function to update contact info from shipping addresses
  const updateContactInfoFromAddresses = useCallback(() => {

    if (!isAuthenticated || !user?.id) {

      setContactInfo({ name: '', email: '', phone: '' });
      return;
    }

    if (shippingAddresses.length > 0) {
      const firstAddress = shippingAddresses[0];

      setContactInfo({
        name: firstAddress.customer_name || '', // No fallback to user.username
        email: user.email, // Email always from AuthContext user
        phone: firstAddress.customer_phone || '',
      });

    } else {
      setContactInfo({ name: '', email: user.email, phone: '' }); // No fallback to user.username

    }
  }, [isAuthenticated, user, shippingAddresses]);

  // Fetch addresses on component mount or when user changes
  useEffect(() => {
    fetchShippingAddresses();
  }, [user, isAuthenticated, fetchShippingAddresses]); // Re-fetch when user or auth status changes

  // Update contact info when shipping addresses or user changes
  useEffect(() => {
    updateContactInfoFromAddresses();
  }, [user, isAuthenticated, shippingAddresses, updateContactInfoFromAddresses]); // This will trigger when shippingAddresses changes

  // Update contact info (client-side and backend)
  const updateContactInfo = async (newContactInfo) => {
    if (!isAuthenticated || !user?.id) return;
    try {
      await fetchWithAuth(`/api/users/${user.id}/contact-info`, {
        method: 'PUT',
        body: JSON.stringify({ name: newContactInfo.name, phone: newContactInfo.phone }),
      });
      // If update is successful, update client-side state and re-fetch addresses to ensure consistency
      setContactInfo(newContactInfo);
      fetchShippingAddresses(); // Re-fetch addresses to update customer_name/phone if they were updated

    } catch (error) {
      console.error('Error updating contact info:', error);
    }
  };

  const addShippingAddress = async (newAddress) => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const transformedAddress = {
        address_line1: newAddress.shipping_address || '',
        city: newAddress.city || '',
        zip_code: newAddress.zip_code || '',
        country: newAddress.country || '',
        address_line2: newAddress.address_line2 || null,
        state: newAddress.state || null,
        is_default: newAddress.is_default || false,
        address_label: newAddress.address_label || 'Other',
        customer_name: newAddress.customer_name || '',
        customer_email: newAddress.customer_email || user.email || '',
        customer_phone: newAddress.customer_phone || '',
      };
      await fetchWithAuth(`/api/users/${user.id}/addresses`, {
        method: 'POST',
        body: JSON.stringify(transformedAddress),
      });
      // Re-fetch addresses to get the latest list from the backend
      fetchShippingAddresses();
    } catch (error) {
      console.error('Error adding shipping address:', error);
    }
  };

  const updateShippingAddress = async (updatedAddress) => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const transformedAddress = {
        address_line1: updatedAddress.shipping_address || '',
        city: updatedAddress.city || '',
        zip_code: updatedAddress.zip_code || '',
        country: updatedAddress.country || '',
        address_line2: updatedAddress.address_line2 || null,
        state: updatedAddress.state || null,
        is_default: updatedAddress.is_default || false,
        address_label: updatedAddress.address_label || 'Other',
        customer_name: updatedAddress.customer_name || '',
        customer_email: updatedAddress.customer_email || user.email || '',
        customer_phone: updatedAddress.customer_phone || '',
      };
      await fetchWithAuth(`/api/users/${user.id}/addresses/${updatedAddress.id}`, {
        method: 'PUT',
        body: JSON.stringify(transformedAddress),
      });
      fetchShippingAddresses();
    } catch (error) {
      console.error('Error updating shipping address:', error);
    }
  };

  const deleteShippingAddress = async (addressId) => {
    if (!isAuthenticated || !user?.id) return;
    try {
      await fetchWithAuth(`/api/users/${user.id}/addresses/${addressId}`, {
        method: 'DELETE',
      });
      fetchShippingAddresses();
    } catch (error) {
      console.error('Error deleting shipping address:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      userData,
      updateContactInfoFromAddresses, // Changed from fetchUserData
      setUserData,
      contactInfo,
      shippingAddresses,
      updateContactInfo,
      addShippingAddress,
      updateShippingAddress,
      deleteShippingAddress,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
