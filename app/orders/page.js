'use client';
import React, { useState } from 'react'; // Import useState for hover effects
import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';

const MyOrdersPage = () => {
    const { orders, products } = useAppContext();

    const getProductDetails = (productId) => {
        return products.find(p => p.id === productId);
    };

    // State for hover effects
    const [isStartShoppingHovered, setStartShoppingHovered] = useState(false);
    const [isBackToAccountHovered, setBackToAccountHovered] = useState(false);

    const getStatusChipStyle = (status) => {
        let backgroundColor = '';
        let textColor = '';
        switch (status) {
            case 'Delivered':
                backgroundColor = '#D1FAE5'; // bg-green-100
                textColor = '#065F46'; // text-green-800
                break;
            case 'Shipped':
                backgroundColor = '#DBEAFE'; // bg-blue-100
                textColor = '#1E40AF'; // text-blue-800
                break;
            case 'Processing':
                backgroundColor = '#FEF3C7'; // bg-yellow-100
                textColor = '#92400E'; // text-yellow-800
                break;
            case 'Pending':
                backgroundColor = '#FFEDD5'; // bg-orange-100
                textColor = '#9A3412'; // text-orange-800
                break;
            case 'Cancelled':
                backgroundColor = '#FEE2E2'; // bg-red-100
                textColor = '#991B1B'; // text-red-800
                break;
            default:
                backgroundColor = '#F3F4F6'; // bg-gray-100
                textColor = '#4B5563'; // text-gray-800
        }
        return {
            padding: '0.25rem 0.75rem', // px-3 py-1
            display: 'inline-flex',
            fontSize: '0.75rem', // text-xs
            lineHeight: '1.25rem', // leading-5
            fontWeight: '600', // font-semibold
            borderRadius: '9999px', // rounded-full
            backgroundColor: backgroundColor,
            color: textColor,
        };
    };

    return (
        <div style={{}}> {/* No direct style for empty className */}
            <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1rem' /* max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 */ }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' /* mb-12 */ }}>
                    <h1 style={{ fontSize: '2.25rem', fontFamily: 'serif', fontWeight: 'bold', color: '#3D5A5D' /* text-4xl font-serif font-bold text-[#3D5A5D] */ }}>My Orders</h1>
                    <p style={{ color: '#A0B8BA', marginTop: '0.5rem' /* text-[#A0B8BA] mt-2 */ }}>View your order history and status.</p>
                </div>

                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 0', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' /* text-center py-20 bg-white rounded-lg shadow-md */ }}>
                        <p style={{ fontSize: '1.25rem', color: '#A0B8BA', marginBottom: '1rem' /* text-xl text-[#A0B8BA] mb-4 */ }}>You have no orders yet.</p>
                        <Link
                            href="/"
                            style={{
                                backgroundColor: '#4A6D70', // bg-[#4A6D70]
                                color: 'white',
                                padding: '0.75rem 2rem', // px-8 py-3
                                borderRadius: '9999px', // rounded-full
                                fontWeight: 'bold',
                                opacity: isStartShoppingHovered ? 0.9 : 1, // hover:opacity-90
                                transition: 'opacity 0.3s', // transition-colors
                            }}
                            onMouseEnter={() => setStartShoppingHovered(true)}
                            onMouseLeave={() => setStartShoppingHovered(false)}
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' /* space-y-8 */ }}>
                        {orders.map(order => {
                            console.log('Order object in MyOrdersPage:', order);
                            return (
                            <div key={order.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' /* bg-white p-6 rounded-lg shadow-md */ }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1rem', gap: '1rem' /* flex flex-wrap justify-between items-center border-b pb-4 mb-4 gap-4 */ }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'semibold', color: '#3D5A5D' /* text-lg font-semibold text-[#3D5A5D] */ }}>Order ID: {order.id}</h2>
                                        <p style={{ fontSize: '0.875rem', color: '#A0B8BA' /* text-sm text-[#A0B8BA] */ }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <span style={getStatusChipStyle(order.orderStatus)}> {/* Changed order.status to order.orderStatus */}
                                            {order.orderStatus} {/* Changed order.status to order.orderStatus */}
                                        </span>
                                        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#3D5A5D', textAlign: 'right', marginTop: '0.25rem' /* text-lg font-bold text-[#3D5A5D] text-right mt-1 */ }}>AED {order.totalAmount.toFixed(2)}</p> {/* Changed order.total_amount to order.totalAmount */}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 'semibold', color: '#3D5A5D', marginBottom: '0.5rem' }}>Shipping Details:</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#A0B8BA' }}>{order.customerName} ({order.customerEmail})</p>
                                    <p style={{ fontSize: '0.875rem', color: '#A0B8BA' }}>{order.shippingAddress}, {order.city}, {order.zipCode}, {order.country}</p>
                                    <p style={{ fontSize: '0.875rem', color: '#A0B8BA' }}>Phone: {order.customerPhone}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' /* space-y-4 */ }}>
                                    {order.items.map((item, index) => {
                                        const product = getProductDetails(item.productId);
                                        if (!product) return null;
                                        return (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center' /* flex items-center */ }}>
                                            <Image src={product.imageUrls[0]} alt={product.name} width={64} height={64} objectFit="contain" className="rounded-md"/>
                                                <div style={{ marginLeft: '1rem', flexGrow: 1 /* ml-4 flex-grow */ }}>
                                                    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                                                        <p style={{ fontWeight: 'semibold', color: '#3D5A5D', '&:hover': { textDecoration: 'underline' } /* font-semibold text-[#3D5A5D] */ }}>{product.name}</p>
                                                    </Link>
                                                    <p style={{ fontSize: '0.875rem', color: '#A0B8BA' /* text-sm text-[#A0B8BA] */ }}>{item.quantity} x AED {item.price.toFixed(2)}</p> {/* Added AED */}
                                                </div>
                                                <p style={{ fontWeight: 'semibold', color: '#3D5A5D' /* font-semibold text-[#3D5A5D] */ }}>AED {(item.quantity * item.price).toFixed(2)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
                 <div style={{ marginTop: '2rem', textAlign: 'center' /* mt-8 text-center */ }}>
                    <Link
                        href="/account"
                        style={{
                            fontSize: '0.875rem', // text-sm
                            color: '#4A6D70', // text-[#4A6D70]
                            textDecoration: isBackToAccountHovered ? 'underline' : 'none', // hover:underline
                            fontWeight: 'semibold',
                        }}
                        onMouseEnter={() => setBackToAccountHovered(true)}
                        onMouseLeave={() => setBackToAccountHovered(false)}
                    >
                        &larr; Back to Account
                    </Link>
                 </div>
            </div>
        </div>
    );
};

export default MyOrdersPage;