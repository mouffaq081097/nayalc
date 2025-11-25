'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import { Package, CheckCircle, Clock, XCircle, DollarSign, List } from 'lucide-react';
import { Badge } from '../../components/ui/badge'; // Import the Badge component

const OrderStatus = {
    Pending: 'Pending',
    Processing: 'Processing',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
};

const ManageOrders = () => {
    const { allOrders, fetchAllOrders, updateOrderStatus, deliveredOrders, fetchDeliveredOrders, cancelledOrders, fetchCancelledOrders } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchAllOrders();
        fetchDeliveredOrders();
        fetchCancelledOrders();
    }, [fetchAllOrders, fetchDeliveredOrders, fetchCancelledOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            // For now, trackingNumber, courierName, courierWebsite are not managed directly here
            // but the updateOrderStatus function in AppContext can handle them if passed
            await updateOrderStatus(orderId, newStatus);
        } catch (error) {
            console.error('Failed to update order status:', error);
            // Optionally, show a user-friendly error message
        }
    };

    const getStatusVariant = (status) => {
        switch (status.toLowerCase()) {
            case OrderStatus.Pending.toLowerCase():
                return 'pending';
            case OrderStatus.Processing.toLowerCase():
                return 'processing';
            case OrderStatus.Shipped.toLowerCase():
                return 'shipped';
            case OrderStatus.Delivered.toLowerCase():
                return 'delivered';
            case OrderStatus.Cancelled.toLowerCase():
                return 'cancelled';
            default:
                return 'default';
        }
    };

    const filteredOrders = useMemo(() => {
        let filtered = allOrders;

        if (filterStatus !== 'All') {
            filtered = filtered.filter(order => order.status.toLowerCase() === filterStatus.toLowerCase());
        }

        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.id.toString().includes(searchTerm.toLowerCase()) ||
                order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.shippingAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.city.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [allOrders, filterStatus, searchTerm]);


    const totalRevenue = useMemo(() =>
        allOrders.reduce((sum, order) => sum + (order.status.toLowerCase() !== OrderStatus.Cancelled.toLowerCase() ? order.totalAmount : 0), 0),
        [allOrders]
    );

    const totalOrders = allOrders.length + deliveredOrders.length + cancelledOrders.length;
    const pendingOrders = allOrders.filter(order => order.status.toLowerCase() ===  OrderStatus.Pending.toLowerCase()).length;
    const processingOrders = allOrders.filter(order => order.status.toLowerCase() === OrderStatus.Processing.toLowerCase()).length;
    const shippedOrders = allOrders.filter(order => order.status.toLowerCase() === OrderStatus.Shipped.toLowerCase()).length;
    const currentDeliveredOrdersCount = deliveredOrders.length; // Use the count from the fetched delivered orders
    const currentCancelledOrdersCount = cancelledOrders.length; // Use the count from the fetched cancelled orders


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Manage Orders</h1>

            {/* Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-semibold text-gray-900">AED {totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500 opacity-60" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Orders</p>
                        <p className="text-2xl font-semibold text-gray-900">{totalOrders}</p>
                    </div>
                    <List className="h-8 w-8 text-indigo-500 opacity-60" />
                </div>
                <Link href="/admin/orders/delivered" className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow duration-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Delivered Orders</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentDeliveredOrdersCount}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500 opacity-60" />
                </Link>
                <Link href="/admin/orders/cancelled" className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow duration-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Cancelled Orders</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentCancelledOrdersCount}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500 opacity-60" />
                </Link>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                        <p className="text-2xl font-semibold text-gray-900">{pendingOrders}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500 opacity-60" />
                </div>
            </div>
            
            {/* Filter and Search */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by ID, customer, address..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 md:w-1/4"
                >
                    <option value="All">All Statuses</option>
                    {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(filteredOrders) && filteredOrders.map((order) => (
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
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.items ? order.items.length : 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <p>{order.shippingAddress}, {order.city}</p>
                                        <p className="text-xs text-gray-400">{order.zipCode}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.paymentMethod}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        AED {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <button className="text-indigo-600 hover:text-indigo-900 font-medium">View</button>
                                        </Link>
                                        {/* Status update dropdown */}
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className="ml-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            disabled={order.status === OrderStatus.Cancelled || order.status === OrderStatus.Delivered}
                                        >
                                            {Object.values(OrderStatus).map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageOrders;