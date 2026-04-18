'use client';

import { useState } from 'react';
import { Search, Plus, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function RecoverOrderPage() {
    const [pi, setPi] = useState('pi_3TNCBlCfZzjlJV3T04BwNHs5');
    const [piInfo, setPiInfo] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState(null);

    const [userId, setUserId] = useState('');
    const [addressId, setAddressId] = useState('');
    const [items, setItems] = useState([{ productId: '', quantity: 1, price: '' }]);
    const [recoverLoading, setRecoverLoading] = useState(false);
    const [recoverResult, setRecoverResult] = useState(null);
    const [recoverError, setRecoverError] = useState(null);

    const lookup = async () => {
        setLookupLoading(true);
        setLookupError(null);
        setPiInfo(null);
        try {
            const res = await fetch(`/api/admin/recover-order?pi=${pi.trim()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPiInfo(data);
        } catch (e) {
            setLookupError(e.message);
        } finally {
            setLookupLoading(false);
        }
    };

    const addItem = () => setItems(prev => [...prev, { productId: '', quantity: 1, price: '' }]);
    const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
    const updateItem = (i, field, value) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

    const recover = async () => {
        setRecoverLoading(true);
        setRecoverError(null);
        setRecoverResult(null);
        try {
            const res = await fetch('/api/admin/recover-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pi: pi.trim(),
                    user_id: parseInt(userId),
                    user_address_id: parseInt(addressId),
                    items: items.map(i => ({
                        productId: parseInt(i.productId),
                        quantity: parseInt(i.quantity),
                        price: parseFloat(i.price),
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setRecoverResult(data);
        } catch (e) {
            setRecoverError(e.message);
        } finally {
            setRecoverLoading(false);
        }
    };

    const card = { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(216,180,254,0.35)', borderRadius: 16, padding: 24 };
    const input = { background: 'rgba(248,240,255,0.6)', border: '1px solid rgba(216,180,254,0.35)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3b0764', width: '100%', outline: 'none' };
    const label = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(59,7,100,0.5)', display: 'block', marginBottom: 6 };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: '#3b0764' }}>Recover Missing Order</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(59,7,100,0.5)' }}>
                    For payments that succeeded in Stripe but never created a DB order (e.g. 3DS redirect).
                </p>
            </div>

            {/* Step 1 — Lookup PI */}
            <div style={card}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#3b0764' }}>Step 1 — Look up payment intent</h2>
                <div className="flex gap-2">
                    <input
                        value={pi}
                        onChange={e => setPi(e.target.value)}
                        placeholder="pi_..."
                        style={{ ...input, flex: 1 }}
                    />
                    <button
                        onClick={lookup}
                        disabled={lookupLoading || !pi.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))', boxShadow: '0 4px 14px rgba(168,85,247,0.28)' }}
                    >
                        {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        Lookup
                    </button>
                </div>

                {lookupError && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
                        <AlertTriangle size={14} /> {lookupError}
                    </div>
                )}

                {piInfo && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                            {piInfo.stripe.status === 'succeeded'
                                ? <CheckCircle size={16} style={{ color: 'rgb(126,105,230)' }} />
                                : <AlertTriangle size={16} className="text-yellow-500" />}
                            <span className="text-sm font-semibold" style={{ color: '#3b0764' }}>
                                {piInfo.stripe.status.toUpperCase()} — {piInfo.stripe.amountFormatted}
                            </span>
                            <span className="text-xs" style={{ color: 'rgba(59,7,100,0.45)' }}>
                                {new Date(piInfo.stripe.created).toLocaleString()}
                            </span>
                        </div>
                        {piInfo.existingOrder ? (
                            <div className="text-sm px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
                                ⚠ Order <strong>#{piInfo.existingOrder.id}</strong> already exists for this PI
                                (status: {piInfo.existingOrder.order_status})
                            </div>
                        ) : (
                            <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(147,104,236,0.08)', color: 'rgb(126,105,230)' }}>
                                No order found for this PI — proceed to recover below.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Step 2 — Fill details */}
            {piInfo && !piInfo.existingOrder && piInfo.stripe.status === 'succeeded' && (
                <div style={card} className="space-y-5">
                    <h2 className="text-sm font-bold" style={{ color: '#3b0764' }}>Step 2 — Fill in order details</h2>
                    <p className="text-xs" style={{ color: 'rgba(59,7,100,0.5)' }}>
                        Check your database or ask the customer for user ID, address ID, and items.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={label}>User ID</label>
                            <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="e.g. 12" style={input} />
                        </div>
                        <div>
                            <label style={label}>Shipping Address ID</label>
                            <input value={addressId} onChange={e => setAddressId(e.target.value)} placeholder="e.g. 34" style={input} />
                        </div>
                    </div>

                    <div>
                        <label style={label}>Order items</label>
                        <div className="space-y-2">
                            {items.map((item, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} placeholder="Product ID" style={{ ...input, width: 110 }} />
                                    <input value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" type="number" min="1" style={{ ...input, width: 70 }} />
                                    <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="Unit price" type="number" step="0.01" style={{ ...input, flex: 1 }} />
                                    <button onClick={() => removeItem(i)} disabled={items.length === 1} className="p-2 rounded-lg disabled:opacity-30 text-red-400 hover:text-red-600">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: 'rgb(126,105,230)' }}>
                            <Plus size={12} /> Add item
                        </button>
                    </div>

                    <div className="text-xs p-3 rounded-lg" style={{ background: 'rgba(248,240,255,0.8)', border: '1px solid rgba(216,180,254,0.3)', color: 'rgba(59,7,100,0.55)' }}>
                        The order total will be taken from Stripe ({piInfo.stripe.amountFormatted}). Tax/shipping will be set to 0 since those weren't captured. You can adjust them in the admin orders panel afterward.
                    </div>

                    <button
                        onClick={recover}
                        disabled={recoverLoading || !userId || !addressId || items.some(i => !i.productId || !i.price)}
                        className="w-full py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))', boxShadow: '0 4px 14px rgba(168,85,247,0.28)' }}
                    >
                        {recoverLoading ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Creating order…</span> : 'Recover order'}
                    </button>

                    {recoverError && (
                        <div className="flex items-start gap-2 text-sm text-red-500">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {recoverError}
                        </div>
                    )}
                    {recoverResult && (
                        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'rgb(126,105,230)' }}>
                            <CheckCircle size={16} />
                            Order <strong>#{recoverResult.orderId}</strong> created successfully!
                            <a href={`/admin/orders/${recoverResult.orderId}`} className="underline ml-1">View order</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
