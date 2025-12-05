'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { DollarSign, ShoppingCart, Package, Tag } from 'lucide-react';

const OrderStatus = {
    Delivered: 'Delivered',
    Shipped: 'Shipped',
    Processing: 'Processing',
    Pending: 'Pending',
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

const AdminDashboard = () => {
    const { products, categories, allOrders, fetchAllOrders } = useAppContext();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth');
            } else if (user.id !== 2) {
                router.push('/');
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && user.id === 2) {
            fetchAllOrders(1, 9999); // Fetch all orders with a large limit for dashboard calculations
        }
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [fetchAllOrders, user]);
    
    if (loading || !user || user.id !== 2) {
        return <div className="min-h-screen flex items-center justify-center">Loading or Unauthorized...</div>;
    }
    
    const totalRevenue = allOrders.orders // Access the orders array
        .filter(o => o.status !== OrderStatus.Cancelled)
        .filter(o => { // Add date filter for last 30 days
            const orderDate = new Date(o.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return orderDate >= thirtyDaysAgo;
        })
        .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const pendingOrders = allOrders.orders // Access the orders array
        .filter(o => o.status === OrderStatus.Pending).length;

    const renderOrderRow = (order) => (
        <tr key={order.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerEmail}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                <p><span className="font-semibold">Customer:</span> {order.customerEmail}</p>
                <p><span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="text-right font-bold mt-2">AED {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}</p>
            </div>
        </div>
    );

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Revenue (Last 30 Days)" value={`AED ${totalRevenue.toFixed(2)}`} icon={DollarSign} />
                <StatCard title="Pending Orders" value={pendingOrders} icon={ShoppingCart} />
                <StatCard title="Total Products" value={products.length} icon={Package} />
                <StatCard title="Total Categories" value={categories.length} icon={Tag} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Orders</h2>
                {isMobile ? (
                    <div className="space-y-4">
                        {allOrders.orders.slice(0, 5).map(order => renderOrderCard(order))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 rounded-t-lg">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allOrders.orders.slice(0, 5).map(order => renderOrderRow(order))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;