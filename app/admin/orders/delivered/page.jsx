'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../../context/AppContext';
import { Badge } from '../../../components/ui/badge';
import { ChevronLeft } from 'lucide-react'; // Import ChevronLeft icon
import { Button } from '@/app/components/ui/button'; // Import Button component

const DeliveredOrdersPage = () => {
    const { deliveredOrders, fetchDeliveredOrders } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(10); // Match API default

    useEffect(() => {
        fetchDeliveredOrders(currentPage, ordersPerPage);
    }, [fetchDeliveredOrders, currentPage, ordersPerPage]);

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/admin/orders" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to All Orders
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Delivered Orders</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Address</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {deliveredOrders.orders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <Link href={`/admin/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900">
                                            {order.id}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <p>{order.customerEmail}</p>
                                        <p className="text-xs text-gray-400">{order.customerPhone}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.deliveredAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.items ? order.items.length : 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <p>{order.shippingAddress}, {order.city}</p>
                                        <p className="text-xs text-gray-400">{order.zipCode}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        AED {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <Badge variant="delivered">{order.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6">
                    <Button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                    >
                        Previous
                    </Button>
                    <span>
                        Page {currentPage} of {Math.ceil(deliveredOrders.totalCount / ordersPerPage)}
                    </span>
                    <Button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(deliveredOrders.totalCount / ordersPerPage), prev + 1))}
                        disabled={currentPage === Math.ceil(deliveredOrders.totalCount / ordersPerPage)}
                        variant="outline"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeliveredOrdersPage;