'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
    DollarSign, ShoppingCart, Package, Tag, Users,
    ArrowUpRight, Clock, ChevronRight, Search,
    Box, CheckCircle2, AlertTriangle, Plus, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const STATUS_STYLES = {
    Delivered:  'bg-green-50 text-green-700 border-green-200',
    Shipped:    'bg-blue-50 text-blue-700 border-blue-200',
    Processing: 'bg-purple-50 text-purple-700 border-purple-200',
    Pending:    'bg-orange-50 text-orange-700 border-orange-200',
    Cancelled:  'bg-red-50 text-red-700 border-red-200',
};

const MetricCard = ({ title, value, icon: Icon, accent, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow duration-300"
        style={{ borderColor: 'rgba(216,180,254,0.35)' }}
    >
        <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + '18' }}>
                <Icon size={19} style={{ color: accent }} />
            </div>
        </div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black" style={{ color: '#3b0764' }}>{value}</h3>
    </motion.div>
);

const AdminDashboard = () => {
    const { products, allOrders, fetchAllOrders } = useAppContext();
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user?.email === 'mouffaq@nayalc.com') fetchAllOrders(1, 100);
    }, [fetchAllOrders, user]);

    const stats = useMemo(() => {
        const now = new Date();
        const ago30 = new Date(now.setDate(now.getDate() - 30));
        const recent = allOrders.orders.filter(o => new Date(o.createdAt) >= ago30 && o.status !== 'Cancelled');
        return {
            revenue:   recent.reduce((s, o) => s + Number(o.totalAmount), 0),
            pending:   allOrders.orders.filter(o => o.status === 'Pending').length,
            customers: new Set(allOrders.orders.map(o => o.customerEmail)).size,
        };
    }, [allOrders.orders]);

    if (loading || !user || user.email !== 'mouffaq@nayalc.com') return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-[#9333ea] rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading…</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-8">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: '#3b0764' }}>Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Naya Lumière — Operations Overview</p>
                </div>
                <button
                    onClick={() => router.push('/admin/products')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-[12px] font-bold rounded-xl shadow-lg transition-all active:scale-95"
                    style={{ background: '#9333ea', boxShadow: '0 4px 14px rgba(147,51,234,0.35)' }}
                >
                    <Plus size={15} /> Add Product
                </button>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard title="Revenue (30 days)" value={`AED ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={DollarSign} accent="#9333ea" delay={0.05} />
                <MetricCard title="Pending Orders"    value={stats.pending}        icon={ShoppingCart} accent="#f97316" delay={0.10} />
                <MetricCard title="Products"          value={products.length}      icon={Box}          accent="#9333ea" delay={0.15} />
                <MetricCard title="Customers"         value={stats.customers}      icon={Users}        accent="#db2777" delay={0.20} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Recent orders table */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(216,180,254,0.25)' }}>
                            <h2 className="text-sm font-bold" style={{ color: '#3b0764' }}>Recent Orders</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                                <input
                                    type="text"
                                    placeholder="Filter…"
                                    className="pl-8 pr-4 py-2 bg-purple-50/50 border border-purple-100/50 rounded-lg text-xs focus:outline-none focus:border-purple-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ background: 'rgba(248,240,255,0.6)' }}>
                                        {['Order', 'Customer', 'Date', 'Status', 'Total'].map((h, i) => (
                                            <th key={h} className={`px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-purple-400 ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-50">
                                    {allOrders.orders.slice(0, 8).map(order => (
                                        <tr
                                            key={order.id}
                                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                                            className="hover:bg-purple-50/30 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm font-bold" style={{ color: '#9333ea' }}>#{order.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 truncate max-w-[160px]">{order.customerEmail}</td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <Clock size={11} />
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${STATUS_STYLES[order.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                AED {Number(order.totalAmount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(216,180,254,0.2)', background: 'rgba(248,240,255,0.3)' }}>
                            <button
                                onClick={() => router.push('/admin/orders')}
                                className="w-full py-2.5 text-[11px] font-bold text-purple-500 hover:text-purple-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                                View All Orders <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Low stock */}
                    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold" style={{ color: '#3b0764' }}>Low Stock</h3>
                            <AlertTriangle size={16} className="text-orange-400" />
                        </div>
                        <div className="space-y-4">
                            {products.filter(p => p.stock_quantity <= 5).slice(0, 4).map(p => (
                                <div key={p.id} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex-shrink-0 overflow-hidden">
                                        <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                                        <p className="text-[10px] font-bold text-red-500">{p.stock_quantity} left</p>
                                    </div>
                                    <button onClick={() => router.push('/admin/products')} className="text-gray-300 hover:text-purple-500 transition-colors">
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            ))}
                            {products.filter(p => p.stock_quantity <= 5).length === 0 && (
                                <div className="py-4 text-center">
                                    <CheckCircle2 className="mx-auto text-green-400 mb-2" size={28} strokeWidth={1.5} />
                                    <p className="text-[11px] text-gray-400 font-medium">All stocked</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Brands',     icon: Tag,         href: '/admin/brands',      bg: '#f3e8ff', fg: '#9333ea' },
                            { label: 'Categories', icon: Package,     href: '/admin/categories',  bg: '#fce7f3', fg: '#db2777' },
                            { label: 'Users',      icon: Users,       href: '/admin/users',       bg: '#eff6ff', fg: '#3b82f6' },
                            { label: 'Chat',       icon: MessageSquare, href: '/admin/chat',      bg: '#fff7ed', fg: '#f97316' },
                        ].map(({ label, icon: Icon, href, bg, fg }) => (
                            <button
                                key={label}
                                onClick={() => router.push(href)}
                                className="p-5 rounded-xl border flex flex-col items-center gap-2.5 transition-all hover:shadow-md active:scale-95"
                                style={{ background: bg, borderColor: fg + '30' }}
                            >
                                <Icon size={22} style={{ color: fg }} />
                                <span className="text-[11px] font-bold" style={{ color: fg }}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
