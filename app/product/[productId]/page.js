'use client';
import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

import { useAppContext } from '../../context/AppContext';
import { CartContext } from '../../context/CartContext'; // Import CartContext
import { Icon } from '../../components/Icon';
import { useToast } from '../../context/ToastContext';

const ProductDetailPage = () => {
    const { productId } = useParams();
    const { products } = useAppContext(); // Get products from AppContext
    const { addToCart } = useContext(CartContext); // Get addToCart from CartContext
    const { showToast: addToast } = useToast(); // Get showToast from useToast and alias to addToast
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(null);
    
    const [isMinusHovered, setIsMinusHovered] = useState(false);
    const [isPlusHovered, setIsPlusHovered] = useState(false);
    const [isAddHovered, setIsAddHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (products.length > 0 && productId) {
            const foundProduct = products.find(p => p.id.toString() === productId);
            if (foundProduct) {
                setProduct(foundProduct);
                if (foundProduct.imageUrl) {
                    setSelectedImage(foundProduct.imageUrl);
                }
            } else {
                setProduct(null);
            }
        }
    }, [productId, products]);

    const handleQuantityChange = (amount) => {
        setQuantity(prev => Math.max(1, prev + amount));
    };
    
    const handleAddToCart = () => {
        if(product) {
            // Ensure the product has an _id property for consistency with CartContext
            const productWithUnderscoreId = { ...product, _id: product.id };
            addToCart(productWithUnderscoreId, quantity);
            addToast(`Added ${quantity} x ${product.name} to cart!`);
        }
    }

    if (!product) {
        return <div style={{textAlign: 'center', padding: '5rem 0'}}>Loading product...</div>;
    }

    const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];

    return (
        <div style={{maxWidth: '80rem', margin: 'auto', padding: isMobile ? '1.5rem 1rem' : '3rem 2rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: isMobile ? '2rem' : '3rem'}}>
                {/* Product Image Gallery */}
                <div style={{display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '1rem'}}>
                     <div style={{display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '0.5rem', overflowX: isMobile ? 'auto' : 'hidden', overflowY: isMobile ? 'hidden' : 'auto', paddingBottom: isMobile ? '0.5rem' : '0', paddingRight: isMobile ? '0' : '0.5rem'}}>
                        {images.map((url, index) => (
                            <Image 
                                key={index} 
                                src={url} 
                                alt={`${product.name} thumbnail ${index + 1}`}
                                width={80}
                                height={80}
                                objectFit="cover"
                                className="rounded-md cursor-pointer flex-shrink-0"
                                style={{
                                    border: selectedImage === url ? '2px solid var(--brand-pink)' : '1px solid #E5E7EB'
                                }}
                                onClick={() => setSelectedImage(url)}
                            />
                        ))}
                    </div>
                    <div style={{flexGrow: 1}}>
                        <Image src={selectedImage || ''} alt={product.name} layout="responsive" width={700} height={700} objectFit="contain" className="rounded-lg shadow-md" />
                    </div>
                </div>

                {/* Product Details */}
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <p style={{fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--brand-muted)'}}>{product.brandName}</p>
                    <h1 style={{fontSize: isMobile ? '1.875rem' : '2.25rem', fontFamily: 'serif', fontWeight: '700', color: 'var(--brand-text)', marginTop: '0.25rem'}}>{product.name}</h1>
                    <p style={{fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '600', color: 'var(--brand-primary)', marginTop: '1rem'}}>AED {product.price.toFixed(2)}</p>
                    <p style={{color: 'var(--brand-text)', marginTop: '1.5rem', fontSize: '1rem', lineHeight: '1.625'}}>{product.description}</p>
                    
                    <div style={{marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: '9999px'}}>
                            <button 
                                onClick={() => handleQuantityChange(-1)} 
                                style={{
                                    padding: '0.75rem', 
                                    color: 'var(--brand-text)', 
                                    borderRadius: '9999px 0 0 9999px',
                                    backgroundColor: isMinusHovered ? '#F3F4F6' : 'transparent'
                                }} 
                                disabled={quantity <= 1}
                                onMouseEnter={() => setIsMinusHovered(true)}
                                onMouseLeave={() => setIsMinusHovered(false)}
                            >
                                <Icon name="minus" className="w-5 h-5"/>
                            </button>
                            <span style={{padding: '0 1.5rem', fontWeight: '600', fontSize: '1.125rem'}}>{quantity}</span>
                             <button 
                                onClick={() => handleQuantityChange(1)} 
                                style={{
                                    padding: '0.75rem', 
                                    color: 'var(--brand-text)', 
                                    borderRadius: '0 9999px 9999px 0',
                                    backgroundColor: isPlusHovered ? '#F3F4F6' : 'transparent'
                                }}
                                onMouseEnter={() => setIsPlusHovered(true)}
                                onMouseLeave={() => setIsPlusHovered(false)}
                            >
                                <Icon name="plus" className="w-5 h-5"/>
                            </button>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            style={{
                                flexGrow: 1,
                                backgroundColor: 'var(--brand-button-bg)',
                                color: 'white',
                                padding: '0.875rem 0',
                                borderRadius: '9999px',
                                fontWeight: '700',
                                fontSize: '1.125rem',
                                transition: 'background-color 0.3s',
                                opacity: isAddHovered ? 0.9 : 1
                            }}
                            onMouseEnter={() => setIsAddHovered(true)}
                            onMouseLeave={() => setIsAddHovered(false)}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;