'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { CartContext } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext'; // Import useToast
import { useAuth } from '../context/AuthContext'; // Import useAuth

const CheckoutPage = () => {
    const { cartItems, clearCart } = useContext(CartContext); // Destructure clearCart
    const { contactInfo, shippingAddresses } = useUser();
    const { user } = useAuth(); // Get user from useAuth
    const { showToast } = useToast(); // Get showToast from useToast
    const router = useRouter(); // Initialize useRouter

    const [selectedAddressId, setSelectedAddressId] = useState(shippingAddresses.length > 0 ? shippingAddresses[0].id : null);

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal > 50 ? 0 : 10;
    const total = subtotal + shipping;

    const selectedAddress = shippingAddresses.find(addr => addr.id === selectedAddressId);

    // State for hover effects
    const [isChangeContactHovered, setChangeContactHovered] = useState(false);
    const [isManageAddressesHovered, setManageAddressesHovered] = useState(false);
    const [isAddAddressHovered, setAddAddressHovered] = useState(false);
    const [isPlaceOrderHovered, setPlaceOrderHovered] = useState(false);
    const [isReturnToCartHovered, setReturnToCartHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            showToast('Please select a shipping address.', 'error');
            return;
        }
        if (cartItems.length === 0) {
            showToast('Your cart is empty.', 'error');
            return;
        }
        if (!user || !user.id) {
            showToast('You must be logged in to place an order.', 'error');
            router.push('/login'); // Redirect to login if not authenticated
            return;
        }

        const orderData = {
            customer_name: contactInfo.name,
            customer_email: contactInfo.email,
            customer_phone: contactInfo.phone,
            shipping_address: selectedAddress.address_line1,
            city: selectedAddress.city,
                        zip_code: selectedAddress.zip_code, // Use selectedAddress.zip_code
            payment_method: 'Cash on Delivery',
            total_amount: total,
            shipping_scheduled_date: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format for MySQL DATETIME
            user_id: user.id,
            items: cartItems.map(item => ({ // Add items array
                productId: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
            })),
        };

        

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if your API requires it
                    // 'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to place order.');
            }

            const result = await response.json();
            showToast('Order placed successfully!', 'success');
            clearCart(); // Clear the cart after successful order
            router.push(`/orders/${result.orderId}`); // Redirect to order confirmation page
        } catch (error) {
            console.error('Error placing order:', error);
            showToast(error.message || 'An error occurred while placing your order.', 'error');
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--brand-secondary)' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '3rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.25rem', fontFamily: 'serif', fontWeight: 'bold', color: 'var(--brand-text)' }}>Checkout</h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '3rem', alignItems: 'flex-start' }}>
                    {/* Left Side: Forms */}
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Contact Information */}
                        <section>
                            <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', color: 'var(--brand-text)', marginBottom: '1rem' }}>Contact Information</h2>
                             <div style={{ padding: '1rem', backgroundColor: 'var(--brand-secondary)', borderRadius: '0.375rem', border: '1px solid #E5E7EB' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--brand-text)' }}><span style={{ fontWeight: 'semibold' }}>{contactInfo.name}</span> ({contactInfo.email})</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--brand-muted)', marginTop: '0.25rem' }}>{contactInfo.phone}</p>
                                    </div>
                                    <Link
                                        href="/account"
                                        style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--brand-blue)',
                                            textDecoration: isChangeContactHovered ? 'underline' : 'none',
                                            fontWeight: 'semibold',
                                            flexShrink: 0,
                                            marginLeft: '1rem',
                                        }}
                                        onMouseEnter={() => setChangeContactHovered(true)}
                                        onMouseLeave={() => setChangeContactHovered(false)}
                                    >
                                        Change
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* Shipping Address */}
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', color: 'var(--brand-text)' }}>Shipping Address</h2>
                                <Link
                                    href="/account"
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--brand-blue)',
                                        textDecoration: isManageAddressesHovered ? 'underline' : 'none',
                                        fontWeight: 'semibold',
                                    }}
                                    onMouseEnter={() => setManageAddressesHovered(true)}
                                    onMouseLeave={() => setManageAddressesHovered(false)}
                                >
                                    Manage Addresses
                                </Link>
                            </div>

                            {shippingAddresses.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {shippingAddresses.map(addr => (
                                        <label
                                            key={addr.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                padding: '1rem',
                                                border: `1px solid ${selectedAddressId === addr.id ? 'var(--brand-pink)' : '#E5E7EB'}`,
                                                borderRadius: '0.375rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: selectedAddressId === addr.id ? '0 0 0 2px var(--brand-pink)' : 'none',
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="shippingAddress"
                                                value={addr.id}
                                                checked={selectedAddressId === addr.id}
                                                onChange={() => setSelectedAddressId(addr.id)}
                                                style={{
                                                    marginTop: '0.25rem',
                                                    marginRight: '1rem',
                                                    height: '1rem',
                                                    width: '1rem',
                                                    color: 'var(--brand-pink)',
                                                    borderColor: '#D1D5DB',
                                                    outline: 'none',
                                                    boxShadow: '0 0 0 1px var(--brand-pink)', // focus:ring-brand-pink
                                                }}
                                            />
                                            <div>
                                                <p style={{ fontWeight: 'semibold', color: 'var(--brand-text)' }}>{addr.firstName} {addr.lastName}</p>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--brand-muted)' }}>{addr.address}, {addr.city}, {addr.postalCode}, {addr.country}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--brand-secondary)', borderRadius: '0.375rem' }}>
                                    <p style={{ color: 'var(--brand-muted)' }}>You have no saved shipping addresses.</p>
                                    <Link
                                        href="/account"
                                        style={{
                                            marginTop: '0.5rem',
                                            display: 'inline-block',
                                            backgroundColor: 'var(--brand-blue)',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '9999px',
                                            fontWeight: 'semibold',
                                            fontSize: '0.875rem',
                                            opacity: isAddAddressHovered ? 0.9 : 1,
                                        }}
                                        onMouseEnter={() => setAddAddressHovered(true)}
                                        onMouseLeave={() => setAddAddressHovered(false)}
                                    >
                                        Add an Address
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Payment Method */}
                        <section>
                             <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', color: 'var(--brand-text)', marginBottom: '1rem' }}>Payment Method</h2>
                             <div style={{ border: '2px solid var(--brand-pink)', backgroundColor: 'var(--brand-secondary)', borderRadius: '0.375rem', padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem', color: 'var(--brand-blue)', marginRight: '0.75rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <div>
                                        <p style={{ fontWeight: 'semibold', color: 'var(--brand-text)' }}>Cash on Delivery</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--brand-muted)' }}>You will pay when your order is delivered.</p>
                                    </div>
                                </div>
                             </div>
                        </section>

                         <button
                            onClick={handlePlaceOrder} // Attach the handler
                            style={{
                                width: '100%',
                                marginTop: '1.5rem',
                                backgroundColor: 'var(--brand-button-bg)',
                                color: 'white',
                                padding: '0.875rem 0',
                                borderRadius: '9999px',
                                fontWeight: 'bold',
                                fontSize: '1.125rem',
                                opacity: isPlaceOrderHovered ? 0.9 : 1,
                                transition: 'opacity 0.3s',
                                cursor: selectedAddress ? 'pointer' : 'not-allowed',
                            }}
                            disabled={!selectedAddress}
                            onMouseEnter={() => setPlaceOrderHovered(true)}
                            onMouseLeave={() => setPlaceOrderHovered(false)}
                        >
                            Place Order
                        </button>
                    </div>

                    {/* Right Side: Order Summary */}
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', height: 'fit-content', position: isMobile ? 'static' : 'sticky', top: '7rem', marginTop: isMobile ? '2rem' : '0' }}>
                        <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', fontWeight: 'semibold', color: 'var(--brand-text)', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>Order Summary</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '16rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {cartItems.map((item, index) => (
                                <div key={item.product._id || index} style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '4rem', height: '4rem', objectFit: 'cover', borderRadius: '0.375rem' }}/>
                                        <span style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', backgroundColor: 'var(--brand-blue)', color: 'white', fontSize: '0.75rem', borderRadius: '9999px', height: '1.25rem', width: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                                    </div>
                                    <div style={{ marginLeft: '1rem', flexGrow: 1 }}>
                                        <p style={{ fontWeight: 'semibold', color: 'var(--brand-text)', fontSize: '0.875rem' }}>{item.product.name}</p>
                                    </div>
                                    <p style={{ fontWeight: 'semibold', color: 'var(--brand-text)', fontSize: '0.875rem' }}>AED {(item.product.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-text)', fontSize: '0.875rem' }}>
                                <span>Subtotal</span>
                                <span style={{ fontWeight: 'semibold' }}>AED {subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-text)', fontSize: '0.875rem' }}>
                                <span>Shipping</span>
                                <span style={{ fontWeight: 'semibold' }}>{shipping === 0 ? 'Free' : `AED ${shipping.toFixed(2)}`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--brand-text)', borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <span>Total</span>
                                <span>AED {total.toFixed(2)}</span>
                            </div>
                        </div>
                         <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--brand-muted)' }}>
                            <Link
                                href="/cart"
                                style={{
                                    color: 'var(--brand-muted)',
                                    textDecoration: isReturnToCartHovered ? 'underline' : 'none',
                                }}
                                onMouseEnter={() => setReturnToCartHovered(true)}
                                onMouseLeave={() => setReturnToCartHovered(false)}
                            >
                                &larr; Return to Cart
                            </Link>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;