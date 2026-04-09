'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AccountMobileTopBar } from '../../_components/AccountMobileTopBar';
import { ArrowLeft, Package, MapPin, CreditCard, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '../../../context/AppContext';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 16px rgba(147,51,234,0.06)',
};

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    Icon: Clock,        color: 'rgba(234,179,8,0.9)',     bg: 'rgba(254,249,195,0.6)' },
  processing: { label: 'Processing', Icon: Clock,        color: 'rgb(147,104,236)',         bg: 'rgba(196,167,254,0.15)' },
  shipped:    { label: 'Shipped',    Icon: Truck,        color: 'rgb(126,105,230)',         bg: 'rgba(196,167,254,0.15)' },
  delivered:  { label: 'Delivered',  Icon: CheckCircle,  color: 'rgba(34,197,94,0.9)',      bg: 'rgba(220,252,231,0.6)' },
  cancelled:  { label: 'Cancelled',  Icon: XCircle,      color: 'rgba(239,68,68,0.9)',      bg: 'rgba(254,226,226,0.6)' },
};

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  const cfg = STATUS_CONFIG[key] || { label: status, Icon: Package, color: 'rgb(126,105,230)', bg: 'rgba(196,167,254,0.15)' };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em]" style={{ background: cfg.bg, color: cfg.color }}>
      <cfg.Icon size={11} strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={glass}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(216,180,254,0.25)' }}>
        <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'rgb(147,51,234)' }}>{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { fetchWithAuth } = useAppContext();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <>
        <AccountMobileTopBar title="Order" />
        <div className="px-4 pt-8 pb-28 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-purple-200 border-t-purple-400 animate-spin" />
          <p className="text-sm" style={{ color: 'rgba(59,7,100,0.4)' }}>Loading order…</p>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <AccountMobileTopBar title="Order" />
        <div className="px-4 pt-8 pb-28 text-center">
          <p className="text-sm mb-4" style={{ color: 'rgba(59,7,100,0.45)' }}>{error || 'Order not found.'}</p>
          <button onClick={() => router.back()} className="text-sm font-bold" style={{ color: 'rgb(126,105,230)' }}>Go back</button>
        </div>
      </>
    );
  }

  const items = order.items || [];
  const hasShipping = order.shippingAddress || order.city;
  const hasPayment = order.paymentMethod || order.paymentIntent;

  return (
    <>
      <AccountMobileTopBar title={`Order #${orderId}`} />

      <div className="px-4 pb-28 pt-4">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[12px] font-bold"
            style={{ color: 'rgb(126,105,230)' }}
          >
            <ArrowLeft size={15} />
            Orders
          </button>

          {/* Order header card */}
          <div className="rounded-3xl p-6" style={glass}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                  <Package size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[15px] font-bold tracking-tight" style={{ color: '#3b0764' }}>Order #{order.id || orderId}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(59,7,100,0.45)' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-5" style={{ borderTop: '1px solid rgba(216,180,254,0.25)' }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(59,7,100,0.4)' }}>Subtotal</p>
                <p className="text-[14px] font-bold" style={{ color: '#3b0764' }}>AED {Number(order.totalAmount || 0).toFixed(2)}</p>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(59,7,100,0.4)' }}>Tax (VAT)</p>
                  <p className="text-[14px] font-bold" style={{ color: '#3b0764' }}>AED {Number(order.taxAmount).toFixed(2)}</p>
                </div>
              )}
              {Number(order.discountAmount) > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(59,7,100,0.4)' }}>Discount</p>
                  <p className="text-[14px] font-bold" style={{ color: 'rgba(34,197,94,0.9)' }}>− AED {Number(order.discountAmount).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <Section title="Items">
              <div className="space-y-4">
                {items.map((item, i) => (
                  <div key={item.productId || i} className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(248,240,255,0.8)', border: '1px solid rgba(216,180,254,0.25)' }}>
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name || 'Product'} width={56} height={56} className="object-contain p-1" />
                      ) : (
                        <Package size={20} strokeWidth={1.5} style={{ color: 'rgba(196,167,254,0.6)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold leading-snug line-clamp-1" style={{ color: '#3b0764' }}>{item.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(59,7,100,0.45)' }}>Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[13px] font-bold flex-shrink-0" style={{ color: '#3b0764' }}>
                      AED {Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Shipping address */}
          {hasShipping && (
            <Section title="Shipping Address">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                  <MapPin size={15} strokeWidth={1.75} />
                </div>
                <div className="space-y-0.5">
                  {order.customerName && <p className="text-[13px] font-semibold" style={{ color: '#3b0764' }}>{order.customerName}</p>}
                  {order.shippingAddress && <p className="text-[12px]" style={{ color: 'rgba(59,7,100,0.55)' }}>{order.shippingAddress}</p>}
                  {order.addressLine2 && <p className="text-[12px]" style={{ color: 'rgba(59,7,100,0.55)' }}>{order.addressLine2}</p>}
                  {(order.city || order.country) && (
                    <p className="text-[12px]" style={{ color: 'rgba(59,7,100,0.55)' }}>
                      {[order.city, order.state, order.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {order.customerPhone && <p className="text-[12px] mt-1" style={{ color: 'rgba(59,7,100,0.45)' }}>{order.customerPhone}</p>}
                </div>
              </div>
            </Section>
          )}

          {/* Payment info */}
          {hasPayment && (
            <Section title="Payment">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                  <CreditCard size={15} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: '#3b0764' }}>{order.paymentMethod || 'Card'}</p>
                  {order.paymentIntent && (
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(59,7,100,0.35)' }}>{order.paymentIntent}</p>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Status timeline */}
          <Section title="Order Timeline">
            <div className="space-y-4">
              {[
                { key: 'pending',    label: 'Order Placed' },
                { key: 'processing', label: 'Processing' },
                { key: 'shipped',    label: 'Shipped' },
                { key: 'delivered',  label: 'Delivered' },
              ].map((step, i, arr) => {
                const statusKeys = ['pending', 'processing', 'shipped', 'delivered'];
                const currentIdx = statusKeys.indexOf(String(order.status || '').toLowerCase());
                const stepIdx = statusKeys.indexOf(step.key);
                const done = stepIdx <= currentIdx;
                const active = stepIdx === currentIdx;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{
                        background: done ? 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' : 'rgba(196,167,254,0.15)',
                        border: active ? '2px solid rgb(196,167,254)' : 'none',
                      }}>
                        <CheckCircle size={13} strokeWidth={2.5} style={{ color: done ? '#fff' : 'rgba(196,167,254,0.4)' }} />
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ height: '20px', background: done ? 'rgba(196,167,254,0.4)' : 'rgba(216,180,254,0.2)' }} />
                      )}
                    </div>
                    <p className="text-[12px] font-semibold pt-1.5" style={{ color: done ? '#3b0764' : 'rgba(59,7,100,0.35)' }}>{step.label}</p>
                  </div>
                );
              })}
            </div>
          </Section>

        </div>
      </div>
    </>
  );
}
