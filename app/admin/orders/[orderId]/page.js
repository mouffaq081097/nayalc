'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, ArrowLeft, Package, Truck, XCircle, CheckCircle, User, MapPin, CreditCard, Receipt, Calendar, Info, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useAppContext } from '@/app/context/AppContext';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stripePaymentDetails, setStripePaymentDetails] = useState(null);

    const [newStatus, setNewStatus] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingCompany, setShippingCompany] = useState('');
    const [shippingLink, setShippingLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    const { logout } = useAuth();
    const { fetchWithAuth } = useAppContext();
    const router = useRouter();

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/orders/${orderId}`);
            if (!response.ok) throw new Error('Failed to fetch order details');
            const data = await response.json();
            setOrder(data);
            setNewStatus(data.status);
            setTrackingNumber(data.trackingNumber || '');
            setShippingCompany(data.shippingCompany || '');
            setShippingLink(data.shippingLink || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [orderId, fetchWithAuth]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    useEffect(() => {
        const fetchStripeDetails = async () => {
            if (order && order.stripePaymentIntentId) {
                try {
                    const response = await fetchWithAuth(`/api/admin/stripe/payment_intent/${order.stripePaymentIntentId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setStripePaymentDetails(data);
                    }
                } catch (err) {
                    console.error("Error fetching Stripe payment details:", err);
                }
            }
        };
        fetchStripeDetails();
    }, [order, fetchWithAuth]);

    const handleUpdateStatus = async () => {
        setIsSubmitting(true);
        setUpdateError(null);
        try {
            const response = await fetchWithAuth(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    cancellationReason: newStatus === 'Cancelled' ? cancellationReason : null,
                    trackingNumber: ['Shipped', 'Delivered'].includes(newStatus) ? trackingNumber : null,
                    shippingCompany: ['Shipped', 'Delivered'].includes(newStatus) ? shippingCompany : null,
                    shippingLink: ['Shipped', 'Delivered'].includes(newStatus) ? shippingLink : null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update order status');
            }
            
            const responseData = await response.json();
            if (responseData.moved) {
                router.push('/admin/orders');
            } else {
                await fetchOrderDetails();
            }
        } catch (err) {
            setUpdateError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Opening Transaction Dossier...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-red-500">
                <XCircle size={40} className="opacity-20" />
                <p className="font-bold uppercase tracking-widest text-sm">Dossier Retrieval Failure: {error || 'Record Not Found'}</p>
                <Link href="/admin/orders">
                    <Button variant="outline" className="mt-4 rounded-xl">Return to Registry</Button>
                </Link>
            </div>
        );
    }

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'processing': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const isTrackingInfoVisible = ['Shipped', 'Delivered'].includes(newStatus);
    const isCancellationReasonVisible = newStatus === 'Cancelled';

    return (
        <div className="space-y-8 pb-20">
            {/* Back Button & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/admin/orders">
                        <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Transaction #{order.id}</h1>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusStyles(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Recorded on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Export Invoice</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-6 text-[10px] font-black uppercase tracking-widest">Communicate with Client</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* Items Section */}
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Acquired Masterpieces</h2>
                            <Package size={14} className="text-gray-300" />
                        </div>
                        <div className="p-8 space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="group flex items-center gap-6 p-4 rounded-3xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all duration-500">
                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 p-2 group-hover:bg-white transition-colors shadow-sm">
                                        <img 
                                            src={item.product?.imageUrl || 'https://via.placeholder.com/150'} 
                                            alt={item.product?.name} 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">{item.product?.brandName || 'Naya Lumière'}</p>
                                        <h4 className="text-lg font-bold text-gray-900 leading-tight">{item.product?.name || 'Archived Selection'}</h4>
                                        <p className="text-sm text-gray-400 font-medium mt-1">Quantity: <span className="text-gray-900">{item.quantity}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-gray-900 tracking-tighter">AED {(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AED {parseFloat(item.price).toFixed(2)} / unit</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Logistics Control Form */}
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Logistics Protocol Update</h2>
                            <Truck size={14} className="text-gray-300" />
                        </div>
                        <div className="p-10 space-y-10">
                            {updateError && (
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 text-sm font-medium">
                                    <Info size={16} />
                                    {updateError}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="status" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acquisition State</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger id="status" className="w-full h-14 rounded-2xl bg-gray-50 border-gray-100 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold">
                                            <SelectValue placeholder="Transition to State" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
                                            <SelectItem value="Pending">Pending Review</SelectItem>
                                            <SelectItem value="Processing">Processing Selection</SelectItem>
                                            <SelectItem value="Shipped">Dispatched</SelectItem>
                                            <SelectItem value="Delivered">Successfully Consigned</SelectItem>
                                            <SelectItem value="Cancelled">Void Transaction</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isCancellationReasonVisible && (
                                    <div className="space-y-3">
                                        <Label htmlFor="cancellationReason" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Void Reason</Label>
                                        <Textarea
                                            id="cancellationReason"
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            placeholder="Provide technical justification for voiding..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {isTrackingInfoVisible && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                                    <div className="space-y-3">
                                        <Label htmlFor="trackingNumber" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consignment ID</Label>
                                        <Input
                                            id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Tracking No." className="h-12 rounded-xl bg-white border-gray-100 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="shippingCompany" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistic Partner</Label>
                                        <Input
                                            id="shippingCompany" value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)}
                                            placeholder="FedEx, DHL, Aramex" className="h-12 rounded-xl bg-white border-gray-100 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-3 md:col-span-2 lg:col-span-1">
                                        <Label htmlFor="shippingLink" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Portal Link</Label>
                                        <Input
                                            id="shippingLink" value={shippingLink} onChange={(e) => setShippingLink(e.target.value)}
                                            placeholder="https://track.ups.com/..." className="h-12 rounded-xl bg-white border-gray-100 font-bold"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button 
                                    onClick={handleUpdateStatus} 
                                    disabled={isSubmitting} 
                                    className="px-10 py-7 bg-indigo-600 hover:bg-gray-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                            Synchronizing Protocol...
                                        </>
                                    ) : (
                                        'Commit State Update'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Details Column */}
                <div className="lg:col-span-4 space-y-10">
                    
                    {/* Client Identity */}
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                            Client Identity
                            <User size={14} className="text-gray-300" />
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <User size={28} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-gray-900 leading-none">{order.customerName}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verified Resident</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Direct Portal</span>
                                    <span className="text-sm font-medium text-gray-900">{order.customerEmail}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Secure Line</span>
                                    <span className="text-sm font-medium text-gray-900">{order.customerPhone || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Logistics Hub */}
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                            Logistics Hub
                            <MapPin size={14} className="text-gray-300" />
                        </h3>
                        <div className="space-y-4">
                            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2 italic">Destination Protocol</p>
                                <div className="text-sm font-medium text-gray-600 space-y-1">
                                    <p className="text-gray-900 font-bold">{order.shippingAddress}</p>
                                    <p>{order.city} {order.zipCode}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 pt-2">United Arab Emirates</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Financial Summary */}
                    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                            Market Analysis
                            <Receipt size={14} className="text-gray-300" />
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                <span>Gross Valuation</span>
                                <span>AED {order.items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-red-400 italic">
                                <span>Privilege Reduction</span>
                                <span>- AED {order.discountAmount ? order.discountAmount.toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                <span>Logistics Fee</span>
                                <span>AED {order.shippingCost ? order.shippingCost.toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                <span>Gift Preparation</span>
                                <span>AED {order.giftWrapCost ? order.giftWrapCost.toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="pt-6 border-t border-gray-50 flex justify-between items-baseline">
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Final Ledger</span>
                                <span className="text-3xl font-black text-gray-900 tracking-tighter">AED {order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Payment Protocol */}
                    {stripePaymentDetails && (
                        <section className="bg-white rounded-[2.5rem] border border-indigo-100/50 p-8 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <CreditCard size={100} />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-8 border-b border-indigo-50 pb-4 flex justify-between items-center relative z-10">
                                Payment Security
                                <ShieldCheck size={14} />
                            </h3>
                            <div className="space-y-5 relative z-10">
                                <div>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Stripe Authorization</p>
                                    <p className="text-[11px] font-mono text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 truncate">{stripePaymentDetails.id}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Network Status</p>
                                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                                        stripePaymentDetails.status === 'succeeded' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                                    }`}>
                                        {stripePaymentDetails.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Captured Assets</p>
                                    <span className="text-sm font-black text-gray-900">AED {(stripePaymentDetails.amount_captured / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;