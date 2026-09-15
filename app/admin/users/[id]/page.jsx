'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowDownLeft, ArrowLeft, ArrowUpRight, Mail, MessageCircle, MoreHorizontal, Phone,
  ShieldCheck, ShieldOff, ShoppingBag, UserCheck, UserX, XCircle,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Card, secondary, subdued, text } from '../../_components/EditorFields';
import { Thumb } from '../../_components/ImageSlot';
import { internationalPhone } from '../../_components/phone';
import { fmtAed } from '../../products/_components/productAdmin';
import {
  CustomerAvatar, changeAdminAccess, changeSuspension, customerName, fmtDate, orderStatusBadge, timeAgo,
} from '../_components/customerAdmin';

const METHOD_LABEL = { card: 'Card', tabby: 'Tabby', cashOnDelivery: 'Cash on delivery', cash: 'Cash on delivery' };

const StatCell = ({ label, value, hint, first }) => (
  <div className="px-5 py-4 flex-1 min-w-[180px]" style={first ? undefined : { borderLeft: '1px solid var(--sp-border)' }}>
    <p className="text-[12px] mb-2 whitespace-nowrap"><span className="sp-stat-label">{label}</span></p>
    <p className="text-[20px] font-semibold leading-none whitespace-nowrap" style={text}>{value}</p>
    <p className="text-[12px] mt-2 whitespace-nowrap" style={subdued}>{hint || ' '}</p>
  </div>
);

const Row = ({ label, children }) => (
  <div className="flex items-start justify-between gap-3 text-[13px]">
    <span style={secondary}>{label}</span>
    <span className="text-right" style={text}>{children}</span>
  </div>
);

const addressLines = (address) => [
  address.address_line1 || address.shipping_address,
  address.address_line2,
  [address.city, address.state !== address.city ? address.state : null].filter(Boolean).join(', '),
  [address.country, address.zip_code && address.zip_code !== '0000' ? address.zip_code : null].filter(Boolean).join(' · '),
].filter(Boolean);

