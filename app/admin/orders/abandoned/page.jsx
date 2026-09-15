'use client';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Mail, MessageCircle, Phone, RefreshCw, ShoppingCart,
} from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { EmptyState, SearchBox, ViewPill } from '../../_components/IndexToolbar';
import { internationalPhone } from '../../_components/phone';

const STATUS_BADGE = {
  abandoned:   { label: 'Not recovered', cls: 'sp-badge-warning' },
  in_progress: { label: 'In progress',   cls: 'sp-badge-info' },
  recovered:   { label: 'Recovered',     cls: 'sp-badge-success' },
};
const STEP_LABEL = { address: 'Delivery address', payment: 'Payment' };
const METHOD_LABEL = { card: 'Card', tabby: 'Tabby', cashOnDelivery: 'Cash on delivery' };

// Views in the card's switcher: the first four filter checkouts, "Saved carts" swaps the table
const CHECKOUT_VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'abandoned', label: 'Not recovered' },
  { id: 'recovered', label: 'Recovered' },
  { id: 'in_progress', label: 'In progress' },
];

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

const fmtAed = (value) => `AED ${Number(value || 0).toFixed(2)}`;
const fmtDateTime = (value) => {
  const d = new Date(value);
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${date} at ${time}`;
};
const timeAgo = (value) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / (60 * 24))}d ago`;
};
const customerName = (c) => [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;
const itemCount = (items = []) => items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
const matchesSearch = (c, term) => !term || `${customerName(c)} ${c.email}`.toLowerCase().includes(term.trim().toLowerCase());

const StatCell = ({ label, value, hint, first }) => (
  <div className="px-5 py-4 flex-1 min-w-[190px]" style={first ? undefined : { borderLeft: '1px solid var(--sp-border)' }}>
    <p className="text-[12px] mb-2 whitespace-nowrap"><span className="sp-stat-label">{label}</span></p>
    <p className="text-[20px] font-semibold leading-none whitespace-nowrap" style={text}>{value}</p>
    <p className="text-[12px] mt-2 whitespace-nowrap" style={subdued}>{hint}</p>
  </div>
);

const ItemsList = ({ items }) => (
  <div>
    {items.map(item => (
      <div key={item.productId} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #f1f1f1' }}>
        <div className="w-10 h-10 rounded-lg bg-white shrink-0 overflow-hidden flex items-center justify-center" style={{ border: '1px solid var(--sp-border)' }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
            : <ShoppingCart size={14} style={subdued} />}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/product/${item.productId}`} target="_blank" className="text-[13px] font-medium truncate block hover:underline" style={text}>
            {item.name}
          </Link>
          <p className="text-[12px]" style={subdued}>{item.quantity} × {fmtAed(item.price)}</p>
        </div>
        <p className="text-[13px] font-medium whitespace-nowrap" style={text}>{fmtAed(Number(item.price) * Number(item.quantity))}</p>
      </div>
    ))}
  </div>
);

const ContactCard = ({ customer, children }) => {
  const phone = internationalPhone(customer.customer_phone);
  return (
    <div className="sp-card sp-card-pad space-y-3">
      <h3 className="sp-section-title">Customer</h3>
      <div className="text-[13px] space-y-1">
        <p className="font-medium" style={text}>{customerName(customer)}</p>
        <p className="break-all" style={secondary}>{customer.email}</p>
        {customer.customer_phone && <p style={secondary}>{customer.customer_phone}</p>}
        {customer.city && <p style={secondary}>{customer.city}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`mailto:${customer.email}`} className="sp-btn sp-btn-secondary"><Mail size={14} />Email</a>
        {phone && <a href={`tel:+${phone}`} className="sp-btn sp-btn-secondary"><Phone size={14} />Call</a>}
        {phone && (
          <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">
            <MessageCircle size={14} />WhatsApp
          </a>
        )}
      </div>
      {children}
    </div>
  );
};

const ExpandIcon = ({ open }) => (open ? <ChevronDown size={15} /> : <ChevronRight size={15} />);

const AbandonedCheckoutsPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('all'); // a CHECKOUT_VIEWS id, or 'carts'
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/abandoned-checkouts?days=${days}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load abandoned checkouts');
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const list = data?.checkouts || [];
    return {
      all: list.length,
      abandoned: list.filter(c => c.status === 'abandoned').length,
      recovered: list.filter(c => c.status === 'recovered').length,
      in_progress: list.filter(c => c.status === 'in_progress').length,
    };
  }, [data]);

  const stats = useMemo(() => {
    const abandoned = (data?.checkouts || []).filter(c => c.status === 'abandoned');
    const closed = counts.abandoned + counts.recovered;
    return {
      value: abandoned.reduce((sum, c) => sum + Number(c.total ?? c.subtotal ?? 0), 0),
      recoveryRate: closed ? Math.round((counts.recovered / closed) * 100) : 0,
    };
  }, [data, counts]);

  const checkouts = useMemo(() => (data?.checkouts || [])
    .filter(c => (view === 'all' || c.status === view) && matchesSearch(c, search)),
  [data, view, search]);

  const savedCarts = useMemo(() => (data?.savedCarts || []).filter(c => matchesSearch(c, search)), [data, search]);

  if (!data && !error) return <PageLoader />;

  const abandonedAfter = data?.abandonedAfterMinutes ?? 60;
  const showingCarts = view === 'carts';
  const viewLabel = CHECKOUT_VIEWS.find(v => v.id === view)?.label;
  const selectView = (id) => { setView(id); setExpanded(null); };
  const toggle = (key) => setExpanded(prev => (prev === key ? null : key));

  const checkoutsEmpty = counts.all === 0
    ? {
      title: 'No abandoned checkouts yet',
      description: `A checkout appears here when a signed-in customer reaches checkout and leaves for more than ${abandonedAfter} minutes without placing an order.`,
    }
    : {
      title: search ? 'No checkouts match your search' : `No ${viewLabel.toLowerCase()} checkouts`,
      description: search ? 'Try a different name or email address.' : 'Checkouts with this status will appear here.',
    };

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-0.5 text-[13px] font-medium mb-1 hover:underline" style={secondary}>
            <ChevronLeft size={15} />Orders
          </Link>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Abandoned checkouts</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="sp-input cursor-pointer"
            style={{ width: 'auto', height: 34, paddingTop: 0, paddingBottom: 0, paddingLeft: 10, paddingRight: 8, fontSize: 13 }}
            aria-label="Date range"
          >
            {[7, 30, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <button onClick={load} disabled={refreshing} className="sp-btn sp-btn-secondary" style={{ height: 34 }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* Stat strip */}
      <div className="sp-card overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar">
          <StatCell first label="Abandoned checkouts" value={counts.abandoned} hint={`Last ${data?.days ?? days} days`} />
          <StatCell label="Value left in checkout" value={fmtAed(stats.value)} hint="From checkouts not recovered" />
          <StatCell label="Recovered" value={counts.recovered} hint={`${stats.recoveryRate}% recovery rate`} />
          <StatCell label="In progress" value={counts.in_progress} hint={`Active in the last ${abandonedAfter} min`} />
        </div>
      </div>

      <div className="sp-card overflow-hidden">
        {/* View switcher + search */}
        <div className="px-3 py-2 flex flex-col md:flex-row md:items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Views">
            {CHECKOUT_VIEWS.map(v => (
              <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => selectView(v.id)}>
                {v.label}
              </ViewPill>
            ))}
            <span className="shrink-0 w-px h-5 mx-1.5" style={{ background: 'var(--sp-border)' }} aria-hidden />
            <ViewPill active={showingCarts} count={data?.savedCarts?.length ?? 0} onClick={() => selectView('carts')}>
              Saved carts
            </ViewPill>
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder={showingCarts ? 'Search saved carts' : 'Search by customer or email'} />
        </div>

        {!showingCarts && (
          checkouts.length === 0 ? <EmptyState icon={ShoppingCart} {...checkoutsEmpty} /> : (
            <div className="overflow-x-auto">
              <table className="sp-table sp-table-orders">
                <thead>
                  <tr>
                    <th className="w-[36px]" aria-label="Expand" />
                    <th>Checkout</th>
                    <th>Last activity</th>
                    <th>Customer</th>
                    <th>Reached</th>
                    <th>Items</th>
                    <th>Recovery status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {checkouts.map(c => {
                    const key = `checkout-${c.id}`;
                    const open = expanded === key;
                    const badge = STATUS_BADGE[c.status] || STATUS_BADGE.abandoned;
                    const count = itemCount(c.items);
                    return (
                      <Fragment key={key}>
                        <tr className="cursor-pointer" onClick={() => toggle(key)} aria-expanded={open}>
                          <td style={subdued}><ExpandIcon open={open} /></td>
                          <td className="font-semibold whitespace-nowrap">#{c.id}</td>
                          <td className="whitespace-nowrap" style={secondary}>
                            {fmtDateTime(c.updated_at)}
                            <span className="block text-[12px]" style={subdued}>{timeAgo(c.updated_at)}</span>
                          </td>
                          <td className="whitespace-nowrap">
                            <span className="font-medium">{customerName(c)}</span>
                            <span className="block text-[12px] truncate max-w-[220px]" style={subdued}>{c.email}</span>
                          </td>
                          <td className="whitespace-nowrap" style={secondary}>
                            {STEP_LABEL[c.step] || c.step}
                            {c.step === 'payment' && c.payment_method && (
                              <span className="block text-[12px]" style={subdued}>{METHOD_LABEL[c.payment_method] || c.payment_method}</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap" style={secondary}>{count} item{count !== 1 ? 's' : ''}</td>
                          <td className="whitespace-nowrap"><span className={`sp-badge ${badge.cls}`}><span className="dot" />{badge.label}</span></td>
                          <td className="text-right font-semibold whitespace-nowrap">{fmtAed(c.total ?? c.subtotal)}</td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={8} style={{ background: 'var(--sp-surface-sub)', padding: 12 }}>
                              <div className="grid gap-3 md:grid-cols-[1fr_300px]">
                                <div className="sp-card sp-card-pad">
                                  <h3 className="sp-section-title mb-1">Cart</h3>
                                  <ItemsList items={c.items} />
                                  <div className="pt-3 space-y-1.5 text-[13px]">
                                    <div className="flex justify-between" style={secondary}><span>Subtotal</span><span>{fmtAed(c.subtotal)}</span></div>
                                    {c.total != null && (
                                      <div className="flex justify-between gap-3 font-semibold" style={text}>
                                        <span>Checkout total <span className="font-normal" style={subdued}>incl. shipping, VAT and discounts</span></span>
                                        <span className="whitespace-nowrap">{fmtAed(c.total)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ContactCard customer={c}>
                                  <div className="text-[12px] pt-3 space-y-1" style={{ ...subdued, borderTop: '1px solid #f1f1f1' }}>
                                    <p>Started {fmtDateTime(c.started_at)}</p>
                                    <p>Last active {fmtDateTime(c.updated_at)}</p>
                                    {c.payment_method && <p>Payment method: {METHOD_LABEL[c.payment_method] || c.payment_method}</p>}
                                  </div>
                                </ContactCard>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {showingCarts && (
          savedCarts.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={search ? 'No carts match your search' : 'No saved carts'}
              description={search ? 'Try a different name or email address.' : "Signed-in customers with items in their cart who haven't started a checkout in the last 30 days appear here."}
            />
          ) : (
            <>
              <p className="px-4 py-2.5 text-[12px]" style={{ ...subdued, background: 'var(--sp-surface-sub)', borderBottom: '1px solid var(--sp-border)' }}>
                Items customers added to their cart but never took to checkout. The cart doesn&apos;t record when items were added, so these have no date.
              </p>
              <div className="overflow-x-auto">
                <table className="sp-table sp-table-orders">
                  <thead>
                    <tr>
                      <th className="w-[36px]" aria-label="Expand" />
                      <th>Customer</th>
                      <th>Items</th>
                      <th className="text-right">Cart value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedCarts.map(cart => {
                      const key = `cart-${cart.user_id}`;
                      const open = expanded === key;
                      const count = itemCount(cart.items);
                      return (
                        <Fragment key={key}>
                          <tr className="cursor-pointer" onClick={() => toggle(key)} aria-expanded={open}>
                            <td style={subdued}><ExpandIcon open={open} /></td>
                            <td className="whitespace-nowrap">
                              <span className="font-medium">{customerName(cart)}</span>
                              <span className="block text-[12px] truncate max-w-[260px]" style={subdued}>{cart.email}</span>
                            </td>
                            <td className="whitespace-nowrap" style={secondary}>{count} item{count !== 1 ? 's' : ''}</td>
                            <td className="text-right font-semibold whitespace-nowrap">{fmtAed(cart.subtotal)}</td>
                          </tr>
                          {open && (
                            <tr>
                              <td colSpan={4} style={{ background: 'var(--sp-surface-sub)', padding: 12 }}>
                                <div className="grid gap-3 md:grid-cols-[1fr_300px]">
                                  <div className="sp-card sp-card-pad">
                                    <h3 className="sp-section-title mb-1">Cart</h3>
                                    <ItemsList items={cart.items} />
                                    <div className="pt-3 flex justify-between text-[13px] font-semibold" style={text}>
                                      <span>Cart value</span><span>{fmtAed(cart.subtotal)}</span>
                                    </div>
                                  </div>
                                  <ContactCard customer={cart} />
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default AbandonedCheckoutsPage;
