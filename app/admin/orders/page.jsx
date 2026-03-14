'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import { Package, CheckCircle, Clock, XCircle, DollarSign, List, Search, Filter, ArrowUpRight, ChevronLeft, ChevronRight, MoreHorizontal, Eye } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const OrderStatus = {
    Pending: 'Pending',
    Processing: 'Processing',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
};

const StatCard = ({ title, value, icon, color, href }) => {
    const Card = (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer h-full`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 transition-transform duration-500 group-hover:scale-110`}>
                    {React.createElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
            </div>
        </motion.div>
    );

    return href ? <Link href={href}>{Card}</Link> : Card;
};

const ManageOrders = () => {
    const { allOrders, fetchAllOrders, updateOrderStatus, deliveredOrders, fetchDeliveredOrders, cancelledOrders, fetchCancelledOrders } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);

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

    const getStatusStyles = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'processing': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const filteredOrders = useMemo(() => {
        let filtered = allOrders.orders || [];
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

    const totalOrdersCount = (allOrders.totalCount || 0) + (deliveredOrders.totalCount || 0) + (cancelledOrders.totalCount || 0);
    const pendingCount = (allOrders.orders || []).filter(order => order.status.toLowerCase() === 'pending').length;

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Retrieving Acquisitions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Volume" value={totalOrdersCount} icon={List} color="bg-indigo-500" />
                <StatCard title="Successful" value={deliveredOrders.totalCount} icon={CheckCircle} color="bg-green-500" href="/admin/orders/delivered" />
                <StatCard title="Pending Review" value={pendingCount} icon={Clock} color="bg-orange-500" />
                <StatCard title="Voided" value={cancelledOrders.totalCount} icon={XCircle} color="bg-red-500" href="/admin/orders/cancelled" />
            </div>

            {/* Main Orders Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="relative flex-grow max-w-xl">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Track by Order ID or Client Email..."
                            className="w-full pl-12 pr-6 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <Filter size={14} className="text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-transparent text-[11px] font-black uppercase tracking-widest text-gray-600 focus:outline-none cursor-pointer"
                            >
                                <option value="All">All Transactions</option>
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction ID</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Identity</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">State</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Market Value</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence>
                                {filteredOrders.map((order) => (
                                    <motion.tr 
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <Link href={`/admin/orders/${order.id}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-900 flex items-center gap-2">
                                                #{order.id}
                                                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{order.customerEmail}</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Verified Acquisition</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm text-gray-500 font-medium">
                                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-gray-900">AED {order.totalAmount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link href={`/admin/orders/${order.id}`}>
                                                <button className="p-2.5 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 text-gray-400 hover:text-indigo-600 transition-all">
                                                    <Eye size={18} />
                                                </button>
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls - Redesigned */}
                <div className="px-8 py-6 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/20">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        Displaying <span className="text-gray-900">{filteredOrders.length}</span> of <span className="text-gray-900">{allOrders.totalCount}</span> Transactions
                    </p>
                    
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20">
                                {currentPage}
                            </span>
                            <span className="text-gray-300 text-xs font-bold">of</span>
                            <span className="px-4 py-2 bg-white text-gray-600 rounded-xl text-xs font-black border border-gray-100">
                                {Math.ceil(allOrders.totalCount / ordersPerPage)}
                            </span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allOrders.totalCount / ordersPerPage), prev + 1))}
                            disabled={currentPage === Math.ceil(allOrders.totalCount / ordersPerPage) || isLoading}
                            className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
            
            {filteredOrders.length === 0 && (
                <div className="min-h-[300px] bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                    <Package size={40} className="text-gray-200" />
                    <p className="text-lg font-medium text-gray-400 italic">No transaction records match your parameters.</p>
                </div>
            )}
        </div>
    );
};

export default ManageOrders;