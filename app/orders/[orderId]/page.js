'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getOrderById } from '@/app/lib/api';

import { OrderConfirmationPage } from '@/app/components/OrderConfirmationPage';

export default function OrderPage() {
  const params = useParams();
  const { orderId } = params;

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchOrder = async () => {
      
      try {
        const order = await getOrderById(orderId);
        

        // The API now returns enriched order data, so client-side enrichment is not needed.
        setOrderData(order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="text-center py-8">Loading order details...</div>;
  }

  if (!orderData) {
    return <div className="text-center py-8 text-red-500">Order not found or an error occurred.</div>;
  }

  return (
    <OrderConfirmationPage order={orderData} />
  );
}