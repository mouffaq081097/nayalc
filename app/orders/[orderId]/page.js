'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '../../../app/context/AppContext';

const OrderConfirmationPage = () => {
    const { orderId } = useParams();
    const { fetchOrderById, products } = useAppContext();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getOrderDetails = async () => {
            if (!orderId) return;
            try {
                setLoading(true);
                const fetchedOrder = await fetchOrderById(orderId);
                setOrder(fetchedOrder);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        getOrderDetails();
    }, [orderId, fetchOrderById]);



    if (loading) {
        return <div className="text-center py-20">Loading order details...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    }

    if (!order) {
        return <div className="text-center py-20">Order not found.</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen py-12">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">Order Confirmed!</h1>
                    <p className="text-gray-600 mt-2">Thank you for your purchase. Your order has been placed successfully.</p>
                </div>

                <div className="border-t border-b border-gray-200 py-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
                    <div className="grid grid-cols-2 gap-4 text-gray-700">
                        <div>
                            <p><span className="font-semibold">Order ID:</span> {order.id}</p>
                            <p><span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><span className="font-semibold">Total:</span> AED {order.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                            <p><span className="font-semibold">Status:</span> {order.orderStatus}</p>
                            <p><span className="font-semibold">Payment:</span> {order.paymentMethod}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Details</h2>
                    <p className="text-gray-700"><span className="font-semibold">Name:</span> {order.customerName}</p>
                    <p className="text-gray-700"><span className="font-semibold">Address:</span> {order.shippingAddress}, {order.city}, {order.zipCode}, {order.country}</p>
                    <p className="text-gray-700"><span className="font-semibold">Phone:</span> {order.customerPhone}</p>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Items Ordered</h2>
                    <div className="space-y-4">
                        {order.items.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return null;
                            return (
                                <div key={index} className="flex items-center space-x-4">
                                <Image src={product.imageUrls[0]} alt={product.name} width={64} height={64} objectFit="cover" className="rounded-md" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{product.name}</p>
                                        <p className="text-gray-600 text-sm">{item.quantity} x AED {item.price.toFixed(2)}</p>
                                    </div>
                                    <p className="font-semibold text-gray-800">AED {(item.quantity * item.price).toFixed(2)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/orders" className="text-blue-600 hover:underline font-semibold">
                        View all your orders
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
