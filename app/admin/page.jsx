'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DollarSign, ShoppingCart, Package, Tag, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderStatus = {
    Delivered: 'Delivered',
    Shipped: 'Shipped',
    Processing: 'Processing',
    Pending: 'Pending',
    Cancelled: 'Cancelled',
};

const StatCard = ({ title, value, icon, color }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 bg-white border border-gray-100 group"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10 transition-transform duration-500 group-hover:scale-110`}>
                {React.createElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300" />
        </div>
        <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const { products, categories, allOrders, fetchAllOrders } = useAppContext();
    const { user, loading } = useAuth();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (user && user.email === 'mouffaq@nayalc.com') {
            fetchAllOrders(1, 9999);
        }
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [fetchAllOrders, user]);
    
    if (loading || !user || user.email !== 'mouffaq@nayalc.com') {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Verifying Authority...</p>
            </div>
        );
    }
    
    const totalRevenue = allOrders.orders
        .filter(o => o.status !== OrderStatus.Cancelled)
        .filter(o => {
            const orderDate = new Date(o.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return orderDate >= thirtyDaysAgo;
        })
        .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const pendingOrders = allOrders.orders
        .filter(o => o.status === OrderStatus.Pending).length;

    const renderOrderRow = (order) => (
        <tr key={order.id} className="group hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-gray-900">#{order.id}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{order.customerEmail}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Verified Client</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                    order.status === OrderStatus.Delivered ? 'bg-green-50 text-green-700 border-green-100' :
                    order.status === OrderStatus.Shipped ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    order.status === OrderStatus.Processing ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                    order.status === OrderStatus.Pending ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    'bg-red-50 text-red-700 border-red-100'
                }`}>
                    {order.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-bold text-gray-900">AED {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}</span>
            </td>
        </tr>
    );

    const renderOrderCard = (order) => (
        <div key={order.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Order ID</span>
                    <span className="font-bold text-gray-900 text-lg">#{order.id}</span>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                    order.status === OrderStatus.Delivered ? 'bg-green-50 text-green-700 border-green-100' :
                    order.status === OrderStatus.Shipped ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    order.status === OrderStatus.Processing ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                    order.status === OrderStatus.Pending ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    'bg-red-50 text-red-700 border-red-100'
                }`}>
                    {order.status}
                </span>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Customer</span>
                    <span className="font-medium text-gray-900">{order.customerEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Date</span>
                    <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                    <span className="text-lg font-bold text-gray-900">AED {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-6 flex items-center gap-3">
                    <span className="w-10 h-px bg-indigo-600/20"></span>
                    Market Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Revenue (30d)" value={`AED ${totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-green-500" />
                    <StatCard title="Pending" value={pendingOrders} icon={ShoppingCart} color="bg-orange-500" />
                    <StatCard title="Products" value={products.length} icon={Package} color="bg-indigo-500" />
                    <StatCard title="Categories" value={categories.length} icon={Tag} color="bg-pink-500" />
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Orders</h2>
                        <p className="text-sm text-gray-400 mt-1">Real-time acquisition data from your storefront</p>
                    </div>
                    <button className="px-6 py-2.5 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
                        View Analytics
                    </button>
                </div>
                
                <div className="p-4 md:p-8">
                    {isMobile ? (
                        <div className="space-y-4">
                            {allOrders.orders.slice(0, 5).map(order => renderOrderCard(order))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {allOrders.orders.slice(0, 5).map(order => renderOrderRow(order))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;