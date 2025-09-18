'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext'; // Import useAppContext

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { showToast: addToast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const { cart, setCart } = useAppContext(); // Consume cart and setCart from AppContext

    // Helper function to save cart to backend
    const saveCartToBackend = useCallback(async (currentCart) => {
        if (!isAuthenticated || !user?.id) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${user.id}/cart`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cart: currentCart }),
            });

            if (!response.ok) {
                throw new Error('Failed to save cart to backend.');
            }
            
        } catch (error) {
            console.error('Error saving cart to backend:', error);
            addToast('Failed to save cart changes.', 'error');
        }
    }, [isAuthenticated, user, addToast]);

    // Fetch user's cart from backend on login
    useEffect(() => {
        const fetchUserCart = async () => {
            if (isAuthenticated && user?.id) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${user.id}/cart`, {
                        headers: {
                            // 'Authorization': `Bearer ${user.token}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch user cart.');
                    }
                    const data = await response.json();
                    const parsedCart = (data.cart || []).map(item => ({
                        ...item,
                        product: {
                            ...item.product,
                            price: parseFloat(item.product.price)
                        }
                    }));
                    setCart(parsedCart); // Use setCart from AppContext
                } catch (error) {
                    console.error('Error fetching user cart:', error);
                    addToast('Failed to load your cart.', 'error');
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
        setCart((prevItems) => { // Use setCart from AppContext
            const existingItemIndex = prevItems.findIndex(item => item.product._id === product._id);

            let updatedItems;
            if (existingItemIndex > -1) {
                updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
            } else {
                updatedItems = [...prevItems, { product, quantity }];
            }
            return updatedItems;
        });
    };

    const removeFromCart = (productId) => {
        setCart((prevItems) => { // Use setCart from AppContext
            const updatedItems = prevItems.filter(item => item.product._id !== productId);
            addToast("Item removed from cart!");
            return updatedItems;
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        setCart((prevItems) => { // Use setCart from AppContext
            const updatedItems = prevItems.map(item =>
                item.product._id === productId ? { ...item, quantity: newQuantity } : item
            );
            return updatedItems;
        });
    };

    const clearCart = () => {
        setCart([]); // Use setCart from AppContext
        addToast("Cart cleared!");
    };

    const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0); // Use cart from AppContext

    return (
        <CartContext.Provider value={{
            cartItems: cart, // Expose cart from AppContext as cartItems
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};