export default function CustomerPage() {
  const { id } = useParams();
  const { fetchWithAuth } = useAppContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Customer not found');
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <XCircle size={40} style={subdued} />
        <p className="text-[14px] font-medium" style={text}>This customer couldn&apos;t be loaded: {error}</p>
        <Link href="/admin/users" className="sp-btn sp-btn-secondary">Back to customers</Link>
      </div>
    );
  }
  if (!data) return <PageLoader />;

  const { customer, stats, orders, addresses, loyalty, cart } = data;
  const name = customerName(customer);
  const defaultAddress = addresses[0];
  const location = defaultAddress ? [defaultAddress.city, defaultAddress.country].filter(Boolean).join(', ') : '';
  const phone = customer.phone_number || addresses.find(a => a.customer_phone)?.customer_phone;
  const intlPhone = internationalPhone(phone);
  const cartValue = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const setCustomer = (changes) => setData(prev => ({ ...prev, customer: { ...prev.customer, ...changes } }));
  const toggleAdmin = async () => {
    if (await changeAdminAccess(fetchWithAuth, customer)) setCustomer({ is_admin: !customer.is_admin });
  };
  const toggleSuspension = async () => {
    if (await changeSuspension(fetchWithAuth, customer)) setCustomer({ is_suspended: !customer.is_suspended });
  };

  return (
    <div className="max-w-[1080px] mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <Link
          href="/admin/users"
          aria-label="Back to customers"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e3e3e3] transition-colors"
          style={secondary}
        >
          <ArrowLeft size={18} />
        </Link>
        <CustomerAvatar customer={customer} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[20px] font-semibold leading-tight truncate" style={text}>{name}</h1>
            {customer.is_admin && <span className="sp-badge sp-badge-info">Admin</span>}
            {customer.is_suspended && <span className="sp-badge sp-badge-critical">Suspended</span>}
          </div>
          <p className="text-[13px] mt-0.5" style={subdued}>
            Customer since {fmtDate(customer.created_at)}{location ? ` · ${location}` : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href={`mailto:${customer.email}`} className="sp-btn sp-btn-secondary"><Mail size={14} />Email</a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="sp-btn sp-btn-secondary px-2.5" aria-label="More actions"><MoreHorizontal size={16} /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[210px]">
              <DropdownMenuItem onClick={toggleAdmin} className="rounded-md px-3 py-2 text-[13px] gap-2">
                {customer.is_admin ? <><ShieldOff size={14} />Remove admin access</> : <><ShieldCheck size={14} />Give admin access</>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleSuspension}
                className={`rounded-md px-3 py-2 text-[13px] gap-2 ${customer.is_suspended ? '' : 'text-red-600 focus:bg-red-50'}`}
              >
                {customer.is_suspended ? <><UserCheck size={14} />Reinstate account</> : <><UserX size={14} />Suspend account</>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {customer.is_suspended && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl text-[13px]" style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#8e0b21' }}>
          <UserX size={16} className="shrink-0" />
          <span className="flex-1 min-w-[200px]">This account is suspended, so {name} can&apos;t sign in. Their orders and details are kept.</span>
          <button type="button" onClick={toggleSuspension} className="sp-btn sp-btn-secondary">Reinstate account</button>
        </div>
      )}

      {/* Stat strip */}
      <div className="sp-card overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar">
          <StatCell first label="Amount spent" value={fmtAed(stats.total_spent)} hint="Excluding cancelled orders" />
          <StatCell
            label="Orders"
            value={stats.orders_count}
            hint={stats.cancelled_count ? `Plus ${stats.cancelled_count} cancelled` : undefined}
          />
          <StatCell label="Average order" value={stats.orders_count ? fmtAed(stats.total_spent / stats.orders_count) : '—'} />
          <StatCell
            label="Last order"
            value={stats.last_order_at ? timeAgo(stats.last_order_at) : 'No orders yet'}
            hint={stats.last_order_at ? fmtDate(stats.last_order_at) : undefined}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">

        {/* ── Main column ── */}
        <div className="space-y-4 min-w-0">
          <Card
            title="Orders"
            description={orders.length > 0 ? `${orders.length === 25 ? 'The latest 25 orders' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}, including cancelled` : undefined}
          >
            {orders.length === 0 ? (
              <div className="py-8 px-4 flex flex-col items-center text-center rounded-lg" style={{ background: 'var(--sp-surface-sub)' }}>
                <ShoppingBag size={22} style={subdued} />
                <p className="text-[13px] font-medium mt-2" style={text}>No orders yet</p>
                <p className="text-[12px] mt-0.5" style={subdued}>Orders {name} places will show up here.</p>
              </div>
            ) : (
              <ul>
                {orders.map((order, index) => {
                  const badge = orderStatusBadge(order.order_status);
                  const cancelled = badge.label === 'Cancelled';
                  return (
                    <li key={`${order.id}-${order.order_status}`} style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                      <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-[#f7f7f7] transition-colors">
                        <div className="min-w-[96px]">
                          <p className="text-[13px] font-semibold" style={text}>#{order.id}</p>
                          <p className="text-[12px]" style={subdued}>{fmtDate(order.created_at)}</p>
                        </div>
                        <span className={`sp-badge ${badge.cls}`}>{badge.label}</span>
                        <span className="hidden sm:inline text-[12px] flex-1 truncate" style={subdued}>
                          {order.items} item{order.items !== 1 ? 's' : ''}{METHOD_LABEL[order.payment_method] ? ` · ${METHOD_LABEL[order.payment_method]}` : ''}
                        </span>
                        <span
                          className="ml-auto text-[13px] font-semibold whitespace-nowrap"
                          style={cancelled ? { ...subdued, textDecoration: 'line-through' } : text}
                        >
                          {fmtAed(order.total_amount)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Loyalty">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Points', value: Number(customer.loyalty_points).toLocaleString() },
                { label: 'Tier', value: customer.loyalty_tier || '—' },
                { label: 'Lifetime spend', value: fmtAed(customer.lifetime_spend) },
              ].map(item => (
                <div key={item.label} className="rounded-lg px-3 py-2.5" style={{ background: 'var(--sp-surface-sub)' }}>
                  <p className="text-[12px]" style={subdued}>{item.label}</p>
                  <p className="text-[15px] font-semibold mt-0.5 truncate" style={text}>{item.value}</p>
                </div>
              ))}
            </div>
            {loyalty.length === 0 ? (
              <p className="text-[13px] mt-4" style={subdued}>No points activity yet.</p>
            ) : (
              <ul className="mt-3">
                {loyalty.map((tx, index) => {
                  const earned = tx.points > 0;
                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-2.5" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: earned ? '#cdf0d8' : '#ffd6d9', color: earned ? '#0c5132' : '#8e0b21' }}
                      >
                        {earned ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] truncate" style={text}>{tx.description || tx.type}</p>
                        <p className="text-[12px]" style={subdued}>{fmtDate(tx.created_at)}{tx.type === 'pending' ? ' · Pending until delivery' : ''}</p>
                      </div>
                      <span className="text-[13px] font-semibold whitespace-nowrap" style={{ color: earned ? '#0c5132' : '#8e0b21' }}>
                        {earned ? '+' : ''}{tx.points} pts
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {cart.length > 0 && (
            <Card
              title="Saved cart"
              description={`${cart.length} product${cart.length !== 1 ? 's' : ''} waiting in their cart · ${fmtAed(cartValue)}`}
              action={<Link href="/admin/orders/abandoned" className="text-[13px] sp-link whitespace-nowrap">Abandoned checkouts</Link>}
            >
              <ul>
                {cart.map((item, index) => (
                  <li key={item.productId} className="flex items-center gap-3 py-2.5" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                    <Thumb url={item.imageUrl} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={text}>{item.name}</p>
                      <p className="text-[12px]" style={subdued}>{item.quantity} × {fmtAed(item.price)}</p>
                    </div>
                    <span className="text-[13px] font-medium whitespace-nowrap" style={text}>{fmtAed(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* ── Side column ── */}
        <div className="space-y-4 lg:sticky lg:top-0">
          <Card title="Contact">
            <div className="space-y-1 text-[13px]">
              <a href={`mailto:${customer.email}`} className="block break-all sp-link">{customer.email}</a>
              <p style={phone ? text : subdued}>{phone || 'No phone number'}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <a href={`mailto:${customer.email}`} className="sp-btn sp-btn-secondary"><Mail size={14} />Email</a>
              {intlPhone && <a href={`tel:+${intlPhone}`} className="sp-btn sp-btn-secondary"><Phone size={14} />Call</a>}
              {intlPhone && (
                <a href={`https://wa.me/${intlPhone}`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">
                  <MessageCircle size={14} />WhatsApp
                </a>
              )}
            </div>
          </Card>

          <Card title="Addresses" description={addresses.length > 1 ? `${addresses.length} saved addresses` : undefined}>
            {addresses.length === 0 ? (
              <p className="text-[13px]" style={subdued}>No saved addresses.</p>
            ) : (
              <ul className="space-y-3">
                {addresses.map((address, index) => (
                  <li key={address.id} className={index ? 'pt-3' : undefined} style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] font-medium truncate" style={text}>{address.address_label || 'Address'}</p>
                      {address.is_default && <span className="sp-badge" style={{ padding: '2px 6px', fontSize: 11 }}>Default</span>}
                    </div>
                    {addressLines(address).map((line, i) => (
                      <p key={i} className="text-[13px] leading-snug" style={secondary}>{line}</p>
                    ))}
                    {address.customer_phone && <p className="text-[12px] mt-1" style={subdued}>{address.customer_phone}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Account">
            <div className="space-y-2.5">
              <Row label="Role">{customer.is_admin ? 'Admin' : 'Customer'}</Row>
              <Row label="Status">
                <span style={{ color: customer.is_suspended ? '#8e0b21' : '#0c5132' }}>{customer.is_suspended ? 'Suspended' : 'Active'}</span>
              </Row>
              <Row label="Email verified">{customer.email_verified ? 'Yes' : 'No'}</Row>
              <Row label="Joined">{fmtDate(customer.created_at)}</Row>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop: '1px solid #f1f1f1' }}>
              <button type="button" onClick={toggleAdmin} className="sp-btn sp-btn-secondary">
                {customer.is_admin ? <><ShieldOff size={14} />Remove admin</> : <><ShieldCheck size={14} />Make admin</>}
              </button>
              <button type="button" onClick={toggleSuspension} className={`sp-btn sp-btn-secondary ${customer.is_suspended ? '' : 'text-red-600'}`}>
                {customer.is_suspended ? <><UserCheck size={14} />Reinstate</> : <><UserX size={14} />Suspend</>}
              </button>
            </div>
            <p className="text-[12px] mt-2" style={subdued}>Role and suspension changes apply the next time they sign in.</p>
          </Card>

        </div>
      </div>
    </div>
  );
}
