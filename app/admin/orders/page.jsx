'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import { Package, CheckCircle, Clock, XCircle, DollarSign, List, Search } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '@/app/components/ui/button';

const OrderStatus = {
    Pending: 'Pending',
    Processing: 'Processing',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
};

const StatCard = ({ title, value, icon }) => ( // Removed color prop
    <div className="p-6 rounded-2xl shadow-lg flex items-center space-x-4 bg-white border border-gray-200"> {/* Neutral background and border */}
        <div className="bg-indigo-100 p-3 rounded-full"> {/* Light indigo background for icon */}
            {React.createElement(icon, { className: "w-6 h-6 text-indigo-600" })} {/* Indigo icon */}
        </div>
        <div>
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3> {/* Darker text */}
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p> {/* Even darker text */}
        </div>
    </div>
);

const ManageOrders = () => {
    const { allOrders, fetchAllOrders, updateOrderStatus, deliveredOrders, fetchDeliveredOrders, cancelledOrders, fetchCancelledOrders } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(10); // Matches API default

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchAllOrders(currentPage, ordersPerPage),
                fetchDeliveredOrders(currentPage, ordersPerPage),
                fetchCancelledOrders(currentPage, ordersPerPage)
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchAllOrders, fetchDeliveredOrders, fetchCancelledOrders, currentPage, ordersPerPage]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
        } catch (error) {
            console.error('Failed to update order status:', error);
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
        let filtered = allOrders.orders; // Use orders array from the object

        if (filterStatus !== 'All') {
            filtered = filtered.filter(order => order.status.toLowerCase() === filterStatus.toLowerCase());
        }

        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.id.toString().includes(searchTerm.toLowerCase()) ||
                order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [allOrders.orders, filterStatus, searchTerm]);


    const totalRevenue = useMemo(() =>
        // Sum totalAmount from all orders (across all pages for an accurate total)
        // This will require fetching all orders' totalAmount if not already available in a summary.
        // For now, I'll calculate based on the current page's orders, which might not be accurate.
        // A better approach would be to have the API return totalRevenue as well.
        allOrders.orders.reduce((sum, order) => sum + (order.status.toLowerCase() !== OrderStatus.Cancelled.toLowerCase() ? order.totalAmount : 0), 0),
        [allOrders.orders]
    );

    const totalOrders = allOrders.totalCount + deliveredOrders.totalCount + cancelledOrders.totalCount; // Use totalCount
    const pendingOrders = allOrders.orders.filter(order => order.status.toLowerCase() ===  OrderStatus.Pending.toLowerCase()).length; // Filter on current page's orders
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* <StatCard title="Total Revenue" value={`AED ${totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-green-500" /> */}
                <StatCard title="Total Orders" value={totalOrders} icon={List} />
                <Link href="/admin/orders/delivered" className="block">
                    <StatCard title="Delivered Orders" value={deliveredOrders.totalCount} icon={CheckCircle} />
                </Link>
                <Link href="/admin/orders/cancelled" className="block">
                    <StatCard title="Cancelled Orders" value={cancelledOrders.totalCount} icon={XCircle} />
                </Link>
                <StatCard title="Pending Orders" value={pendingOrders} icon={Clock} />
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <div className="relative w-full md:w-auto flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Customer Email..."
                            className="pl-10 pr-4 py-2 border rounded-full w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(OrderStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 rounded-t-lg">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                        <Link href={`/admin/orders/${order.id}`}>#{order.id}</Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerEmail}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">AED {order.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Button variant="outline" size="sm">View</Button>
                                        </Link>
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
                        disabled={currentPage === 1 || isLoading}
                        variant="outline"
                    >
                        Previous
                    </Button>
                    <span>
                        Page {currentPage} of {Math.ceil(allOrders.totalCount / ordersPerPage)}
                    </span>
                    <Button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allOrders.totalCount / ordersPerPage), prev + 1))}
                        disabled={currentPage === Math.ceil(allOrders.totalCount / ordersPerPage) || isLoading}
                        variant="outline"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ManageOrders;