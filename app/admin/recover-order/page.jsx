'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle, Loader2, Plus, Search, ShoppingCart, User, MapPin, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { calcShipping } from '@/lib/shipping';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };
const fmt = (n) => `AED ${(Number(n) || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHODS = [['tabby', 'Tabby'], ['card', 'Card (Stripe)'], ['cashOnDelivery', 'Cash on delivery']];

const Notice = ({ tone = 'info', children }) => {
    const tones = {
        info: { background: '#eef4ff', border: '1px solid #c9dcff', color: '#1d3f8f' },
        success: { background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.3)', color: '#14532d' },
        warning: { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.45)', color: '#78350f' },
        error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b42318' },
    };
    return <div className="rounded-lg px-3 py-2.5 text-[13px] space-y-1" style={tones[tone]}>{children}</div>;
};

function RecoverOrder() {
    const searchParams = useSearchParams();
    const { adminProducts = [] } = useAppContext();

    const [paymentMethod, setPaymentMethod] = useState(searchParams.get('tabby') ? 'tabby' : 'card');

    // Customer
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [customer, setCustomer] = useState(null); // { user, cart, addresses }
    const [customerLoading, setCustomerLoading] = useState(false);
    const [customerError, setCustomerError] = useState(null);

    // Payment
    const [paymentRef, setPaymentRef] = useState(searchParams.get('tabby') || '');
    const [payment, setPayment] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    // Order
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [items, setItems] = useState([]);

    const [recoverLoading, setRecoverLoading] = useState(false);
    const [recoverResult, setRecoverResult] = useState(null);
    const [recoverError, setRecoverError] = useState(null);

    const applyCustomer = useCallback((data, { addressId, itemsOverride } = {}) => {
        setCustomer(data);
        setEmail(data.user.email);
        setItems(itemsOverride || data.cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: Number(i.price), name: i.name })));
        const preferred = data.addresses.find(a => a.id === addressId) || data.addresses.find(a => a.is_default) || data.addresses[0];
        setSelectedAddressId(preferred ? String(preferred.id) : '');
    }, []);

    const loadCustomer = async () => {
        setCustomerLoading(true); setCustomerError(null); setRecoverResult(null); setRecoverError(null);
        try {
            const res = await fetch(`/api/admin/recover-order?email=${encodeURIComponent(email.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            applyCustomer(data);
        } catch (e) { setCustomerError(e.message); setCustomer(null); }
        finally { setCustomerLoading(false); }
    };

    const lookupPayment = useCallback(async (method, ref) => {
        setPaymentLoading(true); setPaymentError(null); setPayment(null); setRecoverResult(null); setRecoverError(null);
        try {
            const param = method === 'tabby' ? 'tabby' : 'pi';
            const res = await fetch(`/api/admin/recover-order?${param}=${encodeURIComponent(ref.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPayment(data);
            // A Tabby payment brings its customer and the products they paid for
            if (method === 'tabby' && data.customer) {
                applyCustomer(data.customer, {
                    addressId: data.savedCheckout?.addressId,
                    itemsOverride: data.paidItems.length ? data.paidItems : undefined,
                });
            }
        } catch (e) { setPaymentError(e.message); }
        finally { setPaymentLoading(false); }
    }, [applyCustomer]);

    // Opened from the payments page with ?tabby=<payment id>
    useEffect(() => {
        const tabby = searchParams.get('tabby');
        if (tabby) lookupPayment('tabby', tabby);
    }, [searchParams, lookupPayment]);

    const switchMethod = (method) => {
        setPaymentMethod(method);
        setPayment(null); setPaymentError(null); setPaymentRef('');
    };

    const updateItem = (index, patch) => setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    const chooseProduct = (index, productId) => {
        const product = adminProducts.find(p => String(p.id) === String(productId));
        updateItem(index, product
            ? { productId: product.id, name: product.name, price: Number(product.price) }
            : { productId: '', name: '', price: '' });
    };

    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (parseInt(i.quantity, 10) || 0), 0);
    const shipping = calcShipping(items.reduce((s, i) => s + (parseInt(i.quantity, 10) || 0), 0));
    const total = subtotal + shipping;

    const tabbyPaid = paymentMethod === 'tabby' && payment?.tabby?.paid;
    const cardPaid = paymentMethod === 'card' && payment?.stripe?.status === 'succeeded';
    const existingOrderId = paymentMethod === 'tabby' ? payment?.existingOrderId : payment?.existingOrder?.id;
    const paymentReady = paymentMethod === 'cashOnDelivery' || ((tabbyPaid || cardPaid) && !existingOrderId);
    const itemsReady = items.length > 0 && items.every(i => i.productId && Number(i.price) >= 0 && parseInt(i.quantity, 10) >= 1);
    const canRecover = customer && selectedAddressId && itemsReady && paymentReady;
    const paidAmount = tabbyPaid ? payment.tabby.amount - payment.tabby.refunded : null;
    const difference = paidAmount === null ? null : Math.round((paidAmount - total) * 100) / 100;

    const recover = async () => {
        setRecoverLoading(true); setRecoverError(null); setRecoverResult(null);
        try {
            const res = await fetch('/api/admin/recover-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_method: paymentMethod,
                    pi: paymentMethod === 'card' ? paymentRef.trim() : undefined,
                    tabby_payment_id: paymentMethod === 'tabby' ? payment.tabby.id : undefined,
                    user_id: customer.user.id,
                    user_address_id: parseInt(selectedAddressId, 10),
                    items: items.map(i => ({ productId: parseInt(i.productId, 10), quantity: parseInt(i.quantity, 10), price: Number(i.price) })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setRecoverResult(data);
        } catch (e) { setRecoverError(e.message); }
        finally { setRecoverLoading(false); }
    };

    return (
        <div className="max-w-[760px] mx-auto space-y-4">
            <div>
                <h1 className="text-[20px] font-semibold" style={text}>Recover missing order</h1>
                <p className="text-[13px] mt-1" style={secondary}>
                    For a customer who paid but has no order. Check the payment, correct the products if needed, then create the order.
                </p>
            </div>

            {/* Payment */}
            <section className="sp-card sp-card-pad space-y-4">
                <h2 className="sp-section-title">Payment</h2>
                <div className="inline-flex p-0.5 rounded-lg" style={{ background: '#f1f1f1' }} role="radiogroup" aria-label="Payment method">
                    {METHODS.map(([value, label]) => {
                        const selected = paymentMethod === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => switchMethod(value)}
                                className="h-8 px-3 rounded-md text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                                style={selected ? { background: '#ffffff', color: 'var(--sp-text)', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' } : secondary}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {paymentMethod !== 'cashOnDelivery' && (
                    <div>
                        <label htmlFor="payment-ref" className="block text-[13px] font-medium mb-1.5" style={secondary}>
                            {paymentMethod === 'tabby' ? 'Tabby payment ID' : 'Stripe payment intent ID'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="payment-ref"
                                value={paymentRef}
                                onChange={e => setPaymentRef(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && paymentRef.trim() && lookupPayment(paymentMethod, paymentRef)}
                                placeholder={paymentMethod === 'tabby' ? 'e.g. 3f2c…' : 'pi_…'}
                                className="sp-input flex-1"
                            />
                            <button type="button" onClick={() => lookupPayment(paymentMethod, paymentRef)} disabled={paymentLoading || !paymentRef.trim()} className="sp-btn sp-btn-primary">
                                {paymentLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}Check payment
                            </button>
                        </div>
                        {paymentMethod === 'tabby' && (
                            <p className="text-[12px] mt-1.5" style={subdued}>
                                Find it under <Link href="/admin/payments" className="underline">Payments → Tabby</Link>: payments without an order have a Recover button.
                            </p>
                        )}
                    </div>
                )}

                {paymentError && <Notice tone="error">{paymentError}</Notice>}

                {paymentMethod === 'tabby' && payment?.tabby && (
                    <Notice tone={existingOrderId ? 'warning' : payment.tabby.paid ? 'success' : 'warning'}>
                        <p className="font-semibold">
                            {payment.tabby.paid ? 'Paid' : `Not paid (${payment.tabby.status})`} · {fmt(payment.tabby.amount)}
                            {payment.tabby.refunded > 0 && ` · ${fmt(payment.tabby.refunded)} refunded`}
                        </p>
                        {payment.tabby.buyer && <p>{payment.tabby.buyer.name} · {payment.tabby.buyer.email}</p>}
                        {existingOrderId
                            ? <p>This payment already has <Link href={`/admin/orders/${existingOrderId}`} className="underline font-semibold">order #{existingOrderId}</Link>.</p>
                            : payment.tabby.paid && <p>No order exists for this payment yet.</p>}
                        {payment.unlinkedOrders?.length > 0 && (
                            <p>
                                Check this isn&apos;t a duplicate: this customer has Tabby order{payment.unlinkedOrders.length !== 1 ? 's' : ''}{' '}
                                {payment.unlinkedOrders.map((o, i) => (
                                    <span key={o.id}>{i > 0 && ', '}<Link href={`/admin/orders/${o.id}`} className="underline font-semibold">#{o.id}</Link> ({fmt(o.total)})</span>
                                ))}{' '}
                                not linked to any payment.
                            </p>
                        )}
                        {payment.savedCheckout?.lastError && <p>Why the order wasn&apos;t created automatically: {payment.savedCheckout.lastError}</p>}
                        {!payment.customer && <p>No account matches the buyer email. Find the customer below.</p>}
                    </Notice>
                )}

                {paymentMethod === 'card' && payment?.stripe && (
                    <Notice tone={existingOrderId ? 'warning' : cardPaid ? 'success' : 'warning'}>
                        <p className="font-semibold">{cardPaid ? 'Paid' : `Not paid (${payment.stripe.status})`} · {payment.stripe.amountFormatted}</p>
                        {existingOrderId
                            ? <p>This payment already has <Link href={`/admin/orders/${existingOrderId}`} className="underline font-semibold">order #{existingOrderId}</Link>.</p>
                            : cardPaid && <p>No order exists for this payment yet.</p>}
                    </Notice>
                )}
            </section>

            {/* Customer */}
            <section className="sp-card sp-card-pad space-y-3">
                <div className="flex items-center gap-2">
                    <User size={15} style={secondary} />
                    <h2 className="sp-section-title">Customer</h2>
                </div>
                <div className="flex gap-2">
                    <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && email.trim() && loadCustomer()}
                        placeholder="customer@email.com"
                        className="sp-input flex-1"
                        aria-label="Customer email"
                    />
                    <button type="button" onClick={loadCustomer} disabled={customerLoading || !email.trim()} className="sp-btn sp-btn-secondary">
                        {customerLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}Find
                    </button>
                </div>
                {customerError && <Notice tone="error">{customerError}</Notice>}
                {customer && (
                    <p className="text-[13px]" style={text}>
                        {customer.user.firstName} · {customer.user.email}
                        <span className="block text-[12px]" style={subdued}>{customer.addresses.length} saved address{customer.addresses.length !== 1 ? 'es' : ''} · {customer.cart.length} item{customer.cart.length !== 1 ? 's' : ''} in their bag now</span>
                    </p>
                )}
            </section>

            {customer && (
                <>
                    {/* Address */}
                    <section className="sp-card sp-card-pad space-y-3">
                        <div className="flex items-center gap-2">
                            <MapPin size={15} style={secondary} />
                            <h2 className="sp-section-title">Shipping address</h2>
                        </div>
                        {customer.addresses.length === 0 ? (
                            <Notice tone="warning">This customer has no saved addresses. Ask them to add one in their account first.</Notice>
                        ) : (
                            <div className="space-y-2">
                                {customer.addresses.map(addr => {
                                    const selected = String(selectedAddressId) === String(addr.id);
                                    return (
                                        <label key={addr.id} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer" style={{ border: `1px solid ${selected ? 'var(--sp-text)' : '#e3e3e3'}` }}>
                                            <input type="radio" name="address" checked={selected} onChange={() => setSelectedAddressId(String(addr.id))} className="mt-0.5" style={{ accentColor: 'var(--sp-primary)' }} />
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-[13px] font-medium truncate" style={text}>{addr.address_label || addr.shipping_address}</span>
                                                <span className="block text-[12px]" style={subdued}>{addr.shipping_address}{addr.city ? `, ${addr.city}` : ''}</span>
                                            </span>
                                            {addr.is_default && <span className="sp-badge sp-badge-neutral">Default</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Items */}
                    <section className="sp-card sp-card-pad space-y-3">
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={15} style={secondary} />
                            <h2 className="sp-section-title">Products</h2>
                        </div>
                        <p className="text-[12px]" style={subdued}>
                            {paymentMethod === 'tabby' && payment?.paidItems?.length
                                ? 'Loaded from the checkout the customer paid for. Change them to what the customer confirmed they want.'
                                : 'Loaded from the customer’s bag. Change them to what the customer confirmed they want.'}
                        </p>

                        {items.length === 0 && <p className="text-[13px]" style={subdued}>No products yet.</p>}
                        <ul className="space-y-2">
                            {items.map((item, index) => (
                                <li key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                    <select
                                        value={item.productId ? String(item.productId) : ''}
                                        onChange={e => chooseProduct(index, e.target.value)}
                                        className="sp-input flex-1 min-w-[200px] cursor-pointer"
                                        aria-label="Product"
                                    >
                                        <option value="">Choose a product</option>
                                        {item.productId && !adminProducts.some(p => String(p.id) === String(item.productId)) && (
                                            <option value={String(item.productId)}>{item.name || `Product #${item.productId}`}</option>
                                        )}
                                        {adminProducts.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                                    </select>
                                    <input
                                        type="number" min="1" step="1"
                                        value={item.quantity}
                                        onChange={e => updateItem(index, { quantity: e.target.value })}
                                        className="sp-input w-[76px]"
                                        aria-label="Quantity"
                                    />
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={item.price}
                                        onChange={e => updateItem(index, { price: e.target.value })}
                                        className="sp-input w-[110px]"
                                        aria-label="Unit price (AED)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
                                        className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#e3e3e3] transition-colors"
                                        style={secondary}
                                        aria-label="Remove product"
                                    >
                                        <X size={15} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button type="button" onClick={() => setItems(prev => [...prev, { productId: '', quantity: 1, price: '' }])} className="sp-btn sp-btn-secondary">
                            <Plus size={14} />Add product
                        </button>

                        <dl className="pt-3 space-y-1.5 text-[13px]" style={{ borderTop: '1px solid #ebebeb' }}>
                            <div className="flex justify-between"><dt style={secondary}>Subtotal</dt><dd style={text}>{fmt(subtotal)}</dd></div>
                            <div className="flex justify-between"><dt style={secondary}>Delivery</dt><dd style={text}>{shipping ? fmt(shipping) : 'Free'}</dd></div>
                            <div className="flex justify-between font-semibold"><dt style={text}>Order total (incl. VAT)</dt><dd style={text}>{fmt(total)}</dd></div>
                            {paidAmount !== null && (
                                <div className="flex justify-between"><dt style={secondary}>Paid on Tabby</dt><dd style={text}>{fmt(paidAmount)}</dd></div>
                            )}
                        </dl>
                        {difference !== null && itemsReady && difference > 0.009 && (
                            <Notice tone="warning">The customer paid {fmt(difference)} more than this order. Refund the difference in your Tabby merchant dashboard after creating the order.</Notice>
                        )}
                        {difference !== null && itemsReady && difference < -0.009 && (
                            <Notice tone="warning">This order is {fmt(-difference)} more than the customer paid on Tabby. Collect the difference or adjust the products before creating it.</Notice>
                        )}
                    </section>

                    {/* Create */}
                    <section className="sp-card sp-card-pad space-y-3">
                        {recoverError && <Notice tone="error"><span className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{recoverError}</span></Notice>}
                        {recoverResult ? (
                            <Notice tone="success">
                                <p className="flex items-center gap-2 font-semibold">
                                    <CheckCircle size={15} />
                                    Order #{recoverResult.orderId} created{recoverResult.emailSent ? ' and confirmation email sent' : ''}.
                                    <Link href={`/admin/orders/${recoverResult.orderId}`} className="underline">View order</Link>
                                </p>
                                {recoverResult.difference > 0.009 && <p>Remember to refund {fmt(recoverResult.difference)} in the Tabby merchant dashboard.</p>}
                            </Notice>
                        ) : (
                            <>
                                <button type="button" onClick={recover} disabled={recoverLoading || !canRecover} className="sp-btn sp-btn-primary w-full justify-center">
                                    {recoverLoading ? <><Loader2 size={14} className="animate-spin" />Creating order…</> : 'Create order and send confirmation'}
                                </button>
                                {!canRecover && (
                                    <ul className="text-[12px] space-y-0.5" style={subdued}>
                                        {paymentMethod !== 'cashOnDelivery' && !payment && <li>Check the payment first</li>}
                                        {payment && existingOrderId && <li>This payment already has an order</li>}
                                        {payment && !existingOrderId && !(tabbyPaid || cardPaid) && <li>The payment hasn&apos;t been completed</li>}
                                        {!selectedAddressId && <li>Choose a shipping address</li>}
                                        {!itemsReady && <li>Choose a product, quantity and price for every line</li>}
                                    </ul>
                                )}
                            </>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default function RecoverOrderPage() {
    return (
        <Suspense fallback={null}>
            <RecoverOrder />
        </Suspense>
    );
}
