'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import {
    Package, CheckCircle, Clock, XCircle, List,
    Search, Filter, ArrowUpRight, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STYLES = {
    pending:    'bg-orange-50 text-orange-700 border-orange-200',
    processing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    shipped:    'bg-blue-50 text-blue-700 border-blue-200',
    delivered:  'bg-green-50 text-green-700 border-green-200',
    cancelled:  'bg-red-50 text-red-700 border-red-200',
};

const StatCard = ({ title, value, icon: Icon, accent, href }) => {
    const inner = (
        <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full"
            style={{ borderColor: 'rgba(216,180,254,0.35)' }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + '18' }}>
                    <Icon size={19} style={{ color: accent }} />
                </div>
                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-black" style={{ color: '#3b0764' }}>{value}</p>
        </motion.div>
    );
    return href ? <Link href={href} className="h-full block">{inner}</Link> : inner;
};

const ManageOrders = () => {
    const { allOrders, fetchAllOrders, deliveredOrders, fetchDeliveredOrders, cancelledOrders, fetchCancelledOrders } = useAppContext();
    const [searchTerm,   setSearchTerm]   = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isLoading,    setIsLoading]    = useState(true);
    const [currentPage,  setCurrentPage]  = useState(1);
    const ordersPerPage = 10;

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchAllOrders(currentPage, ordersPerPage),
                fetchDeliveredOrders(currentPage, ordersPerPage),
                fetchCancelledOrders(currentPage, ordersPerPage),
            ]);
            setIsLoading(false);
        };
        load();
    }, [fetchAllOrders, fetchDeliveredOrders, fetchCancelledOrders, currentPage, ordersPerPage]);

    const filteredOrders = useMemo(() => {
        let list = allOrders.orders || [];
        if (filterStatus !== 'All') list = list.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase());
        if (searchTerm) list = list.filter(o =>
            o.id.toString().includes(searchTerm) || o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return list;
    }, [allOrders.orders, filterStatus, searchTerm]);

    const totalCount   = (allOrders.totalCount || 0) + (deliveredOrders.totalCount || 0) + (cancelledOrders.totalCount || 0);
    const pendingCount = (allOrders.orders || []).filter(o => o.status.toLowerCase() === 'pending').length;
    const totalPages   = Math.max(1, Math.ceil((allOrders.totalCount || 0) / ordersPerPage));

    if (isLoading) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-[#9333ea] rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading…</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-8">

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Total Orders"  value={totalCount}                   icon={List}         accent="#9333ea" />
                <StatCard title="Delivered"     value={deliveredOrders.totalCount}   icon={CheckCircle}  accent="#22c55e" href="/admin/orders/delivered" />
                <StatCard title="Pending"       value={pendingCount}                 icon={Clock}        accent="#f97316" />
                <StatCard title="Cancelled"     value={cancelledOrders.totalCount}   icon={XCircle}      accent="#ef4444" href="/admin/orders/cancelled" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>

                {/* Toolbar */}
                <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'rgba(216,180,254,0.25)' }}>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                        <input
                            type="text" placeholder="Search by order ID or email…"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                            style={{ borderColor: 'rgba(216,180,254,0.4)' }}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-xl" style={{ borderColor: 'rgba(216,180,254,0.4)' }}>
                        <Filter size={13} className="text-gray-400" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="bg-transparent text-[12px] font-semibold text-gray-600 focus:outline-none cursor-pointer">
                            <option value="All">All Orders</option>
                            {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'rgba(248,240,255,0.6)' }}>
                                {['Order ID','Customer','Date','Status','Payment','Total',''].map((h, i) => (
                                    <th key={i} className={`px-6 py-4 text-[10px] font-black text-purple-400 ${i>=5 ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                            <AnimatePresence>
                                {filteredOrders.map(order => (
                                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="group hover:bg-purple-50/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/orders/${order.id}`} className="text-sm font-bold hover:text-purple-700 transition-colors flex items-center gap-1.5" style={{ color: '#9333ea' }}>
                                                #{order.id}
                                                <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{order.customerEmail}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${STATUS_STYLES[order.status.toLowerCase()] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                order.paymentMethod === 'card'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {order.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                            AED {Number(order.totalAmount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/orders/${order.id}`}>
                                                <button className="p-2 rounded-lg border border-transparent hover:border-purple-200 hover:bg-purple-50 text-gray-300 hover:text-purple-500 transition-all">
                                                    <Eye size={16} />
                                                </button>
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(216,180,254,0.2)', background: 'rgba(248,240,255,0.3)' }}>
                    <p className="text-xs text-gray-400">
                        Showing <span className="font-bold text-gray-700">{filteredOrders.length}</span> of <span className="font-bold text-gray-700">{allOrders.totalCount || 0}</span> orders
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-9 h-9 rounded-lg border flex items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-300 disabled:opacity-30 transition-all"
                            style={{ borderColor: 'rgba(216,180,254,0.4)' }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span className="px-3 py-1.5 rounded-lg text-white" style={{ background: '#9333ea' }}>{currentPage}</span>
                            <span className="text-gray-300">of</span>
                            <span className="px-3 py-1.5 rounded-lg bg-white border text-gray-600" style={{ borderColor: 'rgba(216,180,254,0.4)' }}>{totalPages}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-9 h-9 rounded-lg border flex items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-300 disabled:opacity-30 transition-all"
                            style={{ borderColor: 'rgba(216,180,254,0.4)' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {filteredOrders.length === 0 && !isLoading && (
                <div className="min-h-[240px] bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3" style={{ borderColor: 'rgba(216,180,254,0.5)' }}>
                    <Package size={36} className="text-purple-200" />
                    <p className="text-gray-400 font-medium">No orders found</p>
                </div>
            )}
        </div>
    );
};

export default ManageOrders;
