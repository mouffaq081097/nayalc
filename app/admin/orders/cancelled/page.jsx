'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../../context/AppContext';
import { Badge } from '../../../components/ui/badge';
import { ChevronLeft } from 'lucide-react'; // Import ChevronLeft icon
import { Button } from '@/app/components/ui/button'; // Added Button import for pagination

const CancelledOrdersPage = () => {
    const { cancelledOrders, fetchCancelledOrders } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(10); // Match API default

    useEffect(() => {
        fetchCancelledOrders(currentPage, ordersPerPage);
    }, [fetchCancelledOrders, currentPage, ordersPerPage]); // Added currentPage, ordersPerPage to dependencies

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/admin/orders" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to All Orders
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Cancelled Orders</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Address</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cancelledOrders.orders.map((order) => ( // Corrected: Access orders array
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
                                        {new Date(order.cancelledAt).toLocaleDateString()}
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
                                        <Badge variant="cancelled">{order.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6">
                    <Button // Changed from button to Button component
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        variant="outline" // Added variant
                    >
                        Previous
                    </Button>
                    <span>
                        Page {currentPage} of {Math.ceil(cancelledOrders.totalCount / ordersPerPage)}
                    </span>
                    <Button // Changed from button to Button component
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(cancelledOrders.totalCount / ordersPerPage), prev + 1))}
                        disabled={currentPage === Math.ceil(cancelledOrders.totalCount / ordersPerPage)}
                        variant="outline" // Added variant
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CancelledOrdersPage;