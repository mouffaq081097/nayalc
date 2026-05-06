'use client';

import { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Loader2, ShoppingCart, User, MapPin } from 'lucide-react';

const card  = { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(216,180,254,0.35)', borderRadius: 16, padding: 24 };
const inp   = { background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(216,180,254,0.35)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3b0764', width: '100%', outline: 'none' };
const lbl   = { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(59,7,100,0.5)', display: 'block', marginBottom: 6 };
const btn   = { background: 'var(--brand-gradient)', boxShadow: '0 4px 14px rgba(168,85,247,0.28)', color: '#fff', borderRadius: 99, padding: '10px 24px', fontSize: 12, fontWeight: 900, cursor: 'pointer', border: 'none' };

export default function RecoverOrderPage() {
    // Step 1 — find user by email
    const [email, setEmail]         = useState('');
    const [userInfo, setUserInfo]   = useState(null); // { user, cart, addresses }
    const [userLoading, setUserLoading] = useState(false);
    const [userError, setUserError] = useState(null);

    // Step 2 — payment
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [pi, setPi]               = useState('');
    const [piInfo, setPiInfo]       = useState(null);
    const [piLoading, setPiLoading] = useState(false);
    const [piError, setPiError]     = useState(null);

    // Step 3 — address + items
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [items, setItems]         = useState([]); // auto-filled from cart

    // Step 4 — recovery result
    const [recoverLoading, setRecoverLoading] = useState(false);
    const [recoverResult, setRecoverResult]   = useState(null);
    const [recoverError, setRecoverError]     = useState(null);

    const loadUser = async () => {
        setUserLoading(true); setUserError(null); setUserInfo(null);
        setPiInfo(null); setRecoverResult(null); setRecoverError(null);
        try {
            const res  = await fetch(`/api/admin/recover-order?email=${encodeURIComponent(email.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUserInfo(data);
            setItems(data.cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, name: i.name })));
            const def = data.addresses.find(a => a.is_default) || data.addresses[0];
            if (def) setSelectedAddressId(String(def.id));
        } catch (e) { setUserError(e.message); }
        finally { setUserLoading(false); }
    };

    const lookupPi = async () => {
        setPiLoading(true); setPiError(null); setPiInfo(null);
        try {
            const res  = await fetch(`/api/admin/recover-order?pi=${pi.trim()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPiInfo(data);
        } catch (e) { setPiError(e.message); }
        finally { setPiLoading(false); }
    };

    const updateItem = (i, field, value) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

    const totalAmount = items.reduce((s, i) => s + parseFloat(i.price || 0) * parseInt(i.quantity || 0), 0);

    const canRecover = userInfo &&
        selectedAddressId &&
        items.length > 0 &&
        items.every(i => i.productId && i.price && i.quantity) &&
        (paymentMethod !== 'card' || (piInfo && piInfo.stripe?.status === 'succeeded' && !piInfo.existingOrder));

    const recover = async () => {
        setRecoverLoading(true); setRecoverError(null); setRecoverResult(null);
        try {
            const res  = await fetch('/api/admin/recover-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pi: paymentMethod === 'card' ? pi.trim() : undefined,
                    payment_method: paymentMethod,
                    user_id: userInfo.user.id,
                    user_address_id: parseInt(selectedAddressId),
                    items: items.map(i => ({ productId: parseInt(i.productId), quantity: parseInt(i.quantity), price: parseFloat(i.price) })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setRecoverResult(data);
        } catch (e) { setRecoverError(e.message); }
        finally { setRecoverLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: '#3b0764' }}>Recover Missing Order</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(59,7,100,0.5)' }}>
                    Customer paid but no order was created. Enter their email to load their cart automatically.
                </p>
            </div>

            {/* Step 1 — Find customer */}
            <div style={card} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <User size={15} style={{ color: 'var(--brand-purple-darker)' }} />
                    <h2 className="text-sm font-bold" style={{ color: '#3b0764' }}>Step 1 — Find customer</h2>
                </div>
                <div className="flex gap-2">
                    <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadUser()}
                        placeholder="customer@email.com"
                        style={{ ...inp, flex: 1 }}
                    />
                    <button onClick={loadUser} disabled={userLoading || !email.trim()} style={btn} className="flex items-center gap-2 disabled:opacity-50">
                        {userLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Find
                    </button>
                </div>
                {userError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertTriangle size={13} />{userError}</p>}
                {userInfo && (
                    <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(147,104,236,0.08)', border: '1px solid rgba(196,167,254,0.3)' }}>
                        <p className="text-sm font-bold" style={{ color: '#3b0764' }}>{userInfo.user.firstName} — {userInfo.user.email}</p>
                        <p className="text-xs" style={{ color: 'rgba(59,7,100,0.5)' }}>User ID: {userInfo.user.id} · {userInfo.cart.length} item(s) in cart · {userInfo.addresses.length} address(es)</p>
                        {userInfo.cart.length === 0 && (
                            <p className="text-xs text-amber-600 font-semibold">⚠ Cart is empty — enter items manually below.</p>
                        )}
                    </div>
                )}
            </div>

            {userInfo && (
                <>
                    {/* Step 2 — Payment */}
                    <div style={card} className="space-y-4">
                        <h2 className="text-sm font-bold" style={{ color: '#3b0764' }}>Step 2 — Payment method</h2>
                        <div className="flex gap-3">
                            {['card', 'cashOnDelivery'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                                    style={paymentMethod === m
                                        ? { background: 'var(--brand-gradient)', color: '#fff' }
                                        : { border: '1px solid rgba(216,180,254,0.4)', color: 'rgb(126,105,230)' }}
                                >
                                    {m === 'card' ? 'Card (Stripe)' : 'Cash on Delivery'}
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'card' && (
                            <div className="space-y-3">
                                <div>
                                    <label style={lbl}>Stripe Payment Intent ID</label>
                                    <div className="flex gap-2">
                                        <input value={pi} onChange={e => setPi(e.target.value)} placeholder="pi_..." style={{ ...inp, flex: 1 }} />
                                        <button onClick={lookupPi} disabled={piLoading || !pi.trim()} style={btn} className="flex items-center gap-2 disabled:opacity-50">
                                            {piLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Verify
                                        </button>
                                    </div>
                                </div>
                                {piError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertTriangle size={13} />{piError}</p>}
                                {piInfo && (
                                    <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: piInfo.stripe.status === 'succeeded' ? 'rgba(22,163,74,0.07)' : 'rgba(251,191,36,0.1)', border: `1px solid ${piInfo.stripe.status === 'succeeded' ? 'rgba(22,163,74,0.3)' : 'rgba(251,191,36,0.4)'}` }}>
                                        <p className="font-bold" style={{ color: '#3b0764' }}>
                                            {piInfo.stripe.status === 'succeeded' ? '✓' : '⚠'} {piInfo.stripe.status.toUpperCase()} — {piInfo.stripe.amountFormatted}
                                        </p>
                                        {piInfo.existingOrder
                                            ? <p className="text-amber-700">Order #{piInfo.existingOrder.id} already exists for this payment.</p>
                                            : <p style={{ color: 'rgba(59,7,100,0.5)' }}>No existing order — safe to recover.</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 3 — Address */}
                    <div style={card} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MapPin size={15} style={{ color: 'var(--brand-purple-darker)' }} />
                            <h2 className="text-sm font-bold" style={{ color: '#3b0764' }}>Step 3 — Shipping address</h2>
                        </div>
                        {userInfo.addresses.length === 0 ? (
                            <p className="text-xs text-amber-600">No saved addresses for this user.</p>
                        ) : (
                            <div className="space-y-2">
                                {userInfo.addresses.map(addr => (
                                    <label
                                        key={addr.id}
                                        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
                                        style={String(selectedAddressId) === String(addr.id)
                                            ? { background: 'rgba(196,167,254,0.15)', border: '1.5px solid rgba(196,167,254,0.6)' }
                                            : { border: '1px solid rgba(216,180,254,0.3)' }}
                                    >
                                        <input type="radio" name="address" value={addr.id} checked={String(selectedAddressId) === String(addr.id)} onChange={() => setSelectedAddressId(String(addr.id))} className="mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: '#3b0764' }}>{addr.address_label || addr.shipping_address}</p>
                                            <p className="text-xs" style={{ color: 'rgba(59,7,100,0.5)' }}>{addr.city}, {addr.country} · ID: {addr.id}</p>
                                        </div>
                                        {addr.is_default && <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded text-white" style={{ background: 'var(--brand-purple-2)' }}>Default</span>}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Step 4 — Items */}
                    <div style={card} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={15} style={{ color: 'var(--brand-purple-darker)' }} />
                            <h2 className="text-sm font-bold" style={{ color: '#3b0764' }}>
                                Step 4 — Order items {userInfo.cart.length > 0 && <span className="font-normal text-xs" style={{ color: 'rgba(59,7,100,0.45)' }}>(auto-loaded from cart)</span>}
                            </h2>
                        </div>

                        <div className="space-y-2">
                            {items.map((item, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-center text-xs">
                                    <div className="col-span-5">
                                        {item.name
                                            ? <p className="font-semibold truncate" style={{ color: '#3b0764' }}>{item.name}</p>
                                            : null}
                                        <input value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} placeholder="Product ID" style={{ ...inp, padding: '7px 10px', fontSize: 12 }} />
                                    </div>
                                    <div className="col-span-3">
                                        <input value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} type="number" min="1" placeholder="Qty" style={{ ...inp, padding: '7px 10px', fontSize: 12 }} />
                                    </div>
                                    <div className="col-span-3">
                                        <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} type="number" step="0.01" placeholder="Price" style={{ ...inp, padding: '7px 10px', fontSize: 12 }} />
                                    </div>
                                    <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} disabled={items.length === 1} className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-30 text-lg font-bold">×</button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setItems(prev => [...prev, { productId: '', quantity: 1, price: '' }])}
                            className="text-xs font-bold"
                            style={{ color: 'var(--brand-purple-darker)' }}
                        >
                            + Add item
                        </button>

                        <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid rgba(216,180,254,0.2)' }}>
                            <span style={{ color: 'rgba(59,7,100,0.5)' }}>Order total</span>
                            <span className="font-bold" style={{ color: '#3b0764' }}>AED {totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Recover button */}
                    <div style={card} className="space-y-4">
                        {recoverError && (
                            <div className="flex items-start gap-2 text-sm text-red-500">
                                <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {recoverError}
                            </div>
                        )}
                        {recoverResult && (
                            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'rgb(22,163,74)' }}>
                                <CheckCircle size={16} />
                                Order <strong>#{recoverResult.orderId}</strong> created and confirmation email sent!
                                <a href={`/admin/orders/${recoverResult.orderId}`} className="underline ml-1" style={{ color: 'var(--brand-purple-darker)' }}>View order</a>
                            </div>
                        )}
                        {!recoverResult && (
                            <button
                                onClick={recover}
                                disabled={recoverLoading || !canRecover}
                                style={btn}
                                className="w-full py-4 disabled:opacity-50"
                            >
                                {recoverLoading
                                    ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Creating order…</span>
                                    : 'Create order & send confirmation email'}
                            </button>
                        )}
                        {!canRecover && !recoverResult && (
                            <ul className="text-xs space-y-1" style={{ color: 'rgba(59,7,100,0.45)' }}>
                                {!userInfo && <li>· Find customer first</li>}
                                {!selectedAddressId && <li>· Select a shipping address</li>}
                                {paymentMethod === 'card' && !piInfo && <li>· Verify Stripe payment intent</li>}
                                {paymentMethod === 'card' && piInfo?.existingOrder && <li>· An order already exists for this payment</li>}
                                {paymentMethod === 'card' && piInfo && piInfo.stripe?.status !== 'succeeded' && <li>· Payment intent is not succeeded</li>}
                                {items.some(i => !i.productId || !i.price) && <li>· Fill in all item fields</li>}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
