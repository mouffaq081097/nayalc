'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Mail, Phone, MessageSquare, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

/* ── helpers ── */
const fmtAed = (n) => `AED ${parseFloat(n || 0).toFixed(0)}`;
function estimatedDelivery(createdAt) {
  const d = new Date(createdAt || Date.now());
  const from = new Date(d); from.setDate(from.getDate() + 3);
  const to   = new Date(d); to.setDate(to.getDate() + 5);
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${from.toLocaleDateString('en-AE', opts)} – ${to.toLocaleDateString('en-AE', opts)}`;
}
function paymentLabel(method) {
  if (method === 'card')           return 'Credit/Debit Card';
  if (method === 'cashOnDelivery') return 'Cash on Delivery';
  if (method === 'tabby')          return 'Tabby – Pay in 4';
  return method || 'Credit/Debit Card';
}

function SCard({ children, className = '', style }) {
  return (
    <div className={`bg-white border border-[#e5e5ea] rounded-2xl overflow-hidden ${className}`} style={style}>
      {children}
    </div>
  );
}

export default function OrderConfirmedPage() {
  const { orderId } = useParams();
  const router      = useRouter();
  const { fetchWithAuth } = useAppContext();
  const { user } = useAuth();

  const [order,         setOrder]         = useState(null);
  const [prevPoints,    setPrevPoints]    = useState(null); // loaded from loyalty API
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    if (!orderId) return;
    fetchWithAuth(`/api/orders/${orderId}`)
      .then(res => { if (!res.ok) throw new Error('Order not found'); return res.json(); })
      .then(data => { setOrder(data); setLoading(false); })
      .catch(e   => { setError(e.message); setLoading(false); });
  }, [orderId, fetchWithAuth]);

  // Fetch current loyalty points to show "previous balance"
  useEffect(() => {
    if (!user?.id) return;
    fetchWithAuth(`/api/users/${user.id}/loyalty`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stats?.points != null) setPrevPoints(d.stats.points); })
      .catch(() => {});
  }, [user, fetchWithAuth]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#9869f7]" />
    </div>
  );
  if (error || !order) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-[16px] font-semibold text-[#111114]">Could not load your order.</p>
      <button onClick={() => router.push('/account/orders')} className="text-[13px] text-[#9869f7] underline underline-offset-2">
        View all orders
      </button>
    </div>
  );

  /* ── field mapping ── */
  const items       = order.items || [];
  const addr        = order.shippingAddressDetails || {};
  const subtotal    = parseFloat(order.subtotal    || 0);
  const tax         = parseFloat(order.taxAmount   || 0);
  const shipping    = parseFloat(order.shippingCost || 0);
  const discount    = parseFloat(order.discountAmount || 0);
  const giftWrap    = parseFloat(order.giftWrapCost  || 0);
  const totalPaid   = parseFloat(order.totalAmount  || 0);
  const orderRef    = order.order_number || `NL-${String(orderId).toUpperCase().slice(-8)}`;

  // Points: 1 pt per AED spent. Points are credited on delivery, but we show estimated.
  const pointsEarned = Math.floor(totalPaid);
  const prevBal      = prevPoints ?? 0;
  const newBal       = prevBal + pointsEarned;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="flex justify-center pt-12 pb-2">
        <Image
          src="/Adobe Express - file (5).png"
          alt="Naya Lumière"
          width={64}
          height={64}
          className="w-16 h-16 object-contain"
        />
      </div>

      <div className="max-w-[1180px] mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ══ LEFT ══ */}
          <div className="space-y-5">

            {/* Hero confirmation */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <SCard className="p-8 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-white"
                  style={{ background: 'linear-gradient(135deg,#c087fc,#9869f7)' }}
                >
                  <Check size={28} strokeWidth={3} />
                </div>
                <h1 className="text-[28px] font-bold text-[#111114] mb-2">Order Placed!</h1>
                <p className="text-[14px] text-[#5a5a64] leading-relaxed">
                  Thank you for your order. We've sent a confirmation email
                  {order.customerEmail
                    ? <> to <span className="font-semibold text-[#111114]">{order.customerEmail}</span></>
                    : user?.email
                    ? <> to <span className="font-semibold text-[#111114]">{user.email}</span></>
                    : null
                  }.
                </p>
                <div className="inline-flex items-center gap-3 mt-5 px-5 py-2.5 rounded-full border border-[#e5e5ea] bg-[#f9f9fb]">
                  <span className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-widest">Order</span>
                  <span className="text-[15px] font-bold text-[#111114] tracking-wide">{orderRef}</span>
                </div>
              </SCard>
            </motion.div>

            {/* Items ordered */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
              <SCard>
                <div className="px-6 py-4 border-b border-[#e5e5ea]">
                  <h2 className="text-[16px] font-semibold text-[#111114]">Items Ordered</h2>
                </div>
                {items.length === 0 && (
                  <p className="px-6 py-5 text-[13px] text-[#8a8a93]">No items found.</p>
                )}
                {items.map((item, i) => {
                  const product  = item.product || {};
                  const name     = product.name || item.name || 'Product';
                  const imageUrl = product.imageUrl || item.imageUrl || null;
                  const price    = parseFloat(item.price || 0);
                  const qty      = item.quantity || 1;

                  return (
                    <div
                      key={item.id || i}
                      className={`flex items-center gap-4 px-6 py-4 ${i < items.length - 1 ? 'border-b border-[#e5e5ea]' : ''}`}
                    >
                      {/* Thumbnail */}
                      <div className="w-[72px] h-[72px] rounded-xl bg-[#f9f9fb] border border-[#e5e5ea] flex-shrink-0 overflow-hidden p-2">
                        {imageUrl
                          ? <Image
                              src={imageUrl}
                              alt={name}
                              width={72}
                              height={72}
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                          : <div className="w-full h-full bg-[#f3f3f5] rounded-lg" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-[0.1em] mb-0.5">
                          Naya Lumière
                        </p>
                        <p className="text-[15px] font-semibold text-[#111114] leading-snug">{name}</p>
                        <p className="text-[12px] text-[#8a8a93] mt-0.5">
                          Qty {qty}
                        </p>
                      </div>

                      {/* Price */}
                      <p className="text-[16px] font-semibold text-[#111114] tabular-nums flex-shrink-0">
                        {fmtAed(price * qty)}
                      </p>
                    </div>
                  );
                })}
              </SCard>
            </motion.div>

            {/* Delivery details */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }}>
              <SCard className="p-6">
                <h2 className="text-[16px] font-semibold text-[#111114] mb-5">Delivery Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Ship to */}
                  <div>
                    <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-[0.14em] mb-2">Ship To</p>
                    <div className="space-y-0.5 text-[14px] text-[#2a2a31]">
                      {order.customerName && <p className="font-semibold">{order.customerName}</p>}
                      {addr.addressLine1  && <p>{addr.addressLine1}</p>}
                      {addr.addressLine2  && <p>{addr.addressLine2}</p>}
                      {addr.city         && <p>{[addr.city, addr.state].filter(Boolean).join(', ')}</p>}
                      {addr.country      && <p>{addr.country}</p>}
                      {!order.customerName && !addr.addressLine1 && (
                        <p className="text-[#8a8a93]">Address on file</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery + payment */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-[0.14em] mb-1.5">Estimated Delivery</p>
                      <p className="text-[14px] font-semibold text-[#111114]">{estimatedDelivery(order.createdAt || order.created_at)}</p>
                      <p className="text-[12px] text-[#8a8a93] mt-0.5">Standard delivery within UAE</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-[0.14em] mb-1.5">Payment</p>
                      <p className="text-[14px] font-semibold text-[#111114]">{paymentLabel(order.payment_method || order.paymentMethod)}</p>
                    </div>
                  </div>
                </div>
              </SCard>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="flex gap-3"
            >
              <button
                onClick={() => router.push(`/account/orders/${orderId}`)}
                className="flex-1 h-14 rounded-full border border-[#e5e5ea] text-[14px] font-semibold text-[#111114] hover:bg-[#f3f3f5] transition-colors"
              >
                Track Order
              </button>
              <button
                onClick={() => router.push('/all-products')}
                className="flex-1 h-14 rounded-full flex items-center justify-center gap-2 text-[13px] font-semibold tracking-[0.1em] uppercase text-white"
                style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
              >
                Continue Shopping
                <ArrowRight size={15} strokeWidth={2} />
              </button>
            </motion.div>
          </div>

          {/* ══ RIGHT sidebar ══ */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Payment summary */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.35 }}>
              <SCard className="p-5">
                <h3 className="text-[16px] font-semibold text-[#111114] mb-4">Payment Summary</h3>
                <div className="space-y-3 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#5a5a64]">Subtotal</span>
                    <span className="font-semibold text-[#111114]">{fmtAed(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Discount</span>
                      <span>−{fmtAed(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#5a5a64]">Shipping</span>
                    <span className={shipping === 0 ? 'font-semibold text-green-600' : 'font-semibold text-[#111114]'}>
                      {shipping === 0 ? 'Free' : fmtAed(shipping)}
                    </span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#5a5a64]">Tax (5%)</span>
                      <span className="font-semibold text-[#111114]">{fmtAed(tax)}</span>
                    </div>
                  )}
                  {giftWrap > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#5a5a64]">Gift wrap</span>
                      <span className="font-semibold text-[#111114]">{fmtAed(giftWrap)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-[#e5e5ea] flex justify-between items-baseline">
                  <span className="text-[16px] font-semibold text-[#111114]">Total Paid</span>
                  <span className="text-[20px] font-bold text-[#111114] tabular-nums">{fmtAed(totalPaid)}</span>
                </div>
              </SCard>
            </motion.div>

            {/* Points earned */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.35 }}>
              <SCard className="p-5" style={{ background: 'rgba(152,105,247,0.04)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                    style={{ background: 'linear-gradient(135deg,#c087fc,#9869f7)' }}
                  >
                    {/* star icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#111114]">+{pointsEarned.toLocaleString()} Points Earned</p>
                    <p className="text-[12px] text-[#8a8a93]">Added to your loyalty balance</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#5a5a64]">Previous balance</span>
                    <span className="font-semibold text-[#111114]">{prevBal.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a5a64]">Earned this order</span>
                    <span className="font-semibold" style={{ color: '#9869f7' }}>+{pointsEarned.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-[#e5e5ea]">
                    <span className="font-semibold text-[#111114]">New balance</span>
                    <span className="font-bold text-[#111114]">{newBal.toLocaleString()} pts</span>
                  </div>
                </div>
              </SCard>
            </motion.div>

            {/* Need help */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24, duration: 0.35 }}>
              <SCard className="p-5">
                <h3 className="text-[15px] font-semibold text-[#111114] mb-3">Need help?</h3>
                <div className="space-y-2.5">
                  <a href="mailto:support@nayalumiere.com"
                    className="flex items-center gap-2.5 text-[13px] text-[#2a2a31] hover:text-[#9869f7] transition-colors">
                    <Mail size={14} className="text-[#8a8a93] flex-shrink-0" />
                    support@nayalumiere.com
                  </a>
                  <a href="tel:+97145550000"
                    className="flex items-center gap-2.5 text-[13px] text-[#2a2a31] hover:text-[#9869f7] transition-colors">
                    <Phone size={14} className="text-[#8a8a93] flex-shrink-0" />
                    +971 4 555 0000
                  </a>
                  <div className="flex items-center gap-2.5 text-[13px] text-[#2a2a31]">
                    <MessageSquare size={14} className="text-[#8a8a93] flex-shrink-0" />
                    Live chat (9am–9pm GST)
                  </div>
                </div>
              </SCard>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
