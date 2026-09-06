'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import {
  Package, Search, ChevronLeft, ChevronRight, Calendar, SlidersHorizontal,
  RotateCcw, User, MapPin, AlertCircle, Loader2, CheckCircle, Download, Store,
} from 'lucide-react';
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
      <div className="sp-card sp-card-pad space-y-4">
        <div className="flex items-center gap-2">
          <User size={15} style={{ color: 'var(--sp-text-secondary)' }} />
          <h3 className="sp-section-title">Look up customer cart</h3>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--sp-text-secondary)' }}>Enter the customer&apos;s email to load their saved cart, then create the missing order.</p>
        <div className="flex gap-2">
          <input
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="customer@email.com" className="sp-input flex-1"
          />
          <button onClick={lookup} disabled={lookupLoading || !email.trim()} className="sp-btn sp-btn-primary">
            {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
          </button>
        </div>
        {lookupError && <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={13} />{lookupError}</div>}
      </div>

      {lookupResult && (
        <>
          <div className="sp-card sp-card-pad space-y-3">
            <div className="flex items-center gap-2">
              <Package size={15} style={{ color: 'var(--sp-text-secondary)' }} />
              <h3 className="sp-section-title">{lookupResult.user.firstName}&apos;s cart ({lookupResult.cart.length} items)</h3>
            </div>
            {lookupResult.cart.length === 0
              ? <p className="text-[13px]" style={{ color: 'var(--sp-text-subdued)' }}>Cart is empty — nothing to recover.</p>
              : <>
                {lookupResult.cart.map(item => (
                  <div key={item.productId} className="flex justify-between py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: 'var(--sp-text)' }}>{item.name}</p>
                      <p className="text-[12px]" style={{ color: 'var(--sp-text-subdued)' }}>Qty {item.quantity} · AED {parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                    <p className="text-[13px] font-semibold">AED {(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-between text-[14px] font-semibold pt-1">
                  <span>Estimated total</span><span>AED {total.toFixed(2)}</span>
                </div>
              </>
            }
          </div>

          {lookupResult.cart.length > 0 && (
            <div className="sp-card sp-card-pad space-y-4">
              <div className="flex items-center gap-2"><MapPin size={15} style={{ color: 'var(--sp-text-secondary)' }} /><h3 className="sp-section-title">Order details</h3></div>
              <div className="space-y-1.5">
                <label className="sp-label">Shipping address</label>
                {lookupResult.addresses.length === 0
                  ? <p className="text-[13px] text-red-500">No addresses saved for this customer.</p>
                  : <select value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)} className="sp-input">
                    {lookupResult.addresses.map(a => (
                      <option key={a.id} value={a.id}>{a.address_label || a.shipping_address} — {a.city}{a.is_default ? ' (default)' : ''}</option>
                    ))}
                  </select>
                }
              </div>
              <div className="space-y-1.5">
                <label className="sp-label">Payment method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="sp-input">
                  <option value="tabby">Tabby (Pay in 4)</option>
                  <option value="cashOnDelivery">Cash on delivery</option>
                  <option value="card">Card</option>
                </select>
              </div>
              {paymentMethod === 'tabby' && (
                <div className="space-y-1.5">
                  <label className="sp-label">Tabby payment ID <span style={{ color: 'var(--sp-text-subdued)' }}>(from Tabby dashboard)</span></label>
                  <input value={tabbyPaymentId} onChange={e => setTabbyPaymentId(e.target.value)} placeholder="e.g. pay_xxxxxxxx" className="sp-input font-mono" />
                </div>
              )}
              {placeError && <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={13} />{placeError}</div>}
              {success ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-green-700">Order recovered successfully</p>
                    <Link href={`/admin/orders/${success.orderId}`} className="text-[12px] text-green-600 underline">View order #{success.orderId} →</Link>
                  </div>
                </div>
              ) : (
                <button onClick={recover} disabled={placing || !selectedAddressId || lookupResult.addresses.length === 0} className="sp-btn sp-btn-primary w-full">
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

// ─── Shopify-style status mapping ────────────────────────────────────────────
const PAYMENT_BADGE = (o) => {
  const s = (o.status || '').toLowerCase();
  const pm = (o.paymentMethod || '').toLowerCase().replace(/[^a-z]/g, '');
  if (s === 'cancelled') return { label: 'Voided', cls: 'sp-badge-neutral' };
  if (s === 'payment failed') return { label: 'Payment failed', cls: 'sp-badge-critical' };
  if (o.paymentConfirmed) return { label: 'Paid', cls: 'sp-badge-neutral' };
  if (pm === 'cashondelivery' || pm === 'cash') return { label: 'Pending (COD)', cls: 'sp-badge-warning' };
  return { label: 'Payment pending', cls: 'sp-badge-warning' };
};

// Payment channel — Tabby, Stripe (card) or Cash on delivery.
const PAYMENT_METHOD = (o) => {
  const pm = (o.paymentMethod || '').toLowerCase().replace(/[^a-z]/g, '');
  if (pm === 'tabby') return 'Tabby';
  if (pm === 'card' || pm === 'stripe') return 'Stripe';
  if (pm === 'cashondelivery' || pm === 'cash') return 'Cash on delivery';
  return o.paymentMethod || '';
};
const FULFILL_BADGE = (o) => {
  const s = (o.status || '').toLowerCase();
  if (s === 'cancelled') return { label: 'Not required', cls: 'sp-badge-neutral' };
  if (s === 'delivered' || s === 'shipped') return { label: 'Fulfilled', cls: 'sp-badge-success' };
  if (s === 'processing') return { label: 'In progress', cls: 'sp-badge-info' };
  return { label: 'Unfulfilled', cls: 'sp-badge-warning' };
};
const DELIVERY_LABEL = (o) => {
  const s = (o.status || '').toLowerCase();
  if (s === 'delivered') return 'Delivered';
  if (s === 'shipped') return 'In transit';
  return '';
};
const fmtDateTime = (v) => {
  const d = new Date(v);
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${date} at ${time}`;
};
const qtyOf = (o) => (o.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0);

const MiniTrend = () => (
  <svg width="62" height="20" viewBox="0 0 62 20" className="shrink-0" aria-hidden>
    <path d="M2 14 C 12 13, 18 12, 28 13 S 48 12, 60 10" fill="none" stroke="#2a7de1" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const StatCell = ({ label, value }) => (
  <div className="px-5 py-3 flex-1 min-w-[150px]">
    <p className="mb-2 whitespace-nowrap"><span className="sp-stat-label text-[12px]">{label}</span></p>
    <div className="flex items-end justify-between gap-2">
      <span className="text-[18px] font-semibold leading-none whitespace-nowrap" style={{ color: 'var(--sp-text)' }}>
        {value}<span className="text-[13px] font-normal ml-1.5" style={{ color: 'var(--sp-text-subdued)' }}>—</span>
      </span>
      <MiniTrend />
    </div>
  </div>
);

const ManageOrders = () => {
  const { allOrders, fetchAllOrders } = useAppContext();
  const [tab,          setTab]          = useState('orders');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isLoading,    setIsLoading]    = useState(true);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selected,     setSelected]     = useState(() => new Set());
  const ordersPerPage = 10;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchAllOrders(currentPage, ordersPerPage);
      setIsLoading(false);
    };
    load();
  }, [fetchAllOrders, currentPage, ordersPerPage]);

  // Auto-refresh: Tabby/Stripe webhooks update payment status server-side; re-fetch
  // silently so those changes (e.g. Pending → Paid) appear without a manual reload.
  useEffect(() => {
    const id = setInterval(() => { fetchAllOrders(currentPage, ordersPerPage); }, 30_000);
    return () => clearInterval(id);
  }, [fetchAllOrders, currentPage, ordersPerPage]);

  const filteredOrders = useMemo(() => {
    let list = allOrders.orders || [];
    if (filterStatus !== 'All') list = list.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase());
    if (searchTerm) list = list.filter(o =>
      o.id.toString().includes(searchTerm) || o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return list;
  }, [allOrders.orders, filterStatus, searchTerm]);

  // allOrders is fetched with statusFilter=all, so its totalCount is the grand total.
  const grandTotal = allOrders.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(grandTotal / ordersPerPage));

  // "Today" metrics — orders are sorted newest-first, so today's sit on the first page.
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todays = (allOrders.orders || []).filter(o => new Date(o.createdAt) >= todayStart);
  const tStats = {
    orders:    todays.length,
    items:     todays.reduce((s, o) => s + qtyOf(o), 0),
    fulfilled: todays.filter(o => ['shipped', 'delivered'].includes((o.status || '').toLowerCase())).length,
    delivered: todays.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
  };

  const pageIds = filteredOrders.map(o => o.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const toggleOne = (id) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(prev => {
    const n = new Set(prev);
    if (allOnPageSelected) pageIds.forEach(id => n.delete(id));
    else pageIds.forEach(id => n.add(id));
    return n;
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--sp-text)' }}>Orders</h1>
        <div className="flex items-center gap-2">
          <button className="sp-btn sp-btn-secondary"><Download size={14} /> Export</button>
          <Link href="/admin/recover-order" className="sp-btn sp-btn-secondary">More actions</Link>
          <button onClick={() => setTab('recover')} className="sp-btn sp-btn-primary">Create order</button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="sp-card overflow-hidden">
        <div className="flex items-stretch divide-x overflow-x-auto" style={{ borderColor: 'var(--sp-border)' }}>
          <div className="px-5 py-3 flex items-center gap-2 shrink-0 min-w-[104px]">
            <Calendar size={14} style={{ color: 'var(--sp-text-secondary)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--sp-text)' }}>Today</span>
          </div>
          <StatCell label="Orders" value={tStats.orders} />
          <StatCell label="Items ordered" value={tStats.items} />
          <StatCell label="Returns" value="AED 0" />
          <StatCell label="Orders fulfilled" value={tStats.fulfilled} />
          <StatCell label="Orders delivered" value={tStats.delivered} />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1">
        {[{ id: 'orders', label: 'All orders' }, { id: 'recover', label: 'Recover from cart' }].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`sp-btn text-[13px] ${tab === id ? 'sp-btn-secondary' : 'sp-btn-plain'}`}>
            {id === 'recover' && <RotateCcw size={13} />}{label}
          </button>
        ))}
      </div>

      {tab === 'recover' && <RecoverFromCart />}
      {tab === 'orders' && (
        <div className="sp-card overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-2.5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
            {selected.size > 0 ? (
              <div className="flex items-center gap-3 flex-1">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--sp-text)' }}>{selected.size} selected</span>
                <button onClick={() => setSelected(new Set())} className="sp-btn sp-btn-plain text-[13px]">Clear selection</button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--sp-text-subdued)' }} />
                  <input
                    type="text" placeholder="Search and filter"
                    className="sp-input pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="sp-input w-auto">
                  <option value="All">All orders</option>
                  {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <button className="p-2 rounded-lg hover:bg-[#f1f1f1] transition-colors" style={{ border: '1px solid var(--sp-border)', color: 'var(--sp-text-secondary)' }} aria-label="Columns">
              <SlidersHorizontal size={15} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="sp-table sp-table-orders">
              <thead>
                <tr>
                  <th className="w-[42px]">
                    <input type="checkbox" className="sp-check" checked={allOnPageSelected} onChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th className="text-right">Total</th>
                  <th>Payment status</th>
                  <th>Fulfillment status</th>
                  <th>Items</th>
                  <th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const cancelled = (order.status || '').toLowerCase() === 'cancelled';
                  const pay = PAYMENT_BADGE(order);
                  const method = PAYMENT_METHOD(order);
                  const ful = FULFILL_BADGE(order);
                  const del = DELIVERY_LABEL(order);
                  const qty = qtyOf(order);
                  const strike = cancelled ? { textDecoration: 'line-through' } : undefined;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => window.location.assign(`/admin/orders/${order.id}`)}
                      className="cursor-pointer"
                      style={cancelled ? { color: 'var(--sp-text-subdued)' } : undefined}
                    >
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="sp-check" checked={selected.has(order.id)} onChange={() => toggleOne(order.id)} aria-label={`Select order ${order.id}`} />
                      </td>
                      <td className="font-semibold whitespace-nowrap" style={strike}>#{order.id}</td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--sp-text-secondary)' }}>{fmtDateTime(order.createdAt)}</td>
                      <td className="whitespace-nowrap truncate max-w-[220px]" style={{ color: 'var(--sp-text-secondary)' }}>{order.customerEmail}</td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--sp-text-secondary)' }}>
                        <span className="inline-flex items-center gap-1.5"><Store size={13} className="opacity-60" />Online Store</span>
                      </td>
                      <td className="text-right font-semibold whitespace-nowrap" style={strike}>AED {Number(order.totalAmount).toFixed(2)}</td>
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`sp-badge ${pay.cls}`}><span className="dot" />{pay.label}</span>
                          {method && <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--sp-text-subdued)' }}>via {method}</span>}
                        </div>
                      </td>
                      <td><span className={`sp-badge ${ful.cls}`}><span className="dot" />{ful.label}</span></td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--sp-text-secondary)' }}>{qty} item{qty !== 1 ? 's' : ''}</td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--sp-text-secondary)' }}>{del || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Package size={32} style={{ color: 'var(--sp-text-subdued)' }} />
              <p className="text-[13px]" style={{ color: 'var(--sp-text-subdued)' }}>No orders found</p>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--sp-border)' }}>
            <p className="text-[12px]" style={{ color: 'var(--sp-text-subdued)' }}>
              Showing {filteredOrders.length} of {allOrders.totalCount || 0}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="sp-btn sp-btn-secondary px-2 disabled:opacity-40"><ChevronLeft size={15} /></button>
              <span className="text-[13px] font-medium px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="sp-btn sp-btn-secondary px-2 disabled:opacity-40"><ChevronRight size={15} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
