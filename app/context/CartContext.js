'use client';

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext'; // Import useAppContext

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { showToast: addToast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const { cart, setCart } = useAppContext(); // Consume cart and setCart from AppContext
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Helper function to save cart to backend
    const saveCartToBackend = useCallback(async (currentCart) => {
        if (!isAuthenticated || !user?.id) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${user.id}/cart`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cart: currentCart }),
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    console.error('Failed to parse error response as JSON:', e);
                }
                console.error('Failed to save cart to backend:', response.status, response.statusText, errorData);
                throw new Error(`Failed to save cart: ${response.status} ${response.statusText} - ${errorData.message || JSON.stringify(errorData) || 'No additional error information.'}`);
            }
            
        } catch (error) {
            console.error('Error saving cart to backend:', error);
            setTimeout(() => addToast('Failed to save cart changes.', 'error'), 0);
        }
    }, [isAuthenticated, user, addToast]);

    // Fetch user's cart from backend on login
    useEffect(() => {
        const fetchUserCart = async () => {
            if (isAuthenticated && user?.id) {
                try {
                    const response = await fetch(`/api/users/${user.id}/cart`, {
                        headers: {
                            // 'Authorization': `Bearer ${user.token}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch user cart.');
                    }
                    const data = await response.json();
                    const parsedCart = (data.cart || []).map(item => ({
                        id: item.productId, // Map productId to id
                        name: item.name,
                        brand: item.brand, // Assuming brand is directly available in API response
                        price: parseFloat(item.price),
                        originalPrice: parseFloat(item.originalPrice) || parseFloat(item.price), // Handle optional originalPrice
                        quantity: item.quantity,
                        image: item.imageUrl, // Map imageUrl to image
                        size: item.size || undefined, // Handle optional size
                        shade: item.shade || undefined, // Handle optional shade
                    }));
                    setCart(parsedCart); // Use setCart from AppContext
                } catch (error) {
                    console.error('Error fetching user cart:', error);
                    setTimeout(() => addToast('Failed to load your cart.', 'error'), 0);
                    setCart([]); // Clear cart on error
                }
            } else {
                setCart([]); // Clear cart if user logs out
            }
        };

        fetchUserCart();
    }, [isAuthenticated, user, addToast, setCart]); // Add setCart to dependency array

    // Effect to save cart to backend whenever cart changes (debounced or immediate)
    useEffect(() => {
        saveCartToBackend(cart); // Use cart from AppContext
    }, [cart, saveCartToBackend]);


    const addToCart = (product, quantity) => {
        setCart((prevItems) => {
            const existingItemIndex = prevItems.findIndex(item => item.id === product.id);

            let updatedItems;
            if (existingItemIndex > -1) {
                updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
            } else {
                updatedItems = [...prevItems, {
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    price: parseFloat(product.price),
                    originalPrice: parseFloat(product.originalPrice) || parseFloat(product.price),
                    quantity: quantity,
                    image: product.imageUrl,
                    size: product.size,
                    shade: product.shade,
                }];
            }
            return updatedItems;
        });
    };

    const removeFromCart = (productId) => {
        setCart((prevItems) => { // Use setCart from AppContext
            const updatedItems = prevItems.filter(item => item.id !== productId);
            addToast("Item removed from cart!");
            return updatedItems;
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        setCart((prevItems) => { // Use setCart from AppContext
            const updatedItems = prevItems.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            );
            return updatedItems;
        });
    };

    const clearCart = () => {
        setCart([]); // Use setCart from AppContext
        addToast("Cart cleared!");
    };

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const applyCoupon = async (code) => {
        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, totalAmount: subtotal }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to apply coupon');
            }

            const coupon = data;
            let discount = 0;
            if (coupon.discount_type === 'percentage') {
                discount = (subtotal * coupon.discount_value) / 100;
            } else if (coupon.discount_type === 'fixed_amount') {
                discount = coupon.discount_value;
            }

            setDiscountAmount(discount);
            setAppliedCoupon(coupon);
            addToast('Coupon applied successfully!', 'success');
        } catch (error) {
            setDiscountAmount(0);
            setAppliedCoupon(null);
            addToast(error.message, 'error');
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        addToast('Coupon removed.');
    };

    const finalTotal = subtotal - discountAmount;

    return (
        <CartContext.Provider value={{
            cartItems: cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            subtotal,
            appliedCoupon,
            discountAmount,
            finalTotal,
            applyCoupon,
            removeCoupon,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);