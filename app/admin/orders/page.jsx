'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import {
    Package, CheckCircle, Clock, XCircle, List,
    Search, Filter, ArrowUpRight, ChevronLeft, ChevronRight, Eye,
    RotateCcw, User, MapPin, AlertCircle, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from '@/app/components/PageLoader';

// ─── Recover Order from Cart ─────────────────────────────────────────────────
const RecoverFromCart = () => {
    const [email, setEmail] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupError, setLookupError] = useState('');
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('tabby');
    const [tabbyPaymentId, setTabbyPaymentId] = useState('');
    const [placing, setPlacing] = useState(false);
    const [success, setSuccess] = useState(null);
    const [placeError, setPlaceError] = useState('');

    const lookup = async () => {
        if (!email.trim()) return;
        setLookupLoading(true); setLookupResult(null); setLookupError(''); setSuccess(null); setPlaceError('');
        try {
            const res = await fetch(`/api/admin/recover-order?email=${encodeURIComponent(email.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lookup failed');
            setLookupResult(data);
            if (data.addresses?.length) setSelectedAddressId(String(data.addresses[0].id));
        } catch (e) { setLookupError(e.message); }
        finally { setLookupLoading(false); }
    };

    const recover = async () => {
        if (!lookupResult || !selectedAddressId) return;
        setPlacing(true); setPlaceError('');
        try {
            const body = {
                payment_method: paymentMethod,
                user_id: lookupResult.user.id,
                user_address_id: parseInt(selectedAddressId, 10),
                items: lookupResult.cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: parseFloat(i.price) })),
                ...(paymentMethod === 'tabby' && tabbyPaymentId ? { tabby_payment_id: tabbyPaymentId } : {}),
            };
            const res = await fetch('/api/admin/recover-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Recovery failed');
            setSuccess({ orderId: data.orderId });
        } catch (e) { setPlaceError(e.message); }
        finally { setPlacing(false); }
    };

    const total = lookupResult ? lookupResult.cart.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0) : 0;

    return (
        <div className="max-w-xl space-y-4">
            {/* Email lookup */}
            <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                <div className="flex items-center gap-2">
                    <User size={15} className="text-purple-400" />
                    <h3 className="text-[14px] font-semibold text-purple-700">Look up customer cart</h3>
                </div>
                <p className="text-[12px] text-gray-400">Enter the customer's email to load their saved cart, then create the missing order.</p>
                <div className="flex gap-2">
                    <input
                        value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
                        placeholder="customer@email.com"
                        className="flex-1 px-3 py-2.5 text-[13px] rounded-xl border focus:outline-none focus:border-purple-300"
                        style={{ borderColor: 'rgba(216,180,254,0.4)' }}
                    />
                    <button onClick={lookup} disabled={lookupLoading || !email.trim()}
                        className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}>
                        {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                    </button>
                </div>
                {lookupError && <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-xl"><AlertCircle size={13} />{lookupError}</div>}
            </div>

            {lookupResult && (
                <>
                    {/* Cart items */}
                    <div className="bg-white rounded-2xl border p-6 space-y-3" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                        <div className="flex items-center gap-2">
                            <Package size={15} className="text-purple-400" />
                            <h3 className="text-[14px] font-semibold text-purple-700">{lookupResult.user.firstName}'s cart ({lookupResult.cart.length} items)</h3>
                        </div>
                        {lookupResult.cart.length === 0
                            ? <p className="text-[13px] text-gray-400">Cart is empty — nothing to recover.</p>
                            : <>
                                {lookupResult.cart.map(item => (
                                    <div key={item.productId} className="flex justify-between py-2 border-b border-purple-50 last:border-0">
                                        <div>
                                            <p className="text-[13px] font-medium text-gray-800">{item.name}</p>
                                            <p className="text-[11px] text-gray-400">Qty {item.quantity} · AED {parseFloat(item.price).toFixed(2)} each</p>
                                        </div>
                                        <p className="text-[13px] font-semibold text-gray-700">AED {(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                                <div className="flex justify-between text-[14px] font-bold text-purple-700 pt-1">
                                    <span>Estimated total</span><span>AED {total.toFixed(2)}</span>
                                </div>
                            </>
                        }
                    </div>

                    {lookupResult.cart.length > 0 && (
                        <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                            <div className="flex items-center gap-2"><MapPin size={15} className="text-purple-400" /><h3 className="text-[14px] font-semibold text-purple-700">Order details</h3></div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-purple-400 uppercase tracking-wide">Shipping address</label>
                                {lookupResult.addresses.length === 0
                                    ? <p className="text-[13px] text-red-400">No addresses saved for this customer.</p>
                                    : <select value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)}
                                        className="w-full px-3 py-2.5 text-[13px] rounded-xl border focus:outline-none bg-white"
                                        style={{ borderColor: 'rgba(216,180,254,0.4)' }}>
                                        {lookupResult.addresses.map(a => (
                                            <option key={a.id} value={a.id}>{a.address_label || a.shipping_address} — {a.city}{a.is_default ? ' (default)' : ''}</option>
                                        ))}
                                    </select>
                                }
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-purple-400 uppercase tracking-wide">Payment method</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2.5 text-[13px] rounded-xl border focus:outline-none bg-white"
                                    style={{ borderColor: 'rgba(216,180,254,0.4)' }}>
                                    <option value="tabby">Tabby (Pay in 4)</option>
                                    <option value="cashOnDelivery">Cash on delivery</option>
                                    <option value="card">Card</option>
                                </select>
                            </div>

                            {paymentMethod === 'tabby' && (
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-purple-400 uppercase tracking-wide">Tabby payment ID <span className="normal-case text-gray-400">(from Tabby dashboard)</span></label>
                                    <input value={tabbyPaymentId} onChange={e => setTabbyPaymentId(e.target.value)}
                                        placeholder="e.g. pay_xxxxxxxx"
                                        className="w-full px-3 py-2.5 text-[13px] rounded-xl border focus:outline-none font-mono"
                                        style={{ borderColor: 'rgba(216,180,254,0.4)' }} />
                                </div>
                            )}

                            {placeError && <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-xl"><AlertCircle size={13} />{placeError}</div>}

                            {success ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                                    <div>
                                        <p className="text-[13px] font-semibold text-green-700">Order recovered successfully</p>
                                        <Link href={`/admin/orders/${success.orderId}`} className="text-[12px] text-green-600 underline">View order #{success.orderId} →</Link>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={recover} disabled={placing || !selectedAddressId || lookupResult.addresses.length === 0}
                                    className="w-full py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}>
                                    {placing ? <><Loader2 size={14} className="animate-spin" />Creating order…</> : <><RotateCcw size={14} />Recover order from cart</>}
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

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
    const [tab,          setTab]          = useState('orders');
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

    if (isLoading) return <PageLoader />;

    return (
        <div className="space-y-6 pb-8">

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-xl bg-purple-50 w-fit">
                {[{ id: 'orders', label: 'All orders' }, { id: 'recover', label: 'Recover from cart' }].map(({ id, label }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${tab === id ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}>
                        {id === 'recover' && <RotateCcw size={13} />}{label}
                    </button>
                ))}
            </div>

            {tab === 'recover' && <RecoverFromCart />}
            {tab === 'orders' && <>

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
                            <tr style={{ background: 'rgba(255,255,255,0.6)' }}>
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
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(216,180,254,0.2)', background: 'rgba(255,255,255,0.3)' }}>
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
            </>}
        </div>
    );
};

export default ManageOrders;
