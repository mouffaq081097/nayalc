'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import {
  Package, Search, ChevronLeft, ChevronRight,
  RotateCcw, User, MapPin, AlertCircle, Loader2, CheckCircle, Download,
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

const STATUS_BADGE = {
  pending:    'sp-badge-warning',
  processing: 'sp-badge-info',
  shipped:    'sp-badge-info',
  delivered:  'sp-badge-success',
  cancelled:  'sp-badge-critical',
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
        <div className="flex flex-wrap items-center divide-x" style={{ borderColor: 'var(--sp-border)' }}>
          <div className="px-5 py-3 min-w-[110px]"><p className="text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>Total orders</p><p className="text-[18px] font-semibold">{totalCount}</p></div>
          <div className="px-5 py-3 min-w-[110px]"><p className="text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>Pending</p><p className="text-[18px] font-semibold">{pendingCount}</p></div>
          <Link href="/admin/orders/delivered" className="px-5 py-3 min-w-[110px] hover:bg-[#fafafa]"><p className="text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>Delivered</p><p className="text-[18px] font-semibold">{deliveredOrders.totalCount}</p></Link>
          <Link href="/admin/orders/cancelled" className="px-5 py-3 min-w-[110px] hover:bg-[#fafafa]"><p className="text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>Cancelled</p><p className="text-[18px] font-semibold">{cancelledOrders.totalCount}</p></Link>
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
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--sp-text-subdued)' }} />
              <input
                type="text" placeholder="Search by order ID or email…"
                className="sp-input pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="sp-input w-auto">
              <option value="All">All orders</option>
              {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Order</th><th>Date</th><th>Customer</th><th>Status</th><th>Payment</th><th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} onClick={() => window.location.assign(`/admin/orders/${order.id}`)} className="cursor-pointer">
                    <td className="font-semibold">#{order.id}</td>
                    <td style={{ color: 'var(--sp-text-secondary)' }}>
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ color: 'var(--sp-text-secondary)' }}>{order.customerEmail}</td>
                    <td>
                      <span className={`sp-badge ${STATUS_BADGE[order.status.toLowerCase()] || 'sp-badge-neutral'}`}>
                        <span className="dot" />{order.status}
                      </span>
                    </td>
                    <td>
                      <span className="sp-badge sp-badge-neutral">{order.paymentMethod === 'card' ? 'Card' : 'Cash'}</span>
                    </td>
                    <td className="text-right font-semibold">AED {Number(order.totalAmount).toFixed(2)}</td>
                  </tr>
                ))}
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
