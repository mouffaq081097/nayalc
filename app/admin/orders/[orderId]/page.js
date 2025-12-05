'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, ArrowLeft, Package, Truck, XCircle, CheckCircle } from 'lucide-react';
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


const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newStatus, setNewStatus] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingCompany, setShippingCompany] = useState('');
    const [shippingLink, setShippingLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateError, setUpdateError] = useState(null);


    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }
            const data = await response.json();
            setOrder(data);
            setNewStatus(data.status); // Initialize newStatus with current status
            setTrackingNumber(data.trackingNumber || '');
            setShippingCompany(data.shippingCompany || '');
            setShippingLink(data.shippingLink || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const router = useRouter();
    // ... other states ...

    const handleUpdateStatus = async () => {
        setIsSubmitting(true);
        setUpdateError(null);
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                // Re-fetch order details to get the latest state after update
                await fetchOrderDetails();
                setUpdateError(null); // Clear any previous update errors
            }
        } catch (err) {
            setUpdateError(err.message);
            console.error('Error updating order status:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-32 w-32 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
    }
    
    if (!order) {
        return <div className="text-center mt-10 text-gray-500">Order not found.</div>;
    }

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'pending';
            case 'processing': return 'processing';
            case 'shipped': return 'shipped';
            case 'delivered': return 'delivered';
            case 'cancelled': return 'cancelled';
            default: return 'default';
        }
    };

    const isTrackingInfoVisible = ['Shipped', 'Delivered'].includes(newStatus);
    const isCancellationReasonVisible = newStatus === 'Cancelled';


    return (
        <div className="bg-gray-50 min-h-screen px-8 py-8">
            <div className="mb-8">
                <Link href="/admin/orders">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                         <Badge variant={getStatusVariant(order.status)} className="text-lg px-4 py-2">{order.status}</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Order Items */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
                                                            <div className="space-y-4">
                                                            {order.items.map(item => (
                                                                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                                                    <div className="flex-shrink-0">
                                                                        <img 
                                                                            src={item.product?.imageUrl || 'https://via.placeholder.com/150'} 
                                                                            alt={item.product?.name || 'Product Image'} 
                                                                            className="h-16 w-16 rounded-md object-contain"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-grow">
                                                                        <p className="font-semibold text-gray-800">{item.product?.name || 'Product not available'}</p>
                                                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-semibold text-gray-800">AED {parseFloat(item.price).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>                        </div>
                        
                        {/* Status Update Form */}
                        <div className="bg-white p-8 mt-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Order Status</h2>
                            {updateError && <div className="text-red-500 text-sm mb-4">{updateError}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="status">Order Status</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Processing">Processing</SelectItem>
                                            <SelectItem value="Shipped">Shipped</SelectItem>
                                            <SelectItem value="Delivered">Delivered</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isCancellationReasonVisible && (
                                    <div>
                                        <Label htmlFor="cancellationReason">Reason for Cancellation</Label>
                                        <Textarea
                                            id="cancellationReason"
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            placeholder="Enter reason for cancellation"
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                )}
                                {isTrackingInfoVisible && (
                                    <>
                                        <div>
                                            <Label htmlFor="trackingNumber">Tracking Number</Label>
                                            <Input
                                                id="trackingNumber"
                                                value={trackingNumber}
                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                placeholder="Enter tracking number"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="shippingCompany">Shipping Company</Label>
                                            <Input
                                                id="shippingCompany"
                                                value={shippingCompany}
                                                onChange={(e) => setShippingCompany(e.target.value)}
                                                placeholder="e.g., FedEx, DHL"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="shippingLink">Shipping Link</Label>
                                            <Input
                                                id="shippingLink"
                                                value={shippingLink}
                                                onChange={(e) => setShippingLink(e.target.value)}
                                                placeholder="e.g., https://www.fedex.com/track/..."
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <Button onClick={handleUpdateStatus} disabled={isSubmitting} className="mt-4">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Status'
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Customer Details */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Details</h2>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                                <p><span className="font-semibold">Name:</span> {order.customerName}</p>
                                <p><span className="font-semibold">Email:</span> {order.customerEmail}</p>
                                <p><span className="font-semibold">Phone:</span> {order.customerPhone}</p>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Address</h2>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
                                <p>{order.shippingAddress}</p>
                                <p>{order.city}, {order.zipCode}</p>
                            </div>
                        </div>

                        {/* Cancellation Reason */}
                        {order.status === 'Cancelled' && order.cancellationReason && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Cancellation Reason</h2>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
                                    <p>{order.cancellationReason}</p>
                                </div>
                            </div>
                        )}

                        {/* Tracking Information */}
                        {order.trackingNumber && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tracking Information</h2>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
                                    <p><span className="font-semibold">Tracking No:</span> {order.trackingNumber}</p>
                                    <p><span className="font-semibold">Company:</span> {order.shippingCompany}</p>
                                    <p><span className="font-semibold">Link:</span> <a href={order.shippingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{order.shippingLink}</a></p>
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>AED {order.items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span>- AED {order.discountAmount ? order.discountAmount.toFixed(2) : '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>AED {order.shippingCost ? order.shippingCost.toFixed(2) : '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>AED {order.taxAmount ? order.taxAmount.toFixed(2) : '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Gift Wrap</span>
                                    <span>AED {order.giftWrapCost ? order.giftWrapCost.toFixed(2) : '0.00'}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t mt-2">
                                    <span>Total</span>
                                    <span>AED {order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
