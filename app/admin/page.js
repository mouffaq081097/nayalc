'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

// Define OrderStatus as a JavaScript object
const OrderStatus = {
    Delivered: 'Delivered',
    Shipped: 'Shipped',
    Processing: 'Processing',
    Pending: 'Pending',
    Cancelled: 'Cancelled', // Assuming a Cancelled status might exist
};

const StatCard = ({ title, value, color }) => (
    <div className={`p-6 rounded-lg shadow-md ${color}`}>
        <h3 className="text-lg font-semibold text-white/80">{title}</h3>
        <p className="text-4xl font-bold text-white mt-2">{value}</p>
    </div>
);

const AdminDashboard = () => {
    const { products, categories, allOrders, fetchAllOrders } = useAppContext();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth'); // Redirect to login if not authenticated
            } else if (user.id !== 2) {
                router.push('/'); // Redirect to home if not admin (user.id !== 2)
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && user.id === 2) { // Only fetch data if authorized
            fetchAllOrders();
        }
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [fetchAllOrders, user]);
    
    // Render nothing or a loading spinner if not authorized or still loading
    if (loading || !user || user.id !== 2) {
        return <div className="min-h-screen flex items-center justify-center">Loading or Unauthorized...</div>;
    }
    
    // Ensure allOrders is an array before filtering and reducing
    const totalRevenue = Array.isArray(allOrders)
        ? allOrders
            .filter(o => o.status !== OrderStatus.Cancelled)
            .reduce((sum, order) => sum + order.totalAmount, 0)
        : 0;
    
    const pendingOrders = Array.isArray(allOrders)
        ? allOrders.filter(o => o.status === OrderStatus.Pending).length
        : 0;

    const renderOrderRow = (order) => (
        <tr key={order.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === OrderStatus.Delivered ? 'bg-green-100 text-green-800' :
                    order.status === OrderStatus.Shipped ? 'bg-blue-100 text-blue-800' :
                    order.status === OrderStatus.Processing ? 'bg-yellow-100 text-yellow-800' :
                    order.status === OrderStatus.Pending ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {order.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">AED {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}</td>
        </tr>
    );

    const renderOrderCard = (order) => (
        <div key={order.id} className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-900">Order #{order.id}</span>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === OrderStatus.Delivered ? 'bg-green-100 text-green-800' :
                    order.status === OrderStatus.Shipped ? 'bg-blue-100 text-blue-800' :
                    order.status === OrderStatus.Processing ? 'bg-yellow-100 text-yellow-800' :
                    order.status === OrderStatus.Pending ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {order.status}
                </span>
            </div>
            <div className="text-sm text-gray-600">
                <p><span className="font-semibold">Customer:</span> {order.customerName}</p>
                <p><span className="font-semibold">Date:</span> {new Date(order.orderDate).toLocaleDateString()}</p>
                <p className="text-right font-bold mt-2">AED {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}</p>
            </div>
        </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`AED ${totalRevenue.toFixed(2)}`} color="bg-green-500" />
                <StatCard title="Pending Orders" value={pendingOrders} color="bg-yellow-500" />
                <StatCard title="Total Products" value={products.length} color="bg-blue-500" />
                <StatCard title="Total Categories" value={categories.length} color="bg-purple-500" />
            </div>
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Orders</h2>
                {isMobile ? (
                    <div>
                        {Array.isArray(allOrders) && allOrders.slice(0, 5).map(order => renderOrderCard(order))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Array.isArray(allOrders) && allOrders.slice(0, 5).map(order => renderOrderRow(order))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;