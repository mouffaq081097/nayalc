'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { AlertCircle, BellRing, ClipboardList, PackageCheck, RefreshCw } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { EmptyState } from '../_components/IndexToolbar';
import { fmtDate } from '../users/_components/customerAdmin';
import { formatShipDate } from '@/lib/shipping';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

const fmtAed = (value) => `AED ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAYMENT = { card: 'Card', tabby: 'Tabby', cashOnDelivery: 'Cash on delivery' };

const StatCell = ({ label, value, hint, first }) => (
  <div className="px-5 py-4 flex-[1_0_auto]" style={first ? undefined : { borderLeft: '1px solid var(--sp-border)' }}>
    <p className="text-[12px] mb-2 whitespace-nowrap"><span className="sp-stat-label">{label}</span></p>
    <p className="text-[20px] font-semibold leading-none whitespace-nowrap" style={text}>{value}</p>
    <p className="text-[12px] mt-2 whitespace-nowrap" style={subdued}>{hint || ' '}</p>
  </div>
);

const SectionCard = ({ title, hint, children }) => (
  <div className="sp-card overflow-hidden">
    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
      <h2 className="sp-section-title">{title}</h2>
      {hint && <p className="text-[12px] mt-0.5" style={subdued}>{hint}</p>}
    </div>
    {children}
  </div>
);

const promiseBadge = (isLate) => isLate
  ? <span className="sp-badge sp-badge-critical">Late</span>
  : <span className="sp-badge sp-badge-info">On time</span>;

export default function BackordersPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [allocating, setAllocating] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/backorders', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Backorders could not be loaded.');
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allocate = async (productId) => {
    setAllocating(productId);
    try {
      const res = await fetch('/api/admin/backorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Could not allocate stock.');
      toast.success(json.allocated
        ? `${json.allocated} unit${json.allocated === 1 ? '' : 's'} allocated${json.released.length ? ` · ${json.released.length} order${json.released.length === 1 ? '' : 's'} ready to ship` : ''}`
        : 'No shelf stock to allocate. Add stock to the product first.');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAllocating(null);
    }
  };

  if (!data && !error) return <PageLoader />;

  const products = data?.products || [];
  const orders = data?.orders || [];
  const enabled = data?.enabled || [];
  const waiting = data?.waiting || [];
  const unitsOwed = products.reduce((sum, p) => sum + p.owed, 0);
  const lateOrders = orders.filter(o => o.is_late).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Backorders</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>Pre-ordered units we owe customers, and the orders waiting on them</p>
        </div>
        <button type="button" onClick={load} disabled={refreshing} className="sp-btn sp-btn-secondary self-start sm:self-auto">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {data && (
        <>
          <div className="sp-card overflow-hidden">
            <div className="flex overflow-x-auto no-scrollbar">
              <StatCell first label="Units owed" value={unitsOwed} hint={`across ${products.length} product${products.length === 1 ? '' : 's'}`} />
              <StatCell label="Orders waiting" value={orders.length} hint="held under Awaiting stock" />
              <StatCell label="Past promised date" value={lateOrders} hint={lateOrders ? 'customers told a new date' : 'all on time'} />
              <StatCell label="Products taking pre-orders" value={enabled.length} hint="switched on in the product editor" />
            </div>
            <p className="px-5 py-2 text-[12px]" style={{ ...subdued, borderTop: '1px solid var(--sp-border)', background: 'var(--sp-surface-sub)' }}>
              When stock arrives, set the product&apos;s stock in the editor. It goes to the oldest orders first, and any order that has everything is released for shipping and the customer is emailed.
            </p>
          </div>

          <SectionCard title="To order from suppliers" hint="Units owed per product — your purchase list">
            {products.length === 0 ? (
              <EmptyState icon={PackageCheck} title="Nothing owed" description="No customer is waiting for stock right now." />
            ) : (
              <div className="overflow-x-auto">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Units owed</th>
                      <th className="text-right">Orders</th>
                      <th>Oldest order</th>
                      <th>Earliest promise</th>
                      <th className="text-right">On shelf</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td className="max-w-[300px]">
                          <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline" style={text}>{p.name}</Link>
                          {p.brand && <span className="block text-[12px]" style={subdued}>{p.brand}</span>}
                        </td>
                        <td className="text-right font-semibold tabular-nums" style={text}>{p.owed}</td>
                        <td className="text-right tabular-nums" style={secondary}>{p.order_count}</td>
                        <td className="whitespace-nowrap" style={secondary}>{fmtDate(p.oldest_order_at)}</td>
                        <td className="whitespace-nowrap">
                          <span className="mr-2" style={secondary}>{formatShipDate(p.earliest_promise) || '—'}</span>
                          {promiseBadge(p.is_late)}
                        </td>
                        <td className="text-right tabular-nums" style={secondary}>{p.stock_quantity}</td>
                        <td className="text-right">
                          {p.stock_quantity > 0 && (
                            <button type="button" onClick={() => allocate(p.id)} disabled={allocating === p.id} className="sp-btn sp-btn-secondary">
                              {allocating === p.id ? 'Allocating…' : 'Allocate stock'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Orders awaiting stock" hint="Shipping is blocked until every unit is in. Customers can cancel these from their account for a full refund.">
            {orders.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No orders waiting" description="Pre-orders appear here until their stock arrives." />
            ) : (
              <div className="overflow-x-auto">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Waiting for</th>
                      <th>Ships by</th>
                      <th>Payment</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td className="whitespace-nowrap">
                          <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline" style={text}>#{o.id}</Link>
                          <span className="block text-[12px]" style={subdued}>{fmtDate(o.created_at)}</span>
                        </td>
                        <td style={secondary}>{o.customer_name}</td>
                        <td className="max-w-[320px] text-[13px]" style={secondary}>
                          {(o.items || []).filter(i => i.owed > 0).map(i => `${i.owed} × ${i.name}`).join(', ')}
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="mr-2" style={secondary}>{formatShipDate(o.promised_ship_by) || '—'}</span>
                          {promiseBadge(o.is_late)}
                        </td>
                        <td className="whitespace-nowrap" style={secondary}>{PAYMENT[o.payment_method] || o.payment_method}</td>
                        <td className="text-right tabular-nums" style={text}>{fmtAed(o.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Waiting for restock" hint="Shoppers who asked to be emailed when a sold-out product is back. They're emailed automatically when its stock goes up.">
            {waiting.length === 0 ? (
              <EmptyState icon={BellRing} title="Nobody is waiting" description="When a product sells out, shoppers can leave their email on its page." />
            ) : (
              <div className="overflow-x-auto">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">People waiting</th>
                      <th className="text-right">On shelf</th>
                      <th>Waiting since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waiting.map(p => (
                      <tr key={p.id}>
                        <td><Link href={`/admin/products/${p.id}`} className="font-medium hover:underline" style={text}>{p.name}</Link></td>
                        <td className="text-right tabular-nums font-semibold" style={text}>{p.waiting}</td>
                        <td className="text-right tabular-nums" style={secondary}>{p.stock_quantity}</td>
                        <td className="whitespace-nowrap" style={secondary}>{fmtDate(p.since)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Products taking pre-orders" hint="Turn pre-orders on or off, and set the lead time and limit, in each product's editor">
            {enabled.length === 0 ? (
              <EmptyState icon={PackageCheck} title="No products take pre-orders" description="Open a product and switch on “Allow pre-orders when out of stock”." />
            ) : (
              <div className="overflow-x-auto">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">On shelf</th>
                      <th className="text-right">Owed</th>
                      <th className="text-right">Limit</th>
                      <th className="text-right">Lead time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enabled.map(p => (
                      <tr key={p.id}>
                        <td><Link href={`/admin/products/${p.id}`} className="font-medium hover:underline" style={text}>{p.name}</Link></td>
                        <td className="text-right tabular-nums" style={secondary}>{p.stock_quantity}</td>
                        <td className="text-right tabular-nums" style={secondary}>{p.owed}</td>
                        <td className="text-right tabular-nums" style={secondary}>{p.backorder_limit}</td>
                        <td className="text-right whitespace-nowrap" style={secondary}>{p.backorder_lead_days} working days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
