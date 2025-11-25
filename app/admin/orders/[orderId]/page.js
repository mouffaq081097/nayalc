'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Button } from '../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const router = useRouter();
    const { fetchOrderById, updateOrderStatus } = useAppContext();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trackingNumber, setTrackingNumber] = useState(''); // New state for tracking number
    const [courierName, setCourierName] = useState(''); // New state for courier name
    const [courierWebsite, setCourierWebsite] = useState(''); // New state for courier website

    // Define OrderStatus as a JavaScript object
    const OrderStatus = {
        Pending: 'Pending',
        Processing: 'Processing',
        Shipped: 'Shipped',
        Delivered: 'Delivered',
        Cancelled: 'Cancelled',
    };

    useEffect(() => {
        if (order) {
            setTrackingNumber(order.trackingNumber || ''); // Update tracking number state when order changes
            setCourierName(order.courierName || ''); // Update courier name state when order changes
            setCourierWebsite(order.courierWebsite || ''); // Update courier website state when order changes
        }
    }, [order]);

    useEffect(() => {
        if (orderId) {
            const getOrderDetails = async () => {
                try {
                    setLoading(true);
                    const orderData = await fetchOrderById(orderId);
                    setOrder(orderData);
                    setError(null);
                } catch (err) {
                    setError('Failed to fetch order details.');
                    setOrder(null);
                } finally {
                    setLoading(false);
                }
            };
            getOrderDetails();
        }
    }, [orderId, fetchOrderById]);

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        let finalTrackingNumber = trackingNumber;
        let finalCourierName = courierName;
        let finalCourierWebsite = courierWebsite;

        // If status is changed to Shipped, require tracking number, courier name, and courier website
        if (newStatus === OrderStatus.Shipped) {
            if (!finalTrackingNumber) {
                alert('Please enter a tracking number for shipped orders.');
                return;
            }
            if (!finalCourierName) {
                alert('Please enter a courier name for shipped orders.');
                return;
            }
            if (!finalCourierWebsite) {
                alert('Please enter a courier website for shipped orders.');
                return;
            }
        }
        
        // If status is changed from Shipped to something else, clear tracking number, courier name, and courier website
        if (order.status === OrderStatus.Shipped && newStatus !== OrderStatus.Shipped) {
            finalTrackingNumber = '';
            finalCourierName = '';
            finalCourierWebsite = '';
        }

        try {
            await updateOrderStatus(order.id, newStatus, finalTrackingNumber, finalCourierName, finalCourierWebsite);
            setOrder(prevOrder => ({ ...prevOrder, status: newStatus, trackingNumber: finalTrackingNumber, courierName: finalCourierName, courierWebsite: finalCourierWebsite }));
            // Optionally, show a toast notification for success
        } catch (error) {
            console.error('Error updating order status:', error);
            // Optionally, show a toast notification for error
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p className="text-lg">Loading order details...</p></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen"><p className="text-red-500 text-lg">{error}</p></div>;
    }

    if (!order) {
        return <div className="flex justify-center items-center h-screen"><p className="text-lg">No order found.</p></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-4">
                <Button variant="ghost" onClick={() => router.push('/admin/orders')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                </Button>
            </div>
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold">Order Details</CardTitle>
                    <div className="flex flex-col items-end space-y-2"> {/* Use flex-col and items-end for better alignment */}
                        <div className="flex items-center space-x-2">
                            <Badge variant={order.status === OrderStatus.Delivered ? 'success' : 'secondary'}>{order.status}</Badge>
                            <select
                                value={order.status}
                                onChange={handleStatusChange}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                disabled={order.status === OrderStatus.Cancelled || order.status === OrderStatus.Delivered}
                            >
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        {(order.status === OrderStatus.Shipped || (order.status !== OrderStatus.Cancelled && order.status !== OrderStatus.Delivered)) && ( // Show input if shipped or if status can still be changed to shipped
                            <>
                                <input
                                    type="text"
                                    placeholder="Tracking Number"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="mt-2 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    disabled={order.status === OrderStatus.Cancelled || order.status === OrderStatus.Delivered}
                                />
                                <input
                                    type="text"
                                    placeholder="Courier Name"
                                    value={courierName}
                                    onChange={(e) => setCourierName(e.target.value)}
                                    className="mt-2 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    disabled={order.status === OrderStatus.Cancelled || order.status === OrderStatus.Delivered}
                                />
                                <input
                                    type="url" // Use type="url" for website input
                                    placeholder="Courier Website URL (e.g., https://example.com)"
                                    value={courierWebsite}
                                    onChange={(e) => setCourierWebsite(e.target.value)}
                                    className="mt-2 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    disabled={order.status === OrderStatus.Cancelled || order.status === OrderStatus.Delivered}
                                />
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Customer & Order Info</h3>
                            <p><strong>Order ID:</strong> {order.id}</p>
                            <p><strong>Customer Name:</strong> {order.customerName}</p>
                            <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Shipping Address</h3>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <h3 className="font-semibold text-lg mb-4">Products Ordered</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <img src={item.imageUrl} alt={item.name} className="mr-4 w-12 h-12 object-contain rounded-md flex-none" />
                                            <span>{item.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">AED {item.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">AED {(item.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Separator className="my-6" />
                    <div className="flex justify-end">
                        <div className="text-right">
                            {order.couponCode && (
                                <p className="text-md">
                                    <strong>Coupon Applied:</strong> {order.couponCode}
                                </p>
                            )}
                             <p className="text-md">
                                <strong>Subtotal:</strong> AED {order.subtotal.toFixed(2)}
                            </p>
                             <p className="text-md">
                                <strong>Discount:</strong> - AED {order.discountAmount.toFixed(2)}
                            </p>
                             <p className="text-md">
                                <strong>Tax:</strong> AED {order.taxAmount.toFixed(2)}
                            </p>
                            <p className="text-xl font-bold mt-2">
                                <strong>Total Paid:</strong> AED {order.totalAmount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderDetailsPage;