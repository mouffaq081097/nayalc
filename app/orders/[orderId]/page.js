'use client';

import { useEffect, useState } from 'react';

import { getOrderById, getProductById } from '@/app/lib/api';

import { OrderConfirmationPage } from '@/app/components/OrderConfirmationPage';

export default function OrderPage({ params }) {
  const { orderId } = params;

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchOrder = async () => {
      console.log('Fetching order for orderId:', orderId);
      try {
        const order = await getOrderById(orderId);
        console.log('Raw order data from API:', order);

        // Fetch product details for each item
        const itemsWithDetails = await Promise.all(order.items.map(async (item) => {
          const productDetails = await getProductById(item.productId);
          console.log(`Fetched product details for ${item.productId}:`, productDetails);
          return { ...item, ...productDetails };
        }));

        const enrichedOrder = { ...order, items: itemsWithDetails };
        console.log('Enriched order data:', enrichedOrder);
        setOrderData(enrichedOrder);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]); // Removed user and router from dependencies as they are no longer used for redirection

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