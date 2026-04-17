'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Loader2, ArrowLeft, Package, Truck, XCircle, CheckCircle, User, MapPin, CreditCard, Receipt, Info, ShieldCheck } from 'lucide-react';
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

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stripePaymentDetails, setStripePaymentDetails] = useState(null);

    const [newStatus, setNewStatus] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [courierWebsite, setCourierWebsite] = useState('');
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
            setTrackingNumber(data.tracking_number || data.trackingNumber || '');
            setCourierName(data.courier_name || data.courierName || '');
            setCourierWebsite(data.courier_website || data.courierWebsite || '');
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
                    console.error('Error fetching Stripe payment details:', err);
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
                    courierName: ['Shipped', 'Delivered'].includes(newStatus) ? courierName : null,
                    courierWebsite: ['Shipped', 'Delivered'].includes(newStatus) ? courierWebsite : null,
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
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-purple-400">Loading order...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-red-500">
                <XCircle size={40} className="opacity-40" />
                <p className="font-semibold text-sm">Could not load order: {error || 'Not found'}</p>
                <Link href="/admin/orders">
                    <Button variant="outline" className="mt-2 rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50">Back to orders</Button>
                </Link>
            </div>
        );
    }

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':    return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'processing': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'shipped':    return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'delivered':  return 'bg-green-50 text-green-700 border-green-200';
            case 'cancelled':  return 'bg-red-50 text-red-700 border-red-200';
            default:           return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const isTrackingInfoVisible = ['Shipped', 'Delivered'].includes(newStatus);
    const isCancellationReasonVisible = newStatus === 'Cancelled';

    // Shared card styles
    const cardClass = 'bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden';
    const sideCardClass = 'bg-white rounded-2xl border border-purple-100 p-6 shadow-sm';
    const sectionHeaderClass = 'px-6 py-4 border-b border-purple-50 bg-purple-50/40 flex items-center justify-between';
    const sectionTitleClass = 'text-sm font-semibold text-purple-700';
    const labelClass = 'text-xs font-medium text-purple-400';
    const sideHeadingClass = 'text-sm font-semibold text-purple-700 mb-4 pb-3 border-b border-purple-50 flex justify-between items-center';

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders">
                        <button className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-purple-400 hover:text-purple-700 hover:border-purple-300 hover:shadow-sm transition-all">
                            <ArrowLeft size={18} />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <h1 className="text-2xl font-bold text-purple-900">Order #{order.id}</h1>
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusStyles(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-xs text-purple-300 font-medium">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-xl px-4 py-2 text-sm font-medium text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300">
                        Export invoice
                    </Button>
                    <Button className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}>
                        Message client
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main column */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Order items */}
                    <section className={cardClass}>
                        <div className={sectionHeaderClass}>
                            <h2 className={sectionTitleClass}>Order items</h2>
                            <Package size={14} className="text-purple-300" />
                        </div>
                        <div className="p-6 space-y-3">
                            {order.items.map(item => (
                                <div key={item.id} className="group flex items-center gap-5 p-4 rounded-xl border border-purple-50 hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-300">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-purple-50 border border-purple-100 p-1.5 flex-shrink-0">
                                        <img
                                            src={item.product?.imageUrl || 'https://via.placeholder.com/150'}
                                            alt={item.product?.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-xs font-semibold text-purple-500 mb-0.5">{item.product?.brandName || 'Naya Lumière'}</p>
                                        <h4 className="text-sm font-semibold text-gray-800 leading-snug truncate">{item.product?.name || 'Product'}</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">Qty: <span className="text-gray-700 font-medium">{item.quantity}</span></p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-base font-bold text-purple-900">AED {(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">AED {parseFloat(item.price).toFixed(2)} / unit</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Update status */}
                    <section className={cardClass}>
                        <div className={sectionHeaderClass}>
                            <h2 className={sectionTitleClass}>Update status</h2>
                            <Truck size={14} className="text-purple-300" />
                        </div>
                        <div className="p-6 space-y-5">
                            {updateError && (
                                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-red-600 text-sm">
                                    <Info size={15} />
                                    {updateError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="status" className={labelClass}>Order status</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger id="status" className="w-full h-11 rounded-xl bg-purple-50/50 border-purple-100 focus:ring-2 focus:ring-purple-200 font-medium text-gray-700">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-purple-100">
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Processing">Processing</SelectItem>
                                            <SelectItem value="Shipped">Shipped</SelectItem>
                                            <SelectItem value="Delivered">Delivered</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isCancellationReasonVisible && (
                                    <div className="space-y-2">
                                        <Label htmlFor="cancellationReason" className={labelClass}>Cancellation reason</Label>
                                        <Textarea
                                            id="cancellationReason"
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            placeholder="Reason for cancellation..."
                                            className="w-full bg-purple-50/50 border border-purple-100 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {isTrackingInfoVisible && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-purple-50/40 rounded-xl border border-purple-100">
                                    <div className="space-y-2">
                                        <Label htmlFor="trackingNumber" className={labelClass}>Tracking number</Label>
                                        <Input
                                            id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="e.g. 1Z999AA10123456784" className="h-10 rounded-xl bg-white border-purple-100 font-medium text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="courierName" className={labelClass}>Courier</Label>
                                        <Input
                                            id="courierName" value={courierName} onChange={(e) => setCourierName(e.target.value)}
                                            placeholder="FedEx, DHL, Aramex..." className="h-10 rounded-xl bg-white border-purple-100 font-medium text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                                        <Label htmlFor="courierWebsite" className={labelClass}>Tracking link</Label>
                                        <Input
                                            id="courierWebsite" value={courierWebsite} onChange={(e) => setCourierWebsite(e.target.value)}
                                            placeholder="https://track.fedex.com/..." className="h-10 rounded-xl bg-white border-purple-100 font-medium text-gray-700"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleUpdateStatus}
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg shadow-purple-200 active:scale-95 transition-all"
                                    style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save status'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Customer info */}
                    <section className={sideCardClass}>
                        <h3 className={sideHeadingClass}>
                            Customer info
                            <User size={14} className="text-purple-300" />
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 flex-shrink-0">
                                    <User size={22} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 leading-tight">{order.customerName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <p className="text-xs text-gray-400">Verified customer</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 pt-3 border-t border-purple-50">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={labelClass}>Email</span>
                                    <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{order.customerEmail}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className={labelClass}>Phone</span>
                                    <span className="text-xs font-medium text-gray-700">{order.customerPhone || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Shipping address */}
                    <section className={sideCardClass}>
                        <h3 className={sideHeadingClass}>
                            Shipping address
                            <MapPin size={14} className="text-purple-300" />
                        </h3>
                        <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                            <div className="text-sm text-gray-700 space-y-0.5">
                                <p className="font-semibold text-gray-800">{order.shippingAddress}</p>
                                <p className="text-gray-500">{order.city}{order.zipCode ? ` ${order.zipCode}` : ''}</p>
                                <p className="text-xs text-purple-400 pt-1">United Arab Emirates</p>
                            </div>
                        </div>
                    </section>

                    {/* Order summary */}
                    <section className={sideCardClass}>
                        <h3 className={sideHeadingClass}>
                            Order summary
                            <Receipt size={14} className="text-purple-300" />
                        </h3>
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-700 font-medium">AED {order.items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
                            </div>
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="text-green-600 font-medium">- AED {order.discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Shipping</span>
                                <span className="text-gray-700 font-medium">AED {order.shippingCost ? order.shippingCost.toFixed(2) : '0.00'}</span>
                            </div>
                            {order.giftWrapCost > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Gift wrap</span>
                                    <span className="text-gray-700 font-medium">AED {order.giftWrapCost.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-purple-100 flex justify-between items-center">
                                <span className="text-sm font-semibold text-purple-800">Total</span>
                                <span className="text-xl font-bold text-purple-900">AED {order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Payment details */}
                    {stripePaymentDetails && (
                        <section className={sideCardClass}>
                            <h3 className={sideHeadingClass}>
                                Payment details
                                <ShieldCheck size={14} className="text-purple-300" />
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className={`${labelClass} mb-1`}>Stripe payment ID</p>
                                    <p className="text-xs font-mono text-gray-500 bg-purple-50 p-2 rounded-lg border border-purple-100 truncate">{stripePaymentDetails.id}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={labelClass}>Status</p>
                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                                        stripePaymentDetails.status === 'succeeded' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                    }`}>
                                        {stripePaymentDetails.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={labelClass}>Amount captured</p>
                                    <span className="text-sm font-semibold text-gray-800">AED {(stripePaymentDetails.amount_captured / 100).toFixed(2)}</span>
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
