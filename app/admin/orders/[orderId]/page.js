'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, XCircle, Info, Printer } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import Link from 'next/link';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useAppContext } from '@/app/context/AppContext';

const STATUS_BADGE = {
  pending:    'sp-badge-warning',
  processing: 'sp-badge-info',
  shipped:    'sp-badge-info',
  delivered:  'sp-badge-success',
  cancelled:  'sp-badge-critical',
};

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

  const { fetchWithAuth } = useAppContext();
  const router = useRouter();

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/orders/${orderId}?admin=true`);
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

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  useEffect(() => {
    const fetchStripeDetails = async () => {
      if (order && order.stripePaymentIntentId) {
        try {
          const response = await fetchWithAuth(`/api/admin/stripe/payment_intent/${order.stripePaymentIntentId}`);
          if (response.ok) setStripePaymentDetails(await response.json());
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
      if (responseData.moved) router.push('/admin/orders');
      else await fetchOrderDetails();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageLoader />;

  if (error || !order) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4" style={{ color: '#b42318' }}>
        <XCircle size={40} className="opacity-40" />
        <p className="font-medium text-[14px]">Could not load order: {error || 'Not found'}</p>
        <Link href="/admin/orders" className="sp-btn sp-btn-secondary">Back to orders</Link>
      </div>
    );
  }

  const isTrackingInfoVisible = ['Shipped', 'Delivered'].includes(newStatus);
  const isCancellationReasonVisible = newStatus === 'Cancelled';
  const isPaid = !!stripePaymentDetails || order.paymentMethod === 'card';
  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const headingClass = 'text-[14px] font-semibold mb-3';

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="sp-btn sp-btn-secondary px-2"><ArrowLeft size={16} /></Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[20px] font-semibold" style={{ color: 'var(--sp-text)' }}>#{order.id}</h1>
              {isPaid && <span className="sp-badge sp-badge-neutral"><span className="dot" />Paid</span>}
              <span className={`sp-badge ${STATUS_BADGE[order.status?.toLowerCase()] || 'sp-badge-neutral'}`}><span className="dot" />{order.status}</span>
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--sp-text-subdued)' }}>
              {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} from Online Store
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="sp-btn sp-btn-secondary">Refund</button>
          <a href={`/admin/orders/${orderId}/packing-slip`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">
            <Printer size={14} /> Print
          </a>
          <button className="sp-btn sp-btn-secondary">More actions</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Fulfillment / items */}
          <div className="sp-card">
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
              <span className={`sp-badge ${STATUS_BADGE[order.status?.toLowerCase()] || 'sp-badge-neutral'}`}><span className="dot" />{order.status}</span>
              <span className="text-[13px]" style={{ color: 'var(--sp-text-secondary)' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-5 space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 p-1.5" style={{ background: '#f1f1f1', border: '1px solid var(--sp-border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.product?.imageUrl || 'https://via.placeholder.com/150'} alt={item.product?.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>{item.product?.brandName || 'Naya Lumière'}</p>
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--sp-text)' }}>{item.product?.name || 'Product'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px]" style={{ color: 'var(--sp-text-secondary)' }}>AED {parseFloat(item.price).toFixed(2)} × {item.quantity}</p>
                    <p className="text-[14px] font-semibold">AED {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          <div className="sp-card">
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
              <span className="sp-badge sp-badge-neutral"><span className="dot" />{isPaid ? 'Paid' : 'Payment pending'}</span>
            </div>
            <div className="p-5 space-y-2.5">
              <div className="flex justify-between text-[13px]"><span style={{ color: 'var(--sp-text-secondary)' }}>Subtotal ({order.items.length} items)</span><span className="font-medium">AED {subtotal.toFixed(2)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[13px]"><span style={{ color: 'var(--sp-text-secondary)' }}>Discount</span><span className="font-medium text-green-600">- AED {order.discountAmount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between text-[13px]"><span style={{ color: 'var(--sp-text-secondary)' }}>Shipping</span><span className="font-medium">AED {order.shippingCost ? order.shippingCost.toFixed(2) : '0.00'}</span></div>
              {order.giftWrapCost > 0 && (
                <div className="flex justify-between text-[13px]"><span style={{ color: 'var(--sp-text-secondary)' }}>Gift wrap</span><span className="font-medium">AED {order.giftWrapCost.toFixed(2)}</span></div>
              )}
              <div className="pt-2.5 flex justify-between items-center" style={{ borderTop: '1px solid var(--sp-border)' }}>
                <span className="text-[14px] font-semibold">Total</span>
                <span className="text-[16px] font-semibold">AED {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Update status */}
          <div className="sp-card">
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--sp-border)' }}>
              <h2 className="sp-section-title">Update status</h2>
            </div>
            <div className="p-5 space-y-4">
              {updateError && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2 text-red-600 text-[13px]">
                  <Info size={15} />{updateError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="sp-label">Order status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger id="status" className="w-full h-10 rounded-lg bg-white border-[#d1d1d1] text-[13px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isCancellationReasonVisible && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cancellationReason" className="sp-label">Cancellation reason</Label>
                    <Textarea id="cancellationReason" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Reason for cancellation..." className="bg-white border border-[#d1d1d1] rounded-lg px-3 py-2 text-[13px]" />
                  </div>
                )}
              </div>
              {isTrackingInfoVisible && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg" style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="trackingNumber" className="sp-label">Tracking number</Label>
                    <Input id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="1Z999AA10123456784" className="h-9 rounded-lg bg-white border-[#d1d1d1] text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="courierName" className="sp-label">Courier</Label>
                    <Input id="courierName" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="FedEx, DHL, Aramex..." className="h-9 rounded-lg bg-white border-[#d1d1d1] text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="courierWebsite" className="sp-label">Tracking link</Label>
                    <Input id="courierWebsite" value={courierWebsite} onChange={(e) => setCourierWebsite(e.target.value)} placeholder="https://track..." className="h-9 rounded-lg bg-white border-[#d1d1d1] text-[13px]" />
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={handleUpdateStatus} disabled={isSubmitting} className="sp-btn sp-btn-primary">
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save status'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="sp-card sp-card-pad">
            <p className={headingClass}>Customer</p>
            <p className="text-[13px] sp-link">{order.customerName}</p>
            <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--sp-border)' }}>
              <div>
                <p className="text-[13px] font-semibold mb-1">Contact information</p>
                <p className="text-[13px] sp-link break-all">{order.customerEmail}</p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--sp-text-secondary)' }}>{order.customerPhone || 'No phone number'}</p>
              </div>
              <div className="pt-3" style={{ borderTop: '1px solid var(--sp-border)' }}>
                <p className="text-[13px] font-semibold mb-1">Shipping address</p>
                <div className="text-[13px] space-y-0.5" style={{ color: 'var(--sp-text-secondary)' }}>
                  <p>{order.customerName}</p>
                  <p>{order.shippingAddress}</p>
                  <p>{order.city}{order.zipCode ? ` ${order.zipCode}` : ''}</p>
                  <p>United Arab Emirates</p>
                </div>
              </div>
            </div>
          </div>

          {stripePaymentDetails && (
            <div className="sp-card sp-card-pad">
              <p className={headingClass}>Payment details</p>
              <div className="space-y-3">
                <div>
                  <p className="sp-label mb-1">Stripe payment ID</p>
                  <p className="text-[12px] font-mono p-2 rounded-lg truncate" style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-secondary)' }}>{stripePaymentDetails.id}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="sp-label">Status</p>
                  <span className={`sp-badge ${stripePaymentDetails.status === 'succeeded' ? 'sp-badge-success' : 'sp-badge-warning'}`}>{stripePaymentDetails.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="sp-label">Amount captured</p>
                  <span className="text-[13px] font-semibold">AED {(stripePaymentDetails.amount_captured / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
