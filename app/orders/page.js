'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, ChevronRight, ShoppingBag, ArrowLeft, 
  Search, Calendar, CreditCard, Truck, Clock, 
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const StatusBadge = ({ status }) => {
    const configs = {
        'delivered': { color: 'text-green-600', icon: CheckCircle2, text: 'Delivered' },
        'processing': { color: 'text-blue-600', icon: Clock, text: 'Processing' },
        'shipped': { color: 'text-amber-600', icon: Truck, text: 'In Transit' },
        'cancelled': { color: 'text-red-500', icon: XCircle, text: 'Cancelled' },
        'pending': { color: 'text-gray-500', icon: AlertCircle, text: 'Pending' }
    };

    const config = configs[status.toLowerCase()] || configs.pending;
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-1.5">
            <Icon size={14} className={config.color} />
            <span className={`text-[13px] font-semibold ${config.color}`}>
                {config.text}
            </span>
        </div>
    );
};

const OrderCard = ({ order, onClick }) => {
    const mainItem = order.items?.[0];
    const otherItemsCount = (order.items?.length || 0) - 1;

    return (
        <motion.div 
            whileHover={{ scale: 1.005 }}
            onClick={onClick}
            className="w-full bg-white border border-gray-100 rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-brand-pink/20"
        >
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                {/* Product Preview */}
                <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-50 shadow-inner">
                    {mainItem?.imageUrl ? (
                        <img 
                            src={mainItem.imageUrl} 
                            alt={mainItem.name} 
                            className="w-full h-full object-contain mix-blend-multiply p-2"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <Package size={32} />
                        </div>
                    )}
                    {otherItemsCount > 0 && (
                        <div className="absolute bottom-1.5 right-1.5 bg-white/90 backdrop-blur shadow-sm rounded-lg px-2 py-0.5 text-[10px] font-black text-brand-pink border border-brand-pink/10">
                            +{otherItemsCount}
                        </div>
                    )}
                </div>

                {/* Info Container */}
                <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <StatusBadge status={order.status || 'pending'} />
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">
                                {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <h3 className="text-[20px] md:text-[22px] font-bold text-gray-900 tracking-tight pt-1">
                            {mainItem?.name || 'Your Naya Order'}
                            {otherItemsCount > 0 && <span className="text-gray-300 font-medium italic"> and more</span>}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">
                            Vault ID: {order.id.toString().slice(-8).toUpperCase()}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-50">
                        <div className="flex items-center gap-4">
                            <button className="text-[12px] font-black uppercase tracking-widest text-brand-pink hover:text-gray-900 transition-colors">
                                Details
                            </button>
                            <div className="w-[1px] h-3 bg-gray-100" />
                            <button className="text-[12px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-pink transition-colors">
                                Support
                            </button>
                        </div>
                        <p className="text-[16px] font-black text-gray-900 tracking-tight">
                            {parseFloat(order.totalAmount).toFixed(2)} <span className="text-[10px] uppercase ml-0.5 text-gray-400">AED</span>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const OrdersPageContent = () => {
    const { user } = useAuth();
    const { fetchWithAuth } = useAppContext();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!user) {
            router.push('/auth');
            return;
        }

        const loadOrders = async () => {
            setIsLoading(true);
            try {
                const res = await fetchWithAuth(`/api/orders?userId=${user.id}`);
                const data = await res.json();
                setOrders(data.orders || []);
            } catch (err) {
                console.error('Error loading orders:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadOrders();
    }, [user, fetchWithAuth, router]);

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status?.toLowerCase() === filter.toLowerCase();
    });

    if (isLoading) return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Archiving Acquisitions</p>
            </div>
        </div>
    );

    return (
        <div className="bg-[#FAF9F6] min-h-screen font-sans text-gray-900 pb-32 relative overflow-hidden">
            {/* Subtle Boutique Aura */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-brand-pink/[0.02] to-transparent"></div>
            </div>

            {/* Tactile Paper Grain */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

            <div className="max-w-[840px] mx-auto px-6 relative z-10">
                {/* Header */}
                <header className="pt-20 pb-12">
                    <div className="flex flex-col gap-1 mb-8">
                        <Link 
                            href="/account"
                            className="group flex items-center gap-1.5 text-[14px] font-medium text-brand-pink hover:underline mb-2 w-fit"
                        >
                            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                            Account
                        </Link>
                        <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight text-[#1d1d1f] leading-tight">
                            Your Orders.
                        </h1>
                    </div>

                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2 border-b border-gray-200">
                        {['All', 'Pending', 'Delivered', 'Cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f.toLowerCase())}
                                className={`pb-3 text-[14px] font-medium transition-all relative whitespace-nowrap ${
                                    filter === f.toLowerCase() 
                                    ? 'text-gray-900' 
                                    : 'text-gray-400 hover:text-gray-900'
                                }`}
                            >
                                {f}
                                {filter === f.toLowerCase() && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-brand-pink"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Orders List */}
                <div className="space-y-6">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <OrderCard 
                                    order={order} 
                                    onClick={() => router.push(`/orders/${order.id}`)} 
                                />
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-24 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-gray-200 mb-6">
                                <Search size={24} />
                            </div>
                            <h2 className="text-[21px] font-semibold mb-2">You have no orders.</h2>
                            <p className="text-gray-400 text-[14px] mb-8 font-medium">When you buy something, it will appear here.</p>
                            <button 
                                onClick={() => router.push('/all-products')}
                                className="px-12 py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-pink transition-all active:scale-95 shadow-lg"
                            >
                                Start Shopping
                            </button>
                        </div>
                    )}
                </div>

                {/* Support Section */}
                <div className="mt-24 pt-12 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-3">
                        <h4 className="text-[17px] font-semibold">Shipping & Delivery</h4>
                        <p className="text-[14px] text-gray-500 leading-relaxed font-medium">
                            Orders are processed within 24 hours. Enjoy free shipping on orders over 500 AED.
                        </p>
                        <Link href="#" className="text-[14px] font-medium text-brand-pink hover:underline block pt-1">Learn about shipping</Link>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[17px] font-semibold">Returns & Refunds</h4>
                        <p className="text-[14px] text-gray-500 leading-relaxed font-medium">
                            If you're not completely satisfied, you can return your products within 14 days.
                        </p>
                        <Link href="#" className="text-[14px] font-medium text-brand-pink hover:underline block pt-1">View return policy</Link>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[17px] font-semibold">Need Help?</h4>
                        <p className="text-[14px] text-gray-500 leading-relaxed font-medium">
                            Our beauty consultants are available to assist with your order 24/7.
                        </p>
                        <Link href="#" className="text-[14px] font-medium text-brand-pink hover:underline block pt-1">Contact Support</Link>
                    </div>
                </div>

                {/* Footnote */}
                <div className="mt-24 flex flex-col items-center gap-4 text-center opacity-30">
                    <div className="w-8 h-[1px] bg-gray-900" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Naya Lumière</p>
                </div>
            </div>
        </div>
    );
};



export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-brand-pink font-black uppercase tracking-[0.5em]">Synchronizing Chronicles...</div>}>
            <OrdersPageContent />
        </Suspense>
    );
}
