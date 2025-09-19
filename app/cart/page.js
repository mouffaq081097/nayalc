'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { Icon } from '../components/Icon';

const CartPage = () => {
    const { cartItems, updateQuantity, removeFromCart } = useCart();

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal > 50 ? 0 : 10;
    const total = subtotal + shipping;

    // State for hover effects
    const [isContinueShoppingHovered, setContinueShoppingHovered] = useState(false);
    const [isRemoveHovered, setRemoveHovered] = useState({}); // Use an object for multiple remove buttons
    const [isMinusHovered, setMinusHovered] = useState({}); // Use an object for multiple minus buttons
    const [isPlusHovered, setPlusHovered] = useState({});   // Use an object for multiple plus buttons
    const [isApplyPromoHovered, setApplyPromoHovered] = useState(false);
    const [isProceedToCheckoutHovered, setProceedToCheckoutHovered] = useState(false);

    // State for input focus effects
    const [isPromoInputFocused, setPromoInputFocused] = useState(false);
    const [isNotesTextareaFocused, setNotesTextareaFocused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div style={{ backgroundColor: 'var(--brand-secondary)' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '3rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.25rem', fontFamily: 'serif', fontWeight: 'bold', color: 'var(--brand-text)' }}>Shopping Cart</h1>
                    <p style={{ color: 'var(--brand-muted)', marginTop: '0.5rem' }}>Review your items and proceed to checkout.</p>
                </div>

                {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 0', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                        <p style={{ fontSize: '1.25rem', color: 'var(--brand-muted)', marginBottom: '1rem' }}>Your cart is empty.</p>
                        <Link
                            href="/"
                            style={{
                                backgroundColor: 'var(--brand-button-bg)',
                                color: 'white',
                                padding: '0.75rem 2rem',
                                borderRadius: '9999px',
                                fontWeight: 'bold',
                                transition: 'opacity 0.3s',
                                opacity: isContinueShoppingHovered ? 0.9 : 1,
                            }}
                            onMouseEnter={() => setContinueShoppingHovered(true)}
                            onMouseLeave={() => setContinueShoppingHovered(false)}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
                        <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2 / span 2', backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                             <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', fontWeight: 'bold', color: 'var(--brand-text)', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>Your Items ({cartItems.length})</h2>
                            <ul>
                                {cartItems.map((item, index) => (
                                    <li key={item.product._id || index} style={{ display: isMobile ? 'block' : 'flex', alignItems: 'center', padding: '1.5rem 0', textAlign: isMobile ? 'center' : 'left' }}>
                                    <Image src={item.product.imageUrl} alt={item.product.name} width={96} height={96} objectFit="contain" className="rounded-md" style={{ margin: isMobile ? '0 auto 1rem' : '0' }} />
                                        <div style={{ marginLeft: isMobile ? '0' : '1.5rem', flexGrow: 1 }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'semibold', color: 'var(--brand-text)', fontFamily: 'serif' }}>{item.product.name}</h3>
                                            <p style={{ color: 'var(--brand-muted)', fontSize: '0.875rem' }}>AED {item.product.price.toFixed(2)}</p>
                                            <button
                                                onClick={() => removeFromCart(item.product._id)}
                                                style={{
                                                    marginTop: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    color: isRemoveHovered[item.product._id] ? 'rgb(220 38 38)' : 'rgb(239 68 68)',
                                                    fontWeight: 'semibold',
                                                }}
                                                onMouseEnter={() => setRemoveHovered(prev => ({ ...prev, [item.product._id]: true }))}
                                                onMouseLeave={() => setRemoveHovered(prev => ({ ...prev, [item.product._id]: false }))}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: isMobile ? 'center' : 'flex-start', marginTop: isMobile ? '1rem' : '0' }}>
                                             <button
                                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                                style={{
                                                    padding: '0.25rem',
                                                    borderRadius: '9999px',
                                                    border: '1px solid #D1D5DB',
                                                    opacity: item.quantity <= 1 ? 0.5 : 1,
                                                    backgroundColor: isMinusHovered[item.product._id] ? '#F3F4F6' : 'transparent',
                                                }}
                                                disabled={item.quantity <= 1}
                                                onMouseEnter={() => setMinusHovered(prev => ({ ...prev, [item.product._id]: true }))}
                                                onMouseLeave={() => setMinusHovered(prev => ({ ...prev, [item.product._id]: false }))}
                                            >
                                                <Icon name="minus" style={{ width: '1rem', height: '1rem', color: 'var(--brand-text)' }}/>
                                            </button>
                                            <span style={{ width: '2.5rem', textAlign: 'center', fontWeight: 'semibold', color: 'var(--brand-text)' }}>{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                                style={{
                                                    padding: '0.25rem',
                                                    borderRadius: '9999px',
                                                    border: '1px solid #D1D5DB',
                                                    backgroundColor: isPlusHovered[item.product._id] ? '#F3F4F6' : 'transparent',
                                                }}
                                                onMouseEnter={() => setPlusHovered(prev => ({ ...prev, [item.product._id]: true }))}
                                                onMouseLeave={() => setPlusHovered(prev => ({ ...prev, [item.product._id]: false }))}
                                            >
                                                <Icon name="plus" style={{ width: '1rem', height: '1rem', color: 'var(--brand-text)' }}/>
                                            </button>
                                        </div>
                                        <p style={{ width: isMobile ? '100%' : '6rem', textAlign: isMobile ? 'center' : 'right', fontWeight: 'semibold', color: 'var(--brand-text)', marginTop: isMobile ? '1rem' : '0' }}>AED {(item.product.price * item.quantity).toFixed(2)}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ gridColumn: 'span 1', backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', height: 'fit-content' }}>
                            <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', fontWeight: 'bold', color: 'var(--brand-text)', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>Order Summary</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-text)' }}>
                                    <span>Subtotal</span>
                                    <span style={{ fontWeight: 'semibold' }}>AED {subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-text)' }}>
                                    <span>Shipping</span>
                                    <span style={{ fontWeight: 'semibold' }}>{shipping === 0 ? 'Free' : `AED ${shipping.toFixed(2)}`}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--brand-text)', borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                    <span>Total</span>
                                    <span>AED {total.toFixed(2)}</span>
                                </div>
                            </div>
                             <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label htmlFor="promo-code" style={{ fontSize: '0.875rem', fontWeight: 'medium', color: 'var(--brand-text)' }}>Promo Code</label>
                                    <div style={{ display: 'flex', marginTop: '0.25rem' }}>
                                        <input
                                            type="text"
                                            id="promo-code"
                                            placeholder="Enter code"
                                            style={{
                                                flexGrow: 1,
                                                border: '1px solid #D1D5DB',
                                                borderRadius: '0.375rem 0 0 0.375rem',
                                                padding: '0.5rem',
                                                fontSize: '0.875rem',
                                                outline: 'none',
                                                borderColor: isPromoInputFocused ? 'var(--brand-pink)' : '#D1D5DB',
                                                boxShadow: isPromoInputFocused ? '0 0 0 1px var(--brand-pink)' : 'none',
                                            }}
                                            onFocus={() => setPromoInputFocused(true)}
                                            onBlur={() => setPromoInputFocused(false)}
                                        />
                                        <button
                                            style={{
                                                backgroundColor: 'var(--brand-text)',
                                                color: 'white',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0 0.375rem 0.375rem 0',
                                                fontSize: '0.875rem',
                                                fontWeight: 'semibold',
                                                opacity: isApplyPromoHovered ? 0.9 : 1,
                                            }}
                                            onMouseEnter={() => setApplyPromoHovered(true)}
                                            onMouseLeave={() => setApplyPromoHovered(false)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                                <div>
                                     <label htmlFor="order-notes" style={{ fontSize: '0.875rem', fontWeight: 'medium', color: 'var(--brand-text)' }}>Add a note</label>
                                     <textarea
                                        id="order-notes"
                                        rows={2}
                                        placeholder="Gift message, special instructions..."
                                        style={{
                                            width: '100%',
                                            marginTop: '0.25rem',
                                            border: '1px solid #D1D5DB',
                                            borderRadius: '0.375rem',
                                            padding: '0.5rem',
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            borderColor: isNotesTextareaFocused ? 'var(--brand-pink)' : '#D1D5DB',
                                            boxShadow: isNotesTextareaFocused ? '0 0 0 1px var(--brand-pink)' : 'none',
                                        }}
                                        onFocus={() => setNotesTextareaFocused(true)}
                                        onBlur={() => setNotesTextareaFocused(false)}
                                    ></textarea>
                                </div>
                            </div>
                            <Link
                                href="/checkout"
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    width: '100%',
                                    marginTop: '1.5rem',
                                    backgroundColor: 'var(--brand-button-bg)',
                                    color: 'white',
                                    padding: '0.75rem 0',
                                    borderRadius: '9999px',
                                    fontWeight: 'bold',
                                    transition: 'opacity 0.3s',
                                    opacity: isProceedToCheckoutHovered ? 0.9 : 1,
                                }}
                                onMouseEnter={() => setProceedToCheckoutHovered(true)}
                                onMouseLeave={() => setProceedToCheckoutHovered(false)}
                            >
                                Proceed to Checkout
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;