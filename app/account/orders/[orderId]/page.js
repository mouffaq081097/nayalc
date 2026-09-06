'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import AccountShell from '../../_components/AccountShell';
import { useAccountData } from '../../_components/useAccountData';
import { ArrowLeft, Package, MapPin, CreditCard, CheckCircle, Truck, RefreshCw, FileText } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '../../../context/AppContext';
import { useCart } from '../../../context/CartContext';
import PageLoader from '@/app/components/PageLoader';
import { statusMeta } from '../../_components/orderStatus';

const TIMELINE_STEPS = [
  { key: 'pending',    label: 'Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
];

function paymentLabel(method) {
  const key = (method || '').toLowerCase();
  if (key === 'card') return 'Credit / debit card';
  if (key === 'cashondelivery' || key === 'cash') return 'Cash on delivery';
  if (key === 'tabby') return 'Tabby — pay in installments';
  return method || 'Card';
}

function Section({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg border border-[#eaeaea] overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-[#f3f3f5]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, bold, muted, negative }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[12px] ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-[13px] tabular-nums ${bold ? 'font-bold text-gray-900 text-[14px]' : 'font-medium text-gray-700'} ${negative ? 'text-green-600' : ''}`}>
        {negative ? '− ' : ''}AED {value.toFixed(2)}
      </span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { fetchWithAuth, products } = useAppContext();
  const { addToCart } = useCart();
  const { wishlistItems } = useAccountData();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchWithAuth(`/api/orders/${orderId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load order');
        return res.json();
      })
      .then(data => { setOrder(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [orderId, fetchWithAuth]);

  if (loading) return <PageLoader />;

  if (error || !order) {
    return (
      <AccountShell wishCount={wishCount} title="Order">
        <div className="py-16 text-center">
          <p className="text-sm mb-4 text-gray-400">{error || 'Order not found.'}</p>
          <button onClick={() => router.back()} className="text-sm font-bold text-purple-600">Go back</button>
        </div>
      </AccountShell>
    );
  }

  const items = order.items || [];
  const hasShipping = order.shippingAddress || order.city;
  const hasPayment = order.payment_method || order.stripePaymentIntentId;
  const { label, badge, Icon } = statusMeta(order.status);
  const isCancelled = String(order.status || '').toLowerCase() === 'cancelled';
  const currentStepIdx = TIMELINE_STEPS.findIndex(s => s.key === String(order.status || '').toLowerCase());

  const handleBuyAgain = () => {
    let added = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.product?.id);
      if (product && Number(product.stock_quantity) > 0) {
        addToCart(product, item.quantity || 1);
        added += 1;
      }
    }
    if (added === 0) {
      toast.error('These items are no longer available.');
      return;
    }
    if (added < items.length) {
      toast.info('Some items were out of stock and skipped.');
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <AccountShell wishCount={wishCount} title={`Order #${order.id || orderId}`}>
      <div className="w-full space-y-4">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="hidden md:inline-flex items-center gap-2 text-[12px] font-bold text-purple-600"
        >
          <ArrowLeft size={14} />
          Back to orders
        </button>

        {/* Identity bar: order #, date, status, quick actions */}
        <div className="bg-white rounded-lg border border-[#eaeaea] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-600">
              <Package size={19} strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[14px] font-bold text-gray-900">Order #{order.id || orderId}</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badge}`}>
                  <Icon size={10} strokeWidth={2.5} />
                  {label}
                </span>
              </div>
              <p className="text-[11px] mt-0.5 text-gray-400">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                {items.length > 0 ? ` · ${items.length} item${items.length > 1 ? 's' : ''}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleBuyAgain}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${
                justAdded ? 'border-green-200 bg-green-50 text-green-700' : 'border-[#eaeaea] bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {justAdded ? <CheckCircle size={12} /> : <RefreshCw size={12} />}
              {justAdded ? 'Added' : 'Buy again'}
            </button>

            {order.courier_website && (
              <a
                href={order.courier_website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border border-[#eaeaea] bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Truck size={12} />
                Track
              </a>
            )}

            <a
              href={`/api/orders/${orderId}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border border-[#eaeaea] bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText size={12} />
              Invoice
            </a>
          </div>
        </div>

        {/* Main grid: items + timeline (left, wide) · totals/shipping/payment (right, narrow) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          <div className="lg:col-span-2 space-y-4">
            {items.length > 0 && (
              <Section title="Items">
                <div className="space-y-4">
                  {items.map((item, i) => (
                    <div key={item.id || i} className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-50 border border-[#f0f0f0]">
                        {item.product?.imageUrl ? (
                          <Image src={item.product.imageUrl} alt={item.product?.name || 'Product'} width={56} height={56} className="object-contain p-1" />
                        ) : (
                          <Package size={20} strokeWidth={1.5} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-snug line-clamp-1 text-gray-900">{item.product?.name || 'Product'}</p>
                        <p className="text-[11px] mt-0.5 text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-[13px] font-bold flex-shrink-0 text-gray-900">
                        AED {Number(item.price || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {isCancelled ? (
              <Section title="Order status">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 text-red-500">
                    <Icon size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">This order was cancelled</p>
                    {order.cancellationReason && (
                      <p className="text-[12px] mt-0.5 text-gray-500">{order.cancellationReason}</p>
                    )}
                  </div>
                </div>
              </Section>
            ) : (
              <Section title="Order timeline">
                <div className="flex items-start">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done = i <= currentStepIdx;
                    const active = i === currentStepIdx;
                    const lineFilled = i < currentStepIdx;
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 64 }}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-purple-600' : 'bg-purple-50'} ${active ? 'ring-2 ring-purple-300 ring-offset-2' : ''}`}>
                            <CheckCircle size={14} strokeWidth={2.5} className={done ? 'text-white' : 'text-purple-200'} />
                          </div>
                          <p className={`text-[10px] font-semibold text-center ${done ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</p>
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`flex-1 h-px mt-4 ${lineFilled ? 'bg-purple-300' : 'bg-gray-100'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Section title="Order summary">
              <div className="space-y-2.5">
                <SummaryRow label="Subtotal" value={Number(order.subtotal || 0)} />
                {Number(order.shippingCost) > 0 && <SummaryRow label="Shipping" value={Number(order.shippingCost)} />}
                {Number(order.giftWrapCost) > 0 && <SummaryRow label="Gift wrap" value={Number(order.giftWrapCost)} />}
                {Number(order.taxAmount) > 0 && <SummaryRow label="Tax (VAT)" value={Number(order.taxAmount)} />}
                {Number(order.discountAmount) > 0 && <SummaryRow label="Discount" value={Number(order.discountAmount)} negative />}
                <div className="pt-2.5 mt-1 border-t border-[#f3f3f5]">
                  <SummaryRow label="Total" value={Number(order.totalAmount || 0)} bold />
                </div>
              </div>
            </Section>

            {hasShipping && (
              <Section title="Shipping address">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-600">
                    <MapPin size={15} strokeWidth={1.75} />
                  </div>
                  <div className="space-y-0.5">
                    {order.customerName && <p className="text-[13px] font-semibold text-gray-900">{order.customerName}</p>}
                    {order.shippingAddress && <p className="text-[12px] text-gray-500">{order.shippingAddress}</p>}
                    {order.addressLine2 && <p className="text-[12px] text-gray-500">{order.addressLine2}</p>}
                    {(order.city || order.country) && (
                      <p className="text-[12px] text-gray-500">
                        {[order.city, order.state, order.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {order.customerPhone && <p className="text-[12px] mt-1 text-gray-400">{order.customerPhone}</p>}
                  </div>
                </div>
              </Section>
            )}

            {hasPayment && (
              <Section title="Payment">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-600">
                    <CreditCard size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{paymentLabel(order.payment_method)}</p>
                    {order.stripePaymentIntentId && (
                      <p className="text-[10px] font-mono mt-0.5 text-gray-400">{order.stripePaymentIntentId}</p>
                    )}
                  </div>
                </div>
              </Section>
            )}
          </div>

        </div>
      </div>
    </AccountShell>
  );
}
