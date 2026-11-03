'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Loader2, MapPin, Minus, Phone, Plus, Search, ShoppingCart, Trash2, User, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { calcShipping } from '@/lib/shipping';
import { calcCouponDiscount } from '@/lib/couponDiscount';
import { orderableQty, shelfStock } from '@/lib/backorderRules';
import { formatPhone, parsePhone } from '@/lib/phone';

// Admin → Orders → Create order: an order taken on the phone, WhatsApp or in person.
// The server (lib/manualOrders.js) re-checks stock, the code and every total.

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };
const fmt = (n) => `AED ${(Number(n) || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
const METHODS = [
  ['cashOnDelivery', 'Cash on delivery', 'The courier collects the total.'],
  ['bankTransfer', 'Bank transfer', 'The customer pays into the bank account.'],
];

const Notice = ({ tone = 'info', children }) => {
  const tones = {
    info: { background: '#eef4ff', border: '1px solid #c9dcff', color: '#1d3f8f' },
    success: { background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.3)', color: '#14532d' },
    warning: { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.45)', color: '#78350f' },
    error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b42318' },
  };
  return <div className="rounded-lg px-3 py-2.5 text-[13px] space-y-1" style={tones[tone]}>{children}</div>;
};

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-[13px] font-medium mb-1.5" style={secondary}>{label}{hint && <span className="font-normal" style={subdued}> · {hint}</span>}</span>
    {children}
  </label>
);

const Segmented = ({ value, options, onChange, label }) => (
  <div className="inline-flex p-0.5 rounded-lg" style={{ background: '#f1f1f1' }} role="radiogroup" aria-label={label}>
    {options.map(([key, name]) => (
      <button
        key={key}
        type="button"
        role="radio"
        aria-checked={value === key}
        onClick={() => onChange(key)}
        className="h-8 px-3 rounded-md text-[13px] font-medium cursor-pointer whitespace-nowrap"
        style={value === key ? { background: '#fff', color: 'var(--sp-text)', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' } : secondary}
      >
        {name}
      </button>
    ))}
  </div>
);

const EMPTY_CUSTOMER = { firstName: '', lastName: '', phone: '', email: '' };
const EMPTY_ADDRESS = { line1: '', line2: '', city: 'Dubai', phone: '', label: '' };

export default function CreateOrderPage() {
  const { adminProducts = [] } = useAppContext();

  // Customer
  const [mode, setMode] = useState('find'); // find | new
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState(null); // an existing account from the search
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);

  // Address
  const [addressId, setAddressId] = useState(''); // '' = new address
  const [address, setAddress] = useState(EMPTY_ADDRESS);

  // Products
  const [productQuery, setProductQuery] = useState('');
  const [items, setItems] = useState([]); // { productId, name, quantity, price, listPrice }

  // Payment and extras
  const [paymentMethod, setPaymentMethod] = useState('cashOnDelivery');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [freeShipping, setFreeShipping] = useState(false);
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    fetch('/api/coupons', { cache: 'no-store' }).then(r => (r.ok ? r.json() : [])).then(setCoupons).catch(() => {});
  }, []);

  // Customer search, a moment after typing stops
  const searchRun = useRef(0);
  useEffect(() => {
    if (mode !== 'find' || customer) return undefined;
    const q = query.trim();
    if (q.length < 2) { setResults(null); return undefined; }
    const run = ++searchRun.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/orders/manual?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (run === searchRun.current) setResults(res.ok ? data.customers : []);
      } catch {
        if (run === searchRun.current) setResults([]);
      } finally {
        if (run === searchRun.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, mode, customer]);

  const chooseCustomer = (c) => {
    setCustomer(c);
    const preferred = c.addresses.find(a => a.isDefault) || c.addresses[0];
    setAddressId(preferred ? String(preferred.id) : '');
    setAddress({ ...EMPTY_ADDRESS, phone: c.phone || '' });
  };
  const clearCustomer = () => {
    setCustomer(null); setAddressId(''); setAddress(EMPTY_ADDRESS); setResults(null);
  };
  const switchMode = (next) => {
    setMode(next); clearCustomer(); setQuery('');
    if (next === 'new') {
      const q = query.trim();
      const phone = parsePhone(q);
      setNewCustomer({ ...EMPTY_CUSTOMER, ...(phone.ok ? { phone: phone.national || q } : q.includes('@') ? { email: q } : {}) });
    }
  };

  // Products
  const productMatches = useMemo(() => {
    const q = fold(productQuery.trim());
    if (!q) return [];
    const words = q.split(/\s+/);
    return adminProducts
      .filter(p => !items.some(i => i.productId === p.id))
      .filter(p => { const hay = fold(`${p.name} ${p.brandName || p.brand || ''} ${p.id}`); return words.every(w => hay.includes(w)); })
      .slice(0, 8);
  }, [productQuery, adminProducts, items]);

  const productById = useMemo(() => new Map(adminProducts.map(p => [p.id, p])), [adminProducts]);

  const addProduct = (p) => {
    setItems(prev => [...prev, { productId: p.id, name: p.name, quantity: 1, price: Number(p.price) || 0, listPrice: Number(p.price) || 0 }]);
    setProductQuery('');
  };
  const updateItem = (productId, patch) => setItems(prev => prev.map(i => (i.productId === productId ? { ...i, ...patch } : i)));
  const removeItem = (productId) => setItems(prev => prev.filter(i => i.productId !== productId));

  // Totals — the same calculation the server makes
  const lines = items.map(i => ({ productId: i.productId, price: Number(i.price) || 0, quantity: parseInt(i.quantity, 10) || 0 }));
  const subtotal = lines.reduce((s, i) => s + i.price * i.quantity, 0);
  const quantity = lines.reduce((s, i) => s + i.quantity, 0);
  const shipping = freeShipping ? 0 : calcShipping(quantity);
  const coupon = couponCode.trim() ? coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase()) : null;
  const discount = coupon ? calcCouponDiscount(coupon, lines) : 0;
  const couponProblem = couponCode.trim()
    ? !coupon ? (coupons.length ? `There's no discount code "${couponCode.trim()}".` : null)
      : discount <= 0 ? `${coupon.code} doesn't take anything off these products.` : null
    : null;
  const total = Math.max(0, subtotal + shipping - discount);

  // Stock hints (the server has the final say)
  const stockProblems = items.map(i => {
    const p = productById.get(i.productId);
    if (!p) return null;
    const qty = parseInt(i.quantity, 10) || 0;
    if (qty > orderableQty(p)) return `Only ${orderableQty(p)} of "${i.name}" can be ordered.`;
    if (qty > shelfStock(p) && paymentMethod === 'cashOnDelivery') return `"${i.name}" would be partly a pre-order — cash on delivery isn't allowed for pre-orders.`;
    return null;
  }).filter(Boolean);

  const customerEmail = customer ? customer.email : newCustomer.email.trim();
  const newPhone = parsePhone(newCustomer.phone);
  const customerReady = customer ? true : newCustomer.firstName.trim() && newPhone.ok;
  const addressReady = addressId ? true : address.line1.trim() && address.city && (address.phone.trim() ? parsePhone(address.phone).ok : (customer ? parsePhone(customer.phone).ok : newPhone.ok));
  const itemsReady = items.length > 0 && lines.every(i => i.quantity >= 1 && i.price >= 0);
  const canCreate = customerReady && addressReady && itemsReady && !couponProblem && !saving;

  const create = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer ? { userId: customer.id } : newCustomer,
          address: addressId ? { addressId: Number(addressId) } : { ...address, phone: address.phone.trim() || (customer ? customer.phone : newCustomer.phone) },
          items: lines,
          paymentMethod,
          paymentReceived: paymentMethod === 'bankTransfer' && paymentReceived,
          couponCode: couponCode.trim() || null,
          freeShipping,
          note,
          sendEmail: sendEmail && !!customerEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'The order could not be created.');
      setCreated(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const startOver = () => {
    setCreated(null); setError(null); setMode('find'); setQuery(''); clearCustomer(); setNewCustomer(EMPTY_CUSTOMER);
    setItems([]); setCouponCode(''); setFreeShipping(false); setNote(''); setPaymentMethod('cashOnDelivery'); setPaymentReceived(false); setSendEmail(true);
  };

  if (created) {
    return (
      <div className="max-w-[640px] mx-auto space-y-4">
        <section className="sp-card sp-card-pad space-y-4 text-center">
          <CheckCircle size={36} className="mx-auto" style={{ color: '#16a34a' }} />
          <div>
            <h1 className="text-[20px] font-semibold" style={text}>Order #{created.orderId} created</h1>
            <p className="text-[13px] mt-1" style={secondary}>
              Total {fmt(created.total)}{created.customerCreated ? ' · a new customer account was made' : ''}
            </p>
          </div>
          {created.emailError && <Notice tone="warning">The confirmation email wasn’t sent: {created.emailError}. You can resend it from the order page.</Notice>}
          {created.emailSent && <Notice tone="success">The customer was emailed their order confirmation.</Notice>}
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={`/admin/orders/${created.orderId}`} className="sp-btn sp-btn-primary">View order</Link>
            <a href={`/admin/orders/${created.orderId}/packing-slip`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">Packing slip</a>
            <button type="button" onClick={startOver} className="sp-btn sp-btn-secondary"><Plus size={14} />Create another</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="sp-btn sp-btn-secondary px-2" aria-label="Back to orders"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-[20px] font-semibold" style={text}>Create order</h1>
          <p className="text-[13px]" style={secondary}>For an order taken on the phone, WhatsApp or in person.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">

          {/* Products */}
          <section className="sp-card sp-card-pad space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} style={secondary} />
              <h2 className="sp-section-title">Products</h2>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={subdued} />
              <input
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && productMatches[0]) { e.preventDefault(); addProduct(productMatches[0]); } }}
                placeholder="Search products by name or brand"
                className="sp-input w-full pl-8"
                aria-label="Search products"
              />
              {productMatches.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-lg overflow-hidden max-h-[320px] overflow-y-auto" style={{ border: '1px solid #e3e3e3', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                  {productMatches.map(p => {
                    const canOrder = orderableQty(p);
                    return (
                      <li key={p.id}>
                        <button type="button" onClick={() => addProduct(p)} disabled={canOrder < 1} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#f7f7f7] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image || '/placeholder-image.jpg'} alt="" className="w-9 h-9 rounded object-cover shrink-0" style={{ background: '#f6f5f2' }} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-medium truncate" style={text}>{p.name}</span>
                            <span className="block text-[12px]" style={subdued}>
                              {shelfStock(p)} in stock{canOrder > shelfStock(p) ? ` · ${canOrder - shelfStock(p)} on pre-order` : ''}{p.is_active === false ? ' · hidden from the store' : ''}
                            </span>
                          </span>
                          <span className="text-[13px] shrink-0" style={text}>{fmt(p.price)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-[13px] py-2" style={subdued}>No products yet — search above to add them.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: '#f1f1f1' }}>
                {items.map(item => {
                  const p = productById.get(item.productId);
                  const qty = parseInt(item.quantity, 10) || 0;
                  const changed = Number(item.price) !== item.listPrice;
                  return (
                    <li key={item.productId} className="py-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p?.image || '/placeholder-image.jpg'} alt="" className="w-11 h-11 rounded object-cover shrink-0" style={{ background: '#f6f5f2' }} />
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-[13px] font-medium" style={text}>{item.name}</p>
                        <p className="text-[12px]" style={subdued}>
                          {p ? `${shelfStock(p)} in stock` : ''}{p && qty > shelfStock(p) ? ` · ${qty - shelfStock(p)} as pre-order` : ''}
                          {changed ? ` · list price ${fmt(item.listPrice)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center rounded-lg" style={{ border: '1px solid #e3e3e3' }}>
                        <button type="button" onClick={() => updateItem(item.productId, { quantity: Math.max(1, qty - 1) })} className="w-8 h-8 grid place-items-center cursor-pointer" aria-label="Fewer"><Minus size={13} /></button>
                        <input
                          value={item.quantity}
                          onChange={e => updateItem(item.productId, { quantity: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                          inputMode="numeric"
                          className="w-10 h-8 text-center text-[13px] outline-none bg-transparent"
                          aria-label={`Quantity of ${item.name}`}
                        />
                        <button type="button" onClick={() => updateItem(item.productId, { quantity: qty + 1 })} className="w-8 h-8 grid place-items-center cursor-pointer" aria-label="More"><Plus size={13} /></button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px]" style={subdued}>AED</span>
                        <input
                          value={item.price}
                          onChange={e => updateItem(item.productId, { price: e.target.value.replace(/[^\d.]/g, '') })}
                          inputMode="decimal"
                          className="sp-input w-[116px] pl-10"
                          aria-label={`Unit price of ${item.name}`}
                          title="Unit price, VAT included"
                        />
                      </div>
                      <span className="text-[13px] w-[96px] text-right font-medium" style={text}>{fmt((Number(item.price) || 0) * qty)}</span>
                      <button type="button" onClick={() => removeItem(item.productId)} className="sp-btn sp-btn-secondary px-2" aria-label={`Remove ${item.name}`}><Trash2 size={14} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
            {stockProblems.length > 0 && <Notice tone="warning">{stockProblems.map(p => <p key={p}>{p}</p>)}</Notice>}
          </section>

          {/* Customer */}
          <section className="sp-card sp-card-pad space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <User size={15} style={secondary} />
                <h2 className="sp-section-title">Customer</h2>
              </div>
              <Segmented label="Customer" value={mode} onChange={switchMode} options={[['find', 'Existing customer'], ['new', 'New customer']]} />
            </div>

            {mode === 'find' && !customer && (
              <>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={subdued} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by phone, email or name" className="sp-input w-full pl-8" aria-label="Search customers" autoFocus />
                  {searching && <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2" style={subdued} />}
                </div>
                {results && results.length === 0 && !searching && (
                  <Notice>No customer found. <button type="button" onClick={() => switchMode('new')} className="underline font-medium cursor-pointer">Add them as a new customer</button>.</Notice>
                )}
                {results && results.length > 0 && (
                  <ul className="rounded-lg divide-y" style={{ border: '1px solid #e3e3e3', borderColor: '#e3e3e3' }}>
                    {results.map(c => (
                      <li key={c.id}>
                        <button type="button" onClick={() => chooseCustomer(c)} disabled={c.suspended} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#f7f7f7] disabled:opacity-50 cursor-pointer">
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium truncate" style={text}>{[c.firstName, c.lastName].filter(Boolean).join(' ') || 'No name'}{c.suspended ? ' · suspended' : ''}</span>
                            <span className="block text-[12px] truncate" style={subdued}>{[c.email, formatPhone(c.phone)].filter(Boolean).join(' · ')}</span>
                          </span>
                          <span className="text-[12px] shrink-0" style={subdued}>{c.addresses.length} address{c.addresses.length === 1 ? '' : 'es'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {mode === 'find' && customer && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: '#f7f7f7' }}>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium" style={text}>{[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'No name'}</p>
                  <p className="text-[12px] truncate" style={subdued}>{[customer.email, formatPhone(customer.phone)].filter(Boolean).join(' · ') || 'No contact details'}</p>
                </div>
                <button type="button" onClick={clearCustomer} className="sp-btn sp-btn-secondary px-2" aria-label="Change customer"><X size={14} /></button>
              </div>
            )}

            {mode === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First name"><input value={newCustomer.firstName} onChange={e => setNewCustomer(c => ({ ...c, firstName: e.target.value }))} className="sp-input w-full" /></Field>
                <Field label="Last name" hint="optional"><input value={newCustomer.lastName} onChange={e => setNewCustomer(c => ({ ...c, lastName: e.target.value }))} className="sp-input w-full" /></Field>
                <Field label="Mobile number">
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={subdued} />
                    <input value={newCustomer.phone} onChange={e => setNewCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="050 123 4567" inputMode="tel" dir="ltr" className="sp-input w-full pl-8" />
                  </div>
                  {newCustomer.phone.trim() && !newPhone.ok && <span className="block text-[12px] mt-1" style={{ color: '#b42318' }}>{newPhone.reason}</span>}
                </Field>
                <Field label="Email" hint="optional — for the confirmation">
                  <input value={newCustomer.email} onChange={e => setNewCustomer(c => ({ ...c, email: e.target.value }))} type="email" className="sp-input w-full" />
                </Field>
                <p className="sm:col-span-2 text-[12px]" style={subdued}>If an account already has this email (or this number, without an email), the order goes on that account.</p>
              </div>
            )}
          </section>

          {/* Address */}
          {(customer || mode === 'new') && (
            <section className="sp-card sp-card-pad space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={15} style={secondary} />
                <h2 className="sp-section-title">Delivery address</h2>
              </div>
              {customer && customer.addresses.length > 0 && (
                <div className="space-y-2">
                  {[...customer.addresses.map(a => ({ ...a, key: String(a.id) })), { key: '' }].map(a => {
                    const selected = addressId === a.key;
                    return (
                      <label key={a.key || 'new'} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer" style={{ border: `1px solid ${selected ? 'var(--sp-text)' : '#e3e3e3'}` }}>
                        <input type="radio" name="address" checked={selected} onChange={() => setAddressId(a.key)} className="mt-0.5" style={{ accentColor: 'var(--sp-primary)' }} />
                        {a.key ? (
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-medium truncate" style={text}>{a.label || a.line1}</span>
                            <span className="block text-[12px]" style={subdued}>{[a.line1, a.line2, a.city].filter(Boolean).join(', ')}{a.phone ? ` · ${formatPhone(a.phone)}` : ''}</span>
                          </span>
                        ) : (
                          <span className="text-[13px] font-medium" style={text}>A new address</span>
                        )}
                        {a.isDefault && <span className="sp-badge sp-badge-neutral">Default</span>}
                      </label>
                    );
                  })}
                </div>
              )}
              {!addressId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Field label="Street address"><input value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} placeholder="Building, street, area" className="sp-input w-full" /></Field>
                  </div>
                  <Field label="Apartment, villa, landmark" hint="optional"><input value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} className="sp-input w-full" /></Field>
                  <Field label="Emirate">
                    <select value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} className="sp-input w-full cursor-pointer">
                      {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </Field>
                  <Field label="Delivery phone" hint="if not the customer’s number">
                    <input value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="050 123 4567" inputMode="tel" dir="ltr" className="sp-input w-full" />
                    {address.phone.trim() && !parsePhone(address.phone).ok && <span className="block text-[12px] mt-1" style={{ color: '#b42318' }}>{parsePhone(address.phone).reason}</span>}
                  </Field>
                  <Field label="Recipient name" hint="optional"><input value={address.label} onChange={e => setAddress(a => ({ ...a, label: e.target.value }))} className="sp-input w-full" /></Field>
                  <p className="sm:col-span-2 text-[12px]" style={subdued}>Saved to the customer’s address book.</p>
                </div>
              )}
            </section>
          )}

          {/* Note */}
          <section className="sp-card sp-card-pad space-y-2">
            <h2 className="sp-section-title">Internal note</h2>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="e.g. Called at 3 pm, deliver after 6 pm" className="sp-input w-full py-2 h-auto" />
            <p className="text-[12px]" style={subdued}>Only the team sees this, on the order page.</p>
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <section className="sp-card sp-card-pad space-y-3">
            <h2 className="sp-section-title">Payment</h2>
            <div className="space-y-2">
              {METHODS.map(([key, name, hint]) => (
                <label key={key} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer" style={{ border: `1px solid ${paymentMethod === key ? 'var(--sp-text)' : '#e3e3e3'}` }}>
                  <input type="radio" name="payment" checked={paymentMethod === key} onChange={() => setPaymentMethod(key)} className="mt-0.5" style={{ accentColor: 'var(--sp-primary)' }} />
                  <span>
                    <span className="block text-[13px] font-medium" style={text}>{name}</span>
                    <span className="block text-[12px]" style={subdued}>{hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {paymentMethod === 'bankTransfer' && (
              <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={text}>
                <input type="checkbox" checked={paymentReceived} onChange={e => setPaymentReceived(e.target.checked)} style={{ accentColor: 'var(--sp-primary)' }} />
                Transfer already received (mark as paid)
              </label>
            )}
          </section>

          <section className="sp-card sp-card-pad space-y-3">
            <h2 className="sp-section-title">Summary</h2>
            <Field label="Discount code" hint="optional">
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="sp-input w-full" />
            </Field>
            {couponProblem && <Notice tone="error">{couponProblem}</Notice>}
            <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={text}>
              <input type="checkbox" checked={freeShipping} onChange={e => setFreeShipping(e.target.checked)} style={{ accentColor: 'var(--sp-primary)' }} />
              Free delivery
            </label>
            <dl className="text-[13px] space-y-1.5 pt-1">
              <div className="flex justify-between"><dt style={secondary}>Subtotal · {quantity} item{quantity === 1 ? '' : 's'}</dt><dd style={text}>{fmt(subtotal)}</dd></div>
              <div className="flex justify-between"><dt style={secondary}>Delivery</dt><dd style={text}>{shipping === 0 ? 'Free' : fmt(shipping)}</dd></div>
              {discount > 0 && <div className="flex justify-between"><dt style={secondary}>Discount ({coupon.code})</dt><dd style={text}>−{fmt(discount)}</dd></div>}
              <div className="flex justify-between pt-2 font-semibold text-[14px]" style={{ borderTop: '1px solid #f1f1f1' }}><dt style={text}>Total</dt><dd style={text}>{fmt(total)}</dd></div>
              <p className="text-[12px]" style={subdued}>Prices include VAT.</p>
            </dl>

            <label className={`flex items-center gap-2 text-[13px] ${customerEmail ? 'cursor-pointer' : 'opacity-60'}`} style={text}>
              <input type="checkbox" checked={sendEmail && !!customerEmail} disabled={!customerEmail} onChange={e => setSendEmail(e.target.checked)} style={{ accentColor: 'var(--sp-primary)' }} />
              {customerEmail ? 'Email the customer a confirmation' : 'No email — no confirmation will be sent'}
            </label>

            {error && <Notice tone="error">{error}</Notice>}
            <button type="button" onClick={create} disabled={!canCreate} className="sp-btn sp-btn-primary w-full justify-center">
              {saving ? <><Loader2 size={14} className="animate-spin" />Creating order…</> : `Create order · ${fmt(total)}`}
            </button>
            {!canCreate && !saving && (
              <p className="text-[12px]" style={subdued}>
                {!itemsReady ? 'Add the products. ' : ''}{!customerReady ? 'Choose or add the customer. ' : ''}{customerReady && !addressReady ? 'Add the delivery address and a mobile number.' : ''}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
