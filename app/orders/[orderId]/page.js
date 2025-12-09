'use client';

import { useEffect, useState, useMemo } from 'react'; // Added useMemo
import { useParams, useRouter } from 'next/navigation';
import { createFetchWithAuth } from '@/app/lib/api'; // Changed import
import { useAuth } from '@/app/context/AuthContext'; // Added import for useAuth

import { OrderDetailsPage } from '@/app/components/OrderDetailsPage';

export default function OrderPage() {
  const params = useParams();
  const { orderId } = params;

  const { user, logout } = useAuth(); // Get user and logout function from AuthContext
  const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]); // Initialize fetchWithAuth

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchOrder = async () => {
      console.log('User:', user);
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      try {
        const response = await fetchWithAuth(`/api/orders/${orderId}`); // Direct fetch
        const order = await response.json();
        

        // The API now returns enriched order data, so client-side enrichment is not needed.
        setOrderData(order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) { // Only fetch if orderId is available
        fetchOrder();
    }
  }, [orderId, fetchWithAuth, user]); // Added fetchWithAuth and user to dependencies

  const router = useRouter();

  if (loading) {
    return <div className="text-center py-8">Loading order details...</div>;
  }


  if (!orderData) {
    return <div className="text-center py-8 text-red-500">Order not found or an error occurred.</div>;
  }

  return (
    <OrderDetailsPage
      order={orderData}
      onContinueShopping={() => router.push('/')}
      onViewAccount={() => router.push('/account')}
    />
  );
}