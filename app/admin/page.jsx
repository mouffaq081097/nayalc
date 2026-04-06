'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
    DollarSign, 
    ShoppingCart, 
    Package, 
    Tag, 
    TrendingUp, 
    Users, 
    ArrowUpRight, 
    ArrowDownRight, 
    Clock, 
    ChevronRight, 
    Bell, 
    Search, 
    MoreVertical, 
    ExternalLink,
    Box,
    Truck,
    CheckCircle2,
    AlertTriangle,
    PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const OrderStatus = {
    Delivered: 'Delivered',
    Shipped: 'Shipped',
    Processing: 'Processing',
    Pending: 'Pending',
    Cancelled: 'Cancelled',
};

const MetricCard = ({ title, value, trend, icon: Icon, color, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 transition-transform duration-500 group-hover:scale-110`}>
                <Icon size={22} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{title}</p>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const { products, categories, allOrders, fetchAllOrders } = useAppContext();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user && user.email === 'mouffaq@nayalc.com') {
            fetchAllOrders(1, 100);
        }
    }, [fetchAllOrders, user]);
    
    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        const recentOrders = allOrders.orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo && o.status !== OrderStatus.Cancelled);
        const revenue = recentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const pending = allOrders.orders.filter(o => o.status === OrderStatus.Pending).length;
        const customers = new Set(allOrders.orders.map(o => o.customerEmail)).size;
        
        return { revenue, pending, customers };
    }, [allOrders.orders]);

    if (loading || !user || user.email !== 'mouffaq@nayalc.com') {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest font-black">Verifying Sovereignty...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Top Navigation / Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Console Central</h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Naya Lumière Operations & Intelligence</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/admin/products')} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-gray-900 transition-all active:scale-95">
                        <PlusCircle size={16} /> New Product
                    </button>
                    <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 shadow-sm transition-all">
                        <Bell size={20} />
                    </button>
                </div>
            </div>

            {/* Analytical Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Revenue (30d)" 
                    value={`AED ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                    trend={12.5} 
                    icon={DollarSign} 
                    color="bg-green-500" 
                    delay={0.1}
                />
                <MetricCard 
                    title="Active Orders" 
                    value={stats.pending} 
                    trend={-2.4} 
                    icon={ShoppingCart} 
                    color="bg-orange-500" 
                    delay={0.2}
                />
                <MetricCard 
                    title="Total Selection" 
                    value={products.length} 
                    icon={Box} 
                    color="bg-indigo-500" 
                    delay={0.3}
                />
                <MetricCard 
                    title="Loyal Clients" 
                    value={stats.customers} 
                    trend={8.1} 
                    icon={Users} 
                    color="bg-pink-500" 
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Orders Feed */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent Acquisitions</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Filter orders..." 
                                    className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-xs focus:bg-white focus:border-indigo-100 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Identification</th>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">State</th>
                                        <th className="px-8 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {allOrders.orders.slice(0, 8).map((order) => (
                                        <tr key={order.id} className="group hover:bg-gray-50/30 transition-colors cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-gray-900 tracking-tight">#{order.id}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{order.customerEmail}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Verified Acquisition</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Clock size={12} className="text-gray-300" />
                                                    <span className="text-xs font-medium">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm ${
                                                    order.status === OrderStatus.Delivered ? 'bg-green-50 text-green-700 border-green-100' :
                                                    order.status === OrderStatus.Shipped ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    order.status === OrderStatus.Processing ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                    order.status === OrderStatus.Pending ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-gray-900">AED {Number(order.totalAmount).toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-gray-50 bg-gray-50/20">
                            <button onClick={() => router.push('/admin/orders')} className="w-full py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all flex items-center justify-center gap-2">
                                Audit All Acquisitions <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Intelligence & Logistics */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Inventory Alerts */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Inventory Status</h3>
                            <AlertTriangle size={18} className="text-orange-500" />
                        </div>
                        <div className="space-y-6">
                            {products.filter(p => p.stock_quantity <= 5).slice(0, 4).map(product => (
                                <div key={product.id} className="flex items-center gap-4 group">
                                    <div className="relative w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 p-2 overflow-hidden">
                                        <img src={product.imageUrl} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{product.name}</p>
                                        <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter">Critical: {product.stock_quantity} Units Left</p>
                                    </div>
                                    <button onClick={() => router.push(`/admin/products`)} className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                                        <ArrowUpRight size={16} />
                                    </button>
                                </div>
                            ))}
                            {products.filter(p => p.stock_quantity <= 5).length === 0 && (
                                <div className="py-6 text-center">
                                    <CheckCircle2 className="mx-auto text-green-500 mb-3" size={32} strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Satiated</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => router.push('/admin/brands')} className="p-6 bg-indigo-50 text-indigo-600 rounded-[2rem] border border-indigo-100 flex flex-col items-center gap-3 hover:bg-indigo-600 hover:text-white transition-all group">
                            <Tag size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Maisons</span>
                        </button>
                        <button onClick={() => router.push('/admin/categories')} className="p-6 bg-pink-50 text-pink-600 rounded-[2rem] border border-pink-100 flex flex-col items-center gap-3 hover:bg-pink-600 hover:text-white transition-all group">
                            <Package size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Universes</span>
                        </button>
                        <button onClick={() => router.push('/admin/users')} className="p-6 bg-blue-50 text-blue-600 rounded-[2rem] border border-blue-100 flex flex-col items-center gap-3 hover:bg-blue-600 hover:text-white transition-all group">
                            <Users size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Citizens</span>
                        </button>
                        <button onClick={() => router.push('/admin/chat')} className="p-6 bg-orange-50 text-orange-600 rounded-[2rem] border border-orange-100 flex flex-col items-center gap-3 hover:bg-orange-600 hover:text-white transition-all group relative">
                            < Bell size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